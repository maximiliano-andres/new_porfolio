/* 60-second guided walkthrough: step script and narration bar. */
import { useEffect, useRef } from "react";
import { m } from "framer-motion";
import { Pause, Play, SkipForward, X } from "lucide-react";
import { AUTO_TOUR_MS } from "../data/system.js";
import { HR_ACCENT } from "../styles/theme.js";

export function AutoTourBar({ tour, bottom, onNext, onTogglePlay, onStop }) {
  const stepMs = AUTO_TOUR_MS / tour.steps.length;
  // one timer per step (paused time is kept), and the progress bar is a CSS animation paused/resumed with
  // animation-play-state: no re-render every 100 ms for a minute
  const remaining = useRef({ i: tour.i, ms: stepMs });
  if (remaining.current.i !== tour.i) remaining.current = { i: tour.i, ms: stepMs };
  useEffect(() => {
    if (!tour.playing) return;
    const started = performance.now();
    const t = setTimeout(onNext, Math.max(0, remaining.current.ms));
    return () => {
      clearTimeout(t);
      if (remaining.current.i === tour.i) remaining.current.ms -= performance.now() - started;
    };
  }, [tour.playing, tour.i, onNext]);

  const step = tour.steps[tour.i];
  return (
    <div className="fixed inset-x-0 z-[120] flex justify-center px-2 pointer-events-none" style={{ bottom }}>
    <m.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      role="region"
      aria-label="Recorrido guiado"
      className="w-full max-w-[560px] rounded-xl border px-3.5 py-2.5 shadow-2xl pointer-events-auto"
      style={{ background: "rgba(10,14,20,0.96)", borderColor: `${HR_ACCENT}44` }}
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-[10.5px] tabular-nums" style={{ color: HR_ACCENT, fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
          {tour.i + 1}/{tour.steps.length}
        </span>
        <p className="flex-1 min-w-0 text-[12px] sm:text-[12.5px] text-white/85 leading-5" aria-live="polite">{step.text}</p>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onTogglePlay} aria-label={tour.playing ? "Pausar recorrido" : "Reanudar recorrido"} className="w-8 h-8 rounded-md flex items-center justify-center text-white/70 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden">
            {tour.playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button onClick={onNext} aria-label="Siguiente paso" className="w-8 h-8 rounded-md flex items-center justify-center text-white/70 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden">
            <SkipForward size={14} />
          </button>
          <button onClick={onStop} aria-label="Terminar recorrido" className="w-8 h-8 rounded-md flex items-center justify-center text-white/70 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex gap-1 mt-2">
        {tour.steps.map((_, n) => (
          <span key={n} className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
            {n === tour.i ? (
              <span
                key={tour.i}
                className="block h-full w-full rounded-full origin-left"
                style={{ background: HR_ACCENT, animation: `tourfill ${stepMs}ms linear both ${tour.playing ? "running" : "paused"}` }}
              />
            ) : (
              <span className="block h-full rounded-full" style={{ width: n < tour.i ? "100%" : "0%", background: HR_ACCENT }} />
            )}
          </span>
        ))}
      </div>
    </m.div>
    </div>
  );
}
