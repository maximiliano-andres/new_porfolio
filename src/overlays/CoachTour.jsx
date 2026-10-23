/* Coach-mark tour that spotlights real UI elements. */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CORE } from "../theme.js";

const COACH_STEPS = [
  { target: '[data-tour="dock"]', title: "Tu barra de navegación", text: "Cada ícono abre una sección como una ventana. Tócalo de nuevo para minimizarla." },
  { target: '[data-tour="audience"]', title: "Dos formas de leer", text: "TI muestra el detalle técnico; RRHH lo explica en lenguaje de negocio. Cámbialo cuando quieras." },
  { target: '[data-tour="core"]', title: "El núcleo CORE", text: "Es el centro de control del sistema: tócalo para ver todos los módulos a la vez." },
  { target: '[data-tour="palette"]', title: "Busca lo que quieras", text: "Escribe «contacto», «logros» o «simulador» y llega directo. Con teclado: Ctrl + K." },
  { target: '[data-tour="progress"]', title: "Explora y gana insignias", text: "Tu avance se guarda aquí. ¿Llegarás al 100%?" },
];

export function CoachTour({ open, onClose, onFinish }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const steps = useMemo(
    () => (open ? COACH_STEPS.filter((st) => document.querySelector(st.target)?.getBoundingClientRect().width) : []),
    [open]
  );
  const step = steps[i];

  useEffect(() => { if (open) setI(0); }, [open]);

  useEffect(() => {
    if (!open || !step) return;
    const measure = () => {
      const el = document.querySelector(step.target);
      setRect(el ? el.getBoundingClientRect() : null);
      setVp({ w: window.innerWidth, h: window.innerHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 350); // targets may still be animating in
    return () => { window.removeEventListener("resize", measure); clearTimeout(t); };
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, steps.length]);

  if (!open || !step || !rect) return null;
  const pad = 6;
  const cardW = Math.min(320, vp.w - 24);
  const below = rect.bottom + 12 + 190 < vp.h;
  const cardLeft = Math.min(Math.max(12, rect.left + rect.width / 2 - cardW / 2), vp.w - cardW - 12);
  const last = i === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[260]" role="dialog" aria-modal="true" aria-label="Tour guiado">
      <motion.div
        className="fixed rounded-[14px] pointer-events-none"
        animate={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        style={{ boxShadow: `0 0 0 9999px rgba(3,5,9,0.74), 0 0 0 2px ${CORE}, 0 0 24px ${CORE}66` }}
      />
      <motion.div
        key={i}
        initial={{ opacity: 0, y: below ? -6 : 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed rounded-xl border p-4 shadow-2xl"
        style={{
          width: cardW,
          left: cardLeft,
          ...(below ? { top: rect.bottom + 14 } : { bottom: vp.h - rect.top + 14 }),
          background: "rgba(10,14,20,0.97)",
          borderColor: `${CORE}55`,
        }}
      >
        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: CORE, fontFamily: "'JetBrains Mono', monospace" }}>
          Paso {i + 1} de {steps.length}
        </div>
        <div className="text-[14px] font-semibold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{step.title}</div>
        <p className="text-[12.5px] text-white/70 leading-5">{step.text}</p>
        <div className="flex items-center justify-between gap-2 mt-4">
          <button onClick={onClose} className="text-[11.5px] text-white/45 hover:text-white px-1 py-1.5 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none rounded">
            Saltar tour
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setI((n) => n - 1)}
              disabled={i === 0}
              className="rounded-md border border-white/15 px-3 py-1.5 text-[12px] text-white/70 disabled:opacity-30 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
            >
              Atrás
            </button>
            <button
              onClick={() => (last ? onFinish() : setI((n) => n + 1))}
              className="rounded-md px-3 py-1.5 text-[12px] font-medium focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none"
              style={{ background: CORE, color: "#05070b" }}
            >
              {last ? "¡Listo!" : "Siguiente"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
