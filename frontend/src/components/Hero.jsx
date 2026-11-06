/* Landing hero. Rendered by the app and, at build time, prerendered into index.html
   (scripts/prerender.mjs) so the first paint doesn't wait for JavaScript. Same component → same markup. */
import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { FileText, FolderGit2, Github, Linkedin, Play, Sparkles, User, Users } from "lucide-react";
import { AudienceToggle } from "./audience.jsx";
import { CORE, HR_ACCENT, LANG, SOCIAL_LINKS } from "../styles/theme.js";

const heroBtn =
  "flex items-center justify-center gap-2 rounded-lg px-4 sm:px-5 py-2.5 2xl:py-3 text-[13.5px] 2xl:text-[15px] font-medium active:scale-[0.98] transition-all focus:outline-hidden whitespace-nowrap";

/* insets: { top, bottom } — px numbers in the app, CSS variables in the prerendered shell.
   animateIn: false when taking over a prerendered shell, so the hero doesn't fade in a second time. */
export function Hero({ hr, insets, animateIn = true, onPrimary, onAbout, onCv, onTour }) {
  // the text is click-through so the CORE hexagon behind it stays clickable — but when the content is taller
  // than the screen (320×568, 700×560…) the hero must take the pointer, or wheel/touch could never scroll it
  // and the last buttons would stay behind the dock
  const scrollRef = useRef(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    check();
    return () => ro.disconnect();
  }, []);
  return (
    <m.div
      data-hero=""
      ref={scrollRef}
      initial={animateIn ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`absolute inset-0 overflow-y-auto overscroll-contain short:pointer-events-auto ${overflows ? "pointer-events-auto" : "pointer-events-none"}`}
      // scroll-padding: a button focused with Tab is scrolled clear of the top bar and the dock (WCAG 2.4.11)
      style={{ scrollbarWidth: "none", scrollPaddingTop: insets.top, scrollPaddingBottom: insets.bottom }}
    >
      <div
        className="min-h-full flex flex-col items-center justify-center px-5 sm:px-8 text-center"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] 2xl:text-[12px] mb-4 2xl:mb-6 low:mb-3 short:mb-2"
          style={{ borderColor: `${CORE}44`, color: CORE, fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}
        >
          <Sparkles size={11} /> Disponible para nuevos proyectos
        </span>
        <h1
          className="text-[28px] min-[380px]:text-[32px] sm:text-[44px] lg:text-[52px] 2xl:text-[64px] short:text-[26px] font-semibold text-white mb-3 2xl:mb-5 low:mb-2 short:mb-2 leading-[1.1] max-w-4xl text-balance"
          style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}
        >
          Maximiliano Andrés Caniullán Lefiñir
        </h1>
        <p className="text-[14px] sm:text-[16px] 2xl:text-[19px] leading-relaxed text-white/65 max-w-md sm:max-w-xl 2xl:max-w-2xl mb-6 2xl:mb-8 low:mb-4 short:mb-4 short:text-[13.5px] text-pretty">
          {hr ? (
            <>Construyo la parte invisible de las aplicaciones —la que procesa cada solicitud de los usuarios— y me especializo en que <span className="text-white/85">funcione más rápido y cueste menos operar</span>. Resultados medidos en Push HR, BiceVida y proyectos para PUMA, GyG e IACC.</>
          ) : (
            <>Backend Developer enfocado en crear sistemas rápidos y eficientes usando <span style={{ color: LANG.java.c1 }}>Java / Spring Boot</span>, <span style={{ color: LANG.python.c2 }}>Python</span> y <span style={{ color: LANG.node.c2 }}>Node.js</span>. Transformo procesos lentos y pesados en sistemas rápidos, estables y con menor consumo de recursos.</>
          )}
        </p>
        <div className="flex flex-col items-center gap-2 mb-6 low:mb-4 short:mb-4 pointer-events-auto">
          <span className="text-[10.5px] uppercase tracking-wider text-white/60" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
            Ver el portafolio como
          </span>
          <AudienceToggle variant="long" />
        </div>
        {/* 2×2 grid of equal buttons on phones, a single row from sm up */}
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-[340px] sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 sm:w-auto sm:max-w-none pointer-events-auto">
          {hr ? (
            <button
              data-hero-action="primary"
              onClick={onPrimary}
              className={`${heroBtn} hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60`}
              style={{ background: `linear-gradient(90deg, ${HR_ACCENT}, ${LANG.java.c1})`, color: "#05070b" }}
            >
              <Users size={14} /> Ficha para RRHH
            </button>
          ) : (
            <button
              data-hero-action="primary"
              onClick={onPrimary}
              className={`${heroBtn} hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60`}
              style={{ background: `linear-gradient(90deg, ${CORE}, ${LANG.node.c1})`, color: "#05070b" }}
            >
              <FolderGit2 size={14} /> Ver proyectos
            </button>
          )}
          <button
            data-hero-action="about"
            onClick={onAbout}
            className={`${heroBtn} border border-white/15 text-white/80 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50`}
          >
            <User size={14} /> Sobre mí
          </button>
          <button
            data-hero-action="cv"
            onClick={onCv}
            className={`${heroBtn} border border-white/15 text-white/80 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50`}
          >
            <FileText size={14} /> Ver CV
          </button>
          <a
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={`${heroBtn} text-white hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60`}
            style={{ background: "#0077b5" }}
          >
            <Linkedin size={15} /> LinkedIn
          </a>
          <a
            href={SOCIAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className={`${heroBtn} border border-white/20 bg-black/40 text-white hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white/50`}
          >
            <Github size={15} /> GitHub
          </a>
          <button
            data-hero-action="tour"
            onClick={onTour}
            className={`${heroBtn} border hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50`}
            style={{ borderColor: `${HR_ACCENT}66`, color: HR_ACCENT }}
          >
            <Play size={14} /> Recorrido de 60 s
          </button>
        </div>
        <p className="mt-6 sm:mt-8 low:mt-4 short:mt-4 text-[10.5px] 2xl:text-[12px] text-white/60 max-w-[300px] sm:max-w-none" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
          explora desde el dock inferior o toca el núcleo <span style={{ color: CORE }}>CORE</span>
          <span className="hidden sm:inline"> · pulsa <kbd className="text-white/75">Ctrl K</kbd> para buscar</span>
        </p>
      </div>
    </m.div>
  );
}
