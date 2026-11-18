/* Coach-mark tour that spotlights real UI elements. */
import { useEffect, useMemo, useRef, useState } from "react";
import { m } from "framer-motion";
import { isTopTrap, useFocusTrap } from "../lib/useFocusTrap.js";
import { CORE } from "../styles/theme.js";
import { useLang, useT } from "../app/context.js";
import { loc } from "../data/system.js";

const COACH_STEPS = [
  { target: '[data-tour="dock"]', title: "Tu barra de navegación", titleEn: "Your navigation bar", text: "Cada ícono abre una sección como una ventana. Tócalo de nuevo para minimizarla.", textEn: "Each icon opens a section as a window. Tap it again to minimize it." },
  { target: '[data-tour="audience"]', title: "Dos formas de leer", titleEn: "Two ways to read", text: "TI muestra el detalle técnico; RRHH lo explica en lenguaje de negocio. Cámbialo cuando quieras.", textEn: "Tech shows the technical detail; HR explains it in business terms. Switch anytime." },
  { target: '[data-tour="lang"]', title: "Español o inglés", titleEn: "Spanish or English", text: "Todo el portafolio está disponible en ambos idiomas.", textEn: "The whole portfolio is available in both languages." },
  { target: '[data-tour="core"]', title: "El núcleo CORE", titleEn: "The CORE hub", text: "Es el centro de control del sistema: tócalo para ver todos los módulos a la vez.", textEn: "The system's control center: tap it to see every module at once." },
  { target: '[data-tour="palette"]', title: "Busca lo que quieras", titleEn: "Search for anything", text: "Escribe «contacto», «hobbies» o «simulador» y llega directo. Con teclado: Ctrl + K.", textEn: "Type “contact”, “hobbies” or “simulator” and go straight there. Keyboard: Ctrl + K." },
  { target: '[data-tour="progress"]', title: "Explora y gana insignias", titleEn: "Explore and earn badges", text: "Tu avance se guarda aquí. ¿Llegarás al 100%?", textEn: "Your progress is saved here. Can you reach 100%?" },
];

export function CoachTour({ open, onClose, onFinish }) {
  const t = useT();
  const { lang } = useLang();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const steps = useMemo(
    () => (open ? COACH_STEPS.filter((st) => document.querySelector(st.target)?.getBoundingClientRect().width) : []),
    [open]
  );
  const step = steps[i];
  const cardRef = useRef(null);
  useFocusTrap(cardRef, Boolean(open && step && rect), { focusFirst: true, restore: true, focusKey: i });

  useEffect(() => { if (open) setI(0); }, [open]);
  // nothing to point at (every target hidden): close instead of leaving an invisible tour that blocks shortcuts
  useEffect(() => { if (open && steps.length === 0) onClose(); }, [open, steps.length, onClose]);

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
      if (cardRef.current && !isTopTrap(cardRef)) return; // another modal (palette) is on top: its keys
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
    <div className="fixed inset-0 z-[260]" role="dialog" aria-modal="true" aria-label={t("Tour guiado", "Guided tour")}>
      <m.div
        className="fixed rounded-[14px] pointer-events-none"
        animate={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        style={{ boxShadow: `0 0 0 9999px rgba(3,5,9,0.74), 0 0 0 2px ${CORE}, 0 0 24px ${CORE}66` }}
      />
      <m.div
        ref={cardRef}
        // no key per step: remounting the card sent the focus back to "Saltar tour" after each "Siguiente"
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
        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: CORE, fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
          {t("Paso", "Step")} {i + 1} {t("de", "of")} {steps.length}
        </div>
        <div className="text-[14px] font-semibold text-white mb-1" style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>{loc(step, "title", lang)}</div>
        <p className="text-[12.5px] text-white/70 leading-5">{loc(step, "text", lang)}</p>
        <div className="flex items-center justify-between gap-2 mt-4">
          <button onClick={onClose} className="text-[11.5px] text-white/65 hover:text-white px-1 py-1.5 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden rounded-sm">
            {t("Saltar tour", "Skip tour")}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setI((n) => n - 1)}
              disabled={i === 0}
              className="rounded-md border border-white/15 px-3 py-1.5 text-[12px] text-white/75 disabled:opacity-40 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
            >
              {t("Atrás", "Back")}
            </button>
            <button
              data-autofocus
              onClick={() => (last ? onFinish() : setI((n) => n + 1))}
              className="rounded-md px-3 py-1.5 text-[12px] font-medium focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden"
              style={{ background: CORE, color: "#05070b" }}
            >
              {last ? t("¡Listo!", "Done!") : t("Siguiente", "Next")}
            </button>
          </div>
        </div>
      </m.div>
    </div>
  );
}
