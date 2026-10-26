/* Animated circuit background; traces react to open windows and dock hover. */
import { memo, useEffect, useRef } from "react";
import { CIRCUIT_PATHS } from "../data/content.js";
import { useCircuit } from "../lib/circuitStore.js";
import { hasFinePointer, prefersReducedMotion } from "../lib/env.js";
import { CORE } from "../theme.js";

/* energized: trace indexes of open windows (prop, changes only when windows do).
   Hovered trace and one-shot pulses come from the circuit store, so they never re-render the app. */
export const CircuitBackground = memo(function CircuitBackground({ energized }) {
  const { highlighted, pulses } = useCircuit();
  const glowRef = useRef(null);

  // cursor-following glow over the grid — mouse only, never with reduced motion; no React re-renders
  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    let frame = 0;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        glowRef.current?.style.setProperty("--mx", `${e.clientX}px`);
        glowRef.current?.style.setProperty("--my", `${e.clientY}px`);
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("pointermove", onMove); };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#05070b]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(34,211,238,0.09), transparent 60%)",
        }}
      />
      <div
        ref={glowRef}
        className="absolute inset-0 transition-opacity duration-500"
        style={{ background: "radial-gradient(240px circle at var(--mx, -999px) var(--my, -999px), rgba(34,211,238,0.07), transparent 70%)" }}
      />
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.55]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1440" height="900" fill="url(#grid)" />
        {CIRCUIT_PATHS.map((p, i) => {
          const on = energized.includes(i) || highlighted === i;
          return (
            <g key={i}>
              <path
                d={p.d}
                stroke={p.color}
                strokeWidth={on ? 2 : 1.5}
                strokeOpacity={on ? 0.5 : 0.18}
                fill="none"
                style={{ transition: "stroke-opacity 0.4s, stroke-width 0.4s" }}
              />
              <path
                d={p.d}
                stroke={p.color}
                strokeWidth={on ? 2.6 : 2}
                fill="none"
                strokeDasharray="10 22"
                style={{
                  animation: `dashflow ${on ? p.dur / 2.2 : p.dur}s linear ${p.delay}s infinite`,
                  filter: `drop-shadow(0 0 ${on ? 6 : 3}px ${p.color})`,
                }}
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
              style={{ animation: "comet 1.1s ease-out forwards", filter: `drop-shadow(0 0 6px ${p.color}) drop-shadow(0 0 12px ${p.color})` }}
            />
          );
        })}
        <g style={{ animation: "corepulse 3.2s ease-in-out infinite" }}>
          <polygon
            points="760,140 820,175 820,245 760,280 700,245 700,175"
            fill="rgba(34,211,238,0.07)"
            stroke={CORE}
            strokeWidth="1.5"
          />
        </g>
        <text x="760" y="214" textAnchor="middle" fill={CORE} fontSize="9"
          fontFamily="'JetBrains Mono', monospace" opacity="0.85" letterSpacing="1">
          CORE
        </text>
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 45%, transparent 40%, rgba(5,7,11,0.85) 100%)",
        }}
      />
    </div>
  );
});
