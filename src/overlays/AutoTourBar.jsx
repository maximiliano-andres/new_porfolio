/* 60-second guided walkthrough: step script and narration bar. */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, SkipForward, X } from "lucide-react";
import { AUTO_TOUR_MS } from "../data/system.js";
import { HR_ACCENT } from "../theme.js";

export function AutoTourBar({ tour, bottom, onNext, onTogglePlay, onStop }) {
  const stepMs = AUTO_TOUR_MS / tour.steps.length;
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => setElapsed(0), [tour.i]);
  useEffect(() => {
    if (!tour.playing) return;
    const iv = setInterval(() => setElapsed((e) => e + 100), 100);
    return () => clearInterval(iv);
  }, [tour.playing, tour.i]);
  useEffect(() => {
    if (elapsed >= stepMs) onNext();
  }, [elapsed, stepMs, onNext]);

  const step = tour.steps[tour.i];
  return (
    <div className="fixed inset-x-0 z-[120] flex justify-center px-2 pointer-events-none" style={{ bottom }}>
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      role="region"
      aria-label="Recorrido guiado"
      className="w-full max-w-[560px] rounded-xl border px-3.5 py-2.5 shadow-2xl pointer-events-auto"
      style={{ background: "rgba(10,14,20,0.96)", borderColor: `${HR_ACCENT}44`, backdropFilter: "blur(12px)" }}
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-[10.5px] tabular-nums" style={{ color: HR_ACCENT, fontFamily: "'JetBrains Mono', monospace" }}>
          {tour.i + 1}/{tour.steps.length}
        </span>
        <p className="flex-1 min-w-0 text-[12px] sm:text-[12.5px] text-white/85 leading-5" aria-live="polite">{step.text}</p>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onTogglePlay} aria-label={tour.playing ? "Pausar recorrido" : "Reanudar recorrido"} className="w-8 h-8 rounded-md flex items-center justify-center text-white/70 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">
            {tour.playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button onClick={onNext} aria-label="Siguiente paso" className="w-8 h-8 rounded-md flex items-center justify-center text-white/70 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">
            <SkipForward size={14} />
          </button>
          <button onClick={onStop} aria-label="Terminar recorrido" className="w-8 h-8 rounded-md flex items-center justify-center text-white/70 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex gap-1 mt-2">
        {tour.steps.map((_, n) => (
          <span key={n} className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
            <span
              className="block h-full rounded-full"
              style={{ width: n < tour.i ? "100%" : n === tour.i ? `${Math.min(100, (elapsed / stepMs) * 100)}%` : "0%", background: HR_ACCENT }}
            />
          </span>
        ))}
      </div>
    </motion.div>
    </div>
  );
}
