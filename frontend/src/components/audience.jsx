/* TI / RRHH profile switch, ES / EN language switch and the profile cross-fade. Kept apart from ui.jsx on purpose: the shell (top bar, hero,
   window chrome) only needs these two, so the charts and diagrams in ui.jsx stay out of the initial chunk. */
import { useId, useRef } from "react";
import { m } from "framer-motion";
import { useAudience, useLang } from "../app/context.js";
import { AUDIENCES, LANGUAGES } from "../data/shell.js";
import { loc } from "../data/system.js";

/* Fitts, top bar only (`edge`): each 24px segment's hit area (an invisible ::after) reaches up to the screen edge
   (11px above it) and 5px down, stopping where windows start (y = 40px on phones). Segments touch each other, so
   their areas never grow sideways. Not used in window title bars or the hero, where there is no edge to lean on. */
const EDGE_HIT = "after:absolute after:content-[''] after:inset-x-0 after:-top-3 after:-bottom-[5px]";

/* radiogroup with a roving tabindex: one Tab stop, arrow keys switch the profile (WAI-ARIA radio pattern) */
export function AudienceToggle({ variant = "compact", edge = false }) {
  const { audience, setAudience } = useAudience();
  const { lang } = useLang();
  const uid = useId();
  const groupRef = useRef(null);
  const long = variant === "long";
  const onKeyDown = (e) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = AUDIENCES.findIndex((a) => a.id === audience);
    const next = AUDIENCES[(i + step + AUDIENCES.length) % AUDIENCES.length];
    setAudience(next.id);
    groupRef.current?.querySelector(`[data-audience-id="${next.id}"]`)?.focus();
  };
  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={lang === "en" ? "Content profile" : "Lenguaje del contenido"}
      className="inline-flex items-center shrink-0 rounded-full border border-white/10 bg-black/40 p-0.5"
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={onKeyDown}
    >
      {AUDIENCES.map((a) => {
        const active = audience === a.id;
        return (
          <button
            key={a.id}
            data-audience-id={a.id}
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            title={loc(a, "hint", lang)}
            onClick={() => setAudience(a.id)}
            className={`relative inline-flex items-center rounded-full font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden ${edge ? EDGE_HIT : ""} ${long ? "gap-1.5 px-3.5 py-1.5 text-[12px]" : "gap-1 px-2.5 py-[7px] text-[10px] leading-none"
              }`}
            style={{ color: active ? "#05070b" : "rgba(255,255,255,0.68)", fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}
          >
            {active && (
              <m.span
                layoutId={`audience-pill-${uid}`}
                className="absolute inset-0 rounded-full"
                style={{ background: a.color }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {long && <a.Icon size={13} />}
              {long ? loc(a, "long", lang) : loc(a, "label", lang)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ES / EN switch: same radio pattern, two options */
export function LangToggle({ className = "", edge = false }) {
  const { lang, setLang } = useLang();
  const groupRef = useRef(null);
  const onKeyDown = (e) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next = lang === "es" ? "en" : "es";
    setLang(next);
    groupRef.current?.querySelector(`[data-lang-id="${next}"]`)?.focus();
  };
  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={lang === "en" ? "Language" : "Idioma"}
      className={`inline-flex items-center shrink-0 rounded-full border border-white/10 bg-black/40 p-0.5 ${className}`}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={onKeyDown}
    >
      {LANGUAGES.map((l) => {
        const active = lang === l.id;
        return (
          <button
            key={l.id}
            data-lang-id={l.id}
            role="radio"
            aria-checked={active}
            aria-label={l.name}
            lang={l.id}
            tabIndex={active ? 0 : -1}
            title={l.name}
            onClick={() => setLang(l.id)}
            className={`relative rounded-full px-2 py-[7px] text-[10px] leading-none font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden ${edge ? EDGE_HIT : ""}`}
            style={{
              color: active ? "#05070b" : "rgba(255,255,255,0.68)",
              background: active ? "rgba(255,255,255,0.85)" : "transparent",
              fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace",
            }}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

/* cross-fades a window's content when the audience changes */
export function AudienceSwap({ children }) {
  return (
    <m.div className="w-full" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {children}
    </m.div>
  );
}
