/* Animated circuit background; traces react to open windows and dock hover.
   Rendering cost is kept low on purpose:
   - static art (grid, base traces, CORE label) lives in its own SVG layer and is painted once;
   - the animated layer has no per-frame `filter` (glow = a wider translucent dashed stroke);
   - the cursor glow is a fixed-size circle moved with `transform` (compositor only, no repaint);
   - everything pauses when it adds nothing: a window is open (the desk is behind it), the visitor has been idle
     for 10 s (it resumes on the next pointer/key/scroll/touch), the device can't keep up (below 45 fps for two
     2-second samples in a row → static for the rest of the visit), or the visitor prefers reduced motion.
   Why: the dashes and the moving dots repaint this full-screen SVG on every frame. Measured over 3 s on the
   landing screen: 381 repaints and ~2.3 s of GPU work while animating, 36 repaints and ~0.07 s when paused. */
import { memo, useEffect, useRef, useState } from "react";
import { CIRCUIT_PATHS } from "../data/shell.js";
import { useCircuit } from "../lib/circuitStore.js";
import { hasFinePointer, usePrefersReducedMotion } from "../lib/env.js";
import { CORE } from "../styles/theme.js";

const SVG_PROPS = { viewBox: "0 0 1440 900", preserveAspectRatio: "xMidYMid slice", fill: "none" };
const GLOW_SIZE = 480;
const IDLE_MS = 10000; // no input for this long → the background stops until the next interaction
const FPS_FLOOR = 45; // below this for SLOW_SAMPLES samples of SAMPLE_MS → static background for this visit
const SAMPLE_MS = 2000;
const SLOW_SAMPLES = 2;
const MEASURE_DELAY_MS = 3000; // skip start-up work (hydration, fonts, chunk downloads) and every resume
const WAKE_EVENTS = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"];

/* energized: trace indexes of open windows (prop, changes only when windows do).
   paused: the desk is covered (maximized window, or any window on a phone).
   Hovered trace and one-shot pulses come from the circuit store, so they never re-render the app. */
export const CircuitBackground = memo(function CircuitBackground({ energized, paused = false }) {
  const { highlighted, pulses } = useCircuit();
  const glowRef = useRef(null);
  const animatedRef = useRef(null);
  const reduced = usePrefersReducedMotion(); // live: turning "reduce motion" on mid-session pauses the SMIL dots too
  const [idle, setIdle] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const still = paused || reduced || idle || lowPower;
  // why it is (not) moving: handy in DevTools and read by the browser tests
  const motion = reduced ? "reduced" : lowPower ? "low-power" : paused ? "paused" : idle ? "idle" : "running";

  // idle: any input restarts the countdown; state only changes on the idle ↔ active edges (no re-render per event)
  useEffect(() => {
    if (reduced) return;
    let timer = setTimeout(() => setIdle(true), IDLE_MS);
    let last = 0;
    const wake = () => {
      const now = performance.now();
      if (now - last < 250) return; // pointermove fires dozens of times a second
      last = now;
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), IDLE_MS);
    };
    const opts = { passive: true, capture: true };
    WAKE_EVENTS.forEach((type) => window.addEventListener(type, wake, opts));
    return () => {
      clearTimeout(timer);
      WAKE_EVENTS.forEach((type) => window.removeEventListener(type, wake, opts));
    };
  }, [reduced]);

  // low-power: counts frames only while the background animates; a gap over 1 s (hidden tab, sleep, debugger)
  // restarts the sample instead of counting as a slow device
  useEffect(() => {
    if (still) return;
    let frame = 0;
    let start = 0;
    let prev = 0;
    let count = 0;
    let slow = 0;
    const tick = (t) => {
      if (!start || t - prev > 1000) { start = t; count = 0; }
      prev = t;
      count += 1;
      if (t - start >= SAMPLE_MS) {
        const fps = ((count - 1) * 1000) / (t - start);
        slow = fps < FPS_FLOOR ? slow + 1 : 0;
        if (slow >= SLOW_SAMPLES) { setLowPower(true); return; }
        start = t;
        count = 1;
      }
      frame = requestAnimationFrame(tick);
    };
    const delay = setTimeout(() => { frame = requestAnimationFrame(tick); }, MEASURE_DELAY_MS);
    return () => { clearTimeout(delay); cancelAnimationFrame(frame); };
  }, [still]);

  // cursor-following glow — mouse only, never with reduced motion; moved on the compositor, no React re-renders
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow || !hasFinePointer() || reduced) return;
    let frame = 0;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        glow.style.opacity = "1";
        glow.style.transform = `translate3d(${e.clientX - GLOW_SIZE / 2}px, ${e.clientY - GLOW_SIZE / 2}px, 0)`;
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      glow.style.opacity = "0";
    };
  }, [reduced]);

  // CSS animations stop via `animation-play-state`; the moving dots are SMIL, which CSS can't pause
  useEffect(() => {
    const svg = animatedRef.current;
    if (!svg) return;
    if (still) svg.pauseAnimations?.();
    else svg.unpauseAnimations?.();
  }, [still]);

  const playState = still ? "paused" : "running";

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#05070b]" aria-hidden="true" data-motion={motion}>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(34,211,238,0.09), transparent 60%)" }}
      />
      <div
        ref={glowRef}
        className="absolute left-0 top-0 rounded-full pointer-events-none"
        style={{
          width: GLOW_SIZE,
          height: GLOW_SIZE,
          opacity: 0,
          willChange: "transform",
          transition: "opacity 0.5s",
          background: "radial-gradient(circle at center, rgba(34,211,238,0.07), transparent 50%)",
        }}
      />

      {/* static layer: painted once */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.55]" {...SVG_PROPS}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1440" height="900" fill="url(#grid)" />
        {CIRCUIT_PATHS.map((p, i) => {
          const on = energized.includes(i) || highlighted === i;
          return (
            <path
              key={i}
              d={p.d}
              stroke={p.color}
              strokeWidth={on ? 2 : 1.5}
              strokeOpacity={on ? 0.5 : 0.18}
              fill="none"
              style={{ transition: "stroke-opacity 0.4s, stroke-width 0.4s" }}
            />
          );
        })}
        <text x="760" y="214" textAnchor="middle" fill={CORE} fontSize="9"
          fontFamily="'JetBrains Mono', 'JetBrains Mono Fallback', monospace" opacity="0.85" letterSpacing="1">
          CORE
        </text>
      </svg>

      {/* animated layer: its own compositing layer, no filters on anything that moves every frame */}
      <svg ref={animatedRef} className="absolute inset-0 w-full h-full opacity-[0.55]" style={{ willChange: "transform" }} {...SVG_PROPS}>
        {CIRCUIT_PATHS.map((p, i) => {
          const on = energized.includes(i) || highlighted === i;
          // play state goes inside the shorthand: mixing `animation` with `animationPlayState` makes React warn
          const animation = `dashflow ${on ? p.dur / 2.2 : p.dur}s linear ${p.delay}s infinite ${playState}`;
          return (
            <g key={i}>
              {/* glow: a wider, translucent copy of the dashes (replaces a per-frame drop-shadow filter) */}
              <path
                d={p.d}
                stroke={p.color}
                strokeWidth={on ? 9 : 6}
                strokeOpacity={on ? 0.22 : 0.14}
                strokeLinecap="round"
                fill="none"
                strokeDasharray="10 22"
                style={{ animation }}
              />
              <path
                d={p.d}
                stroke={p.color}
                strokeWidth={on ? 2.6 : 2}
                fill="none"
                strokeDasharray="10 22"
                style={{ animation }}
              />
              <circle r={on ? 4 : 3} fill={p.color}>
                <animateMotion dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite" path={p.d} />
              </circle>
            </g>
          );
        })}
        {pulses.map((pl) => {
          const p = CIRCUIT_PATHS[pl.idx];
          return (
            <path
              key={pl.key}
              d={p.d}
              pathLength="100"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="12 120"
              // one-shot, 1.1 s: the glow filter is affordable here
              style={{ animation: "comet 1.1s ease-out forwards", filter: `drop-shadow(0 0 6px ${p.color}) drop-shadow(0 0 12px ${p.color})` }}
            />
          );
        })}
        <g style={{ animation: `corepulse 3.2s ease-in-out infinite ${playState}`, transformOrigin: "760px 210px" }}>
          <polygon
            points="760,140 820,175 820,245 760,280 700,245 700,175"
            fill="rgba(34,211,238,0.07)"
            stroke={CORE}
            strokeWidth="1.5"
          />
        </g>
      </svg>

      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, transparent 40%, rgba(5,7,11,0.85) 100%)" }}
      />
    </div>
  );
});
