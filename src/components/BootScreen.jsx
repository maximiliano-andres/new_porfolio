/* Boot sequence staged as a compile log; ends by asking which profile to explore. */
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { BOOT_LINES } from "../data/content.js";
import { AUDIENCES } from "../data/hr.js";
import { prefersReducedMotion } from "../lib/env.js";
import { sound } from "../lib/sound.js";
import { storage } from "../lib/storage.js";
import { CORE } from "../theme.js";

/* onChoose(audience) is called only when the visitor picks a profile; clicking elsewhere skips */
export function BootScreen({ onDone, onChoose, current }) {
  const [count, setCount] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const firstChoiceRef = useRef(null);
  const done = count >= BOOT_LINES.length;

  const finish = useCallback(() => {
    setLeaving(true);
    storage.set("boot_seen", "1");
    setTimeout(onDone, 250);
  }, [onDone]);

  useEffect(() => {
    if (storage.get("boot_seen")) {
      onDone();
      return;
    }
    const lineDelay = prefersReducedMotion() ? 30 : 190;
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= BOOT_LINES.length) clearInterval(iv);
    }, lineDelay);
    return () => clearInterval(iv);
  }, [onDone]);

  useEffect(() => {
    if (done) firstChoiceRef.current?.focus({ preventScroll: true });
  }, [done]);

  const choose = (id) => (e) => {
    e.stopPropagation();
    onChoose(id);
    sound.play("toggle");
    finish();
  };

  return (
    <m.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#05070b] px-4 cursor-pointer"
      onClick={finish}
      animate={leaving ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
      style={{ pointerEvents: leaving ? "none" : "auto" }}
      aria-hidden={leaving}
      role="dialog"
      aria-label="Inicio del portafolio"
    >
      <div
        className="w-full max-w-xl rounded-lg border px-4 py-4 sm:px-6 sm:py-6 cursor-default"
        onClick={(e) => done && e.stopPropagation()}
        style={{
          borderColor: "rgba(34,211,238,0.25)",
          background: "rgba(10,14,20,0.92)",
          boxShadow: "0 0 60px rgba(34,211,238,0.08)",
          fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace",
        }}
      >
        <div className="flex items-center gap-1.5 pb-3 mb-3 border-b border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-3 text-[11px] text-white/40">boot — polyglot_core</span>
        </div>
        <div className="text-[9.5px] min-[380px]:text-[11px] sm:text-[13px] leading-5 sm:leading-6 min-h-[180px] sm:min-h-[210px] short:min-h-0 overflow-x-auto" role="status" aria-live="polite">
          {BOOT_LINES.slice(0, count).map((line, i) => (
            <div
              key={i}
              style={{
                color: line.kind === "ok" ? "#7CC576" : CORE,
                whiteSpace: "pre",
              }}
            >
              {line.t}
            </div>
          ))}
        </div>
        <AnimatePresence>
          {done && (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <p className="text-[12px] sm:text-[13px] mb-3" style={{ color: CORE }}>
                $ select --profile <span className="animate-pulse">_</span>
              </p>
              <p className="text-[12.5px] text-white/70 mb-3" style={{ fontFamily: "'Inter', 'Inter Fallback', sans-serif" }}>
                ¿Cómo quieres explorar este portafolio?
              </p>
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5">
                {AUDIENCES.map((a, i) => (
                  <button
                    key={a.id}
                    ref={i === 0 ? firstChoiceRef : undefined}
                    onClick={choose(a.id)}
                    className="group text-left rounded-lg border px-3.5 py-3 transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden"
                    style={{ borderColor: `${a.color}${current === a.id ? "88" : "40"}`, background: `${a.color}0f` }}
                  >
                    <span className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: a.color }}>
                      <a.Icon size={15} /> {a.long}
                    </span>
                    <span className="block text-[11.5px] text-white/60 mt-1 leading-4" style={{ fontFamily: "'Inter', 'Inter Fallback', sans-serif" }}>
                      {a.id === "ti" ? "Tecnologías, arquitectura y métricas." : "Lenguaje de negocio, sin tecnicismos."}
                    </span>
                  </button>
                ))}
              </div>
            </m.div>
          )}
        </AnimatePresence>
        <p className="mt-3 text-right text-[10px] text-white/30" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
          {done ? "puedes cambiarlo después desde la barra superior" : <>clic para saltar &rarr;</>}
        </p>
      </div>
    </m.div>
  );
}
