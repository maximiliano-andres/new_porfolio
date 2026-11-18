/* "Hobbies" window: swimming, mountain biking and constant learning, each with a small playable scene and an
   optional photo gallery (photos are listed in data/hobbies.js). */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { BookOpen, Camera, ChevronLeft, ChevronRight, Flag, ImagePlus, Play, X } from "lucide-react";
import { useLang, useSystem, useT } from "../app/context.js";
import { HOBBIES } from "../data/hobbies.js";
import { loc } from "../data/system.js";
import { useContent } from "../data/useContent.js";
import { prefersReducedMotion } from "../lib/env.js";
import { sound } from "../lib/sound.js";
import { isTopTrap, useFocusTrap } from "../lib/useFocusTrap.js";

const MONO = { fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" };
const DISPLAY = { fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" };
const btnCls = "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden";

/* ---------------- swimming: swim laps across the pool ---------------- */
const LAP_M = 25;
function SwimScene({ color }) {
  const t = useT();
  const [laps, setLaps] = useState(0);
  const [swimming, setSwimming] = useState(false);
  const toRight = laps % 2 === 0; // direction of the next lap
  const x = swimming ? (toRight ? 318 : 42) : (toRight ? 42 : 318);
  const swim = () => {
    if (swimming) return;
    sound.play("click");
    setSwimming(true);
  };
  const done = () => {
    if (!swimming) return;
    setSwimming(false);
    setLaps((n) => n + 1);
  };
  const meters = laps * LAP_M;
  const cheer = meters >= 200 ? t("¡Modo fondista! 🏅", "Distance swimmer mode! 🏅")
    : meters >= 100 ? t("¡100 metros! Sigue así 💪", "100 meters! Keep going 💪")
      : meters > 0 ? t("Buen ritmo. ¿Otro largo?", "Nice pace. Another lap?") : t("Toca el botón para nadar un largo.", "Tap the button to swim a lap.");
  return (
    <div>
      <div className="rounded-lg overflow-hidden border border-white/10" style={{ background: "#062033" }}>
        <svg viewBox="0 0 360 140" className="w-full h-auto block" role="img" aria-label={t(`Piscina: ${laps} largos nadados`, `Pool: ${laps} laps swum`)}>
          <defs>
            <linearGradient id="pool" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0e7490" />
              <stop offset="1" stopColor="#0c4a6e" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="360" height="140" fill="url(#pool)" />
          {/* lane ropes */}
          {[35, 70, 105].map((y) => (
            <line key={y} x1="20" y1={y} x2="340" y2={y} stroke="#fde047" strokeWidth="2" strokeDasharray="6 5" opacity="0.7" />
          ))}
          {/* walls */}
          <rect x="0" y="0" width="20" height="140" fill="#e0f2fe" opacity="0.25" />
          <rect x="340" y="0" width="20" height="140" fill="#e0f2fe" opacity="0.25" />
          {/* water shimmer */}
          <g style={{ animation: "waveshift 3s linear infinite" }} opacity="0.35">
            {[18, 52, 88, 122].map((y) => (
              <path key={y} d={`M0,${y} ${"q10,-4 20,0 t20,0 ".repeat(11)}`} fill="none" stroke="#bae6fd" strokeWidth="1" />
            ))}
          </g>
          {/* swimmer, in the middle lane */}
          <m.g initial={false} animate={{ x }} transition={{ duration: prefersReducedMotion() ? 0 : 1.7, ease: "easeInOut" }} onAnimationComplete={done}>
            <g transform={`translate(0 87) scale(${toRight ? 1.35 : -1.35} 1.35)`}>
              {swimming && (
                <g opacity="0.8">
                  <circle cx="-22" cy="-2" r="2.5" fill="#e0f2fe" style={{ animation: "bob 0.4s ease-in-out infinite" }} />
                  <circle cx="-28" cy="2" r="1.8" fill="#e0f2fe" style={{ animation: "bob 0.5s ease-in-out infinite" }} />
                </g>
              )}
              <ellipse cx="0" cy="0" rx="15" ry="4.5" fill="#f1f5f9" opacity="0.9" />
              <path d="M-4,-3 Q4,-14 12,-4" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round" style={swimming ? { animation: "bob 0.35s ease-in-out infinite" } : undefined} />
              <circle cx="17" cy="-1" r="5" fill="#fcd34d" />
              <path d="M12.5,-2 A5,5 0 0 1 21.5,-3" fill={color} stroke={color} strokeWidth="1.5" />
            </g>
          </m.g>
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <button type="button" onClick={swim} disabled={swimming} className={btnCls} style={{ background: color, color: "#05070b" }}>
          <Play size={13} /> {swimming ? t("Nadando…", "Swimming…") : t("Nadar un largo", "Swim a lap")}
        </button>
        <div className="flex gap-4 text-[11px] text-white/70" style={MONO}>
          <span><span className="text-white text-[15px] font-semibold tabular-nums" style={DISPLAY}>{laps}</span> {t("largos", "laps")}</span>
          <span><span className="text-white text-[15px] font-semibold tabular-nums" style={DISPLAY}>{meters}</span> m</span>
        </div>
      </div>
      <p className="text-[11.5px] mt-2" style={{ color }} aria-live="polite">{cheer}</p>
    </div>
  );
}

/* ---------------- mountain bike: pedal up the trail ---------------- */
const TRAIL = "M14,128 C50,126 64,112 96,108 S150,96 176,82 S222,62 250,52 S300,30 338,24";
function MtbScene({ color }) {
  const t = useT();
  const pathRef = useRef(null);
  const [pct, setPct] = useState(0);
  const [geo, setGeo] = useState(null); // { len } once the path is measured
  useLayoutEffect(() => {
    if (pathRef.current) setGeo({ len: pathRef.current.getTotalLength() });
  }, []);
  const pose = useMemo(() => {
    if (!geo || !pathRef.current) return { x: 14, y: 128, angle: 0 };
    const at = (geo.len * pct) / 100;
    const p = pathRef.current.getPointAtLength(at);
    const q = pathRef.current.getPointAtLength(Math.min(geo.len, at + 4));
    const p0 = pathRef.current.getPointAtLength(Math.max(0, at - 4));
    const angle = (Math.atan2(q.y - p0.y, q.x - p0.x) * 180) / Math.PI;
    return { x: p.x, y: p.y, angle };
  }, [geo, pct]);
  const summit = pct >= 100;
  // "pedal" button: climbs 10% per press with a short animation
  const pedal = () => {
    sound.play("click");
    setPct((v) => Math.min(100, v + 10));
  };
  return (
    <div>
      <div className="rounded-lg overflow-hidden border border-white/10" style={{ background: "linear-gradient(#1e1b4b, #312e81 55%, #3b0764)" }}>
        <svg viewBox="0 0 360 140" className="w-full h-auto block" role="img" aria-label={t(`Sendero de montaña: ${pct}% de la subida`, `Mountain trail: ${pct}% of the climb`)}>
          <circle cx="52" cy="30" r="12" fill="#fde68a" opacity="0.85" />
          <polygon points="0,140 70,70 130,120 200,40 260,95 330,15 360,40 360,140" fill="#4c1d95" opacity="0.6" />
          <polygon points="0,140 40,110 110,125 180,85 250,105 320,60 360,80 360,140" fill="#1e1b4b" opacity="0.85" />
          {/* the trail: dashed while ahead, solid where already ridden */}
          <path d={TRAIL} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeDasharray="4 4" />
          <path
            ref={pathRef} d={TRAIL} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={geo ? `${geo.len} ${geo.len}` : undefined}
            strokeDashoffset={geo ? geo.len * (1 - pct / 100) : undefined}
            style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
          />
          {/* summit flag */}
          <g transform="translate(338 24)">
            <line x1="0" y1="0" x2="0" y2="-16" stroke="#e5e7eb" strokeWidth="1.5" />
            <path d="M0,-16 L11,-12 L0,-8 Z" fill={summit ? color : "#9ca3af"} style={summit ? { animation: "bob 0.6s ease-in-out infinite" } : undefined} />
          </g>
          {/* the bike, tilted with the slope */}
          <g style={{ transform: `translate(${pose.x}px, ${pose.y}px) rotate(${pose.angle}deg)`, transition: "transform 0.5s ease-out" }}>
            <g transform="translate(0 -7)">
              <circle cx="-8" cy="0" r="6" fill="none" stroke="#e5e7eb" strokeWidth="1.6" />
              <circle cx="8" cy="0" r="6" fill="none" stroke="#e5e7eb" strokeWidth="1.6" />
              <path d="M-8,0 L-2,-8 L6,-8 L8,0 M-2,-8 L1,0 L-8,0 M6,-8 L5,-11" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M-1,-9 L2,-17 L6,-10" fill="none" stroke="#e5e7eb" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="3" cy="-20" r="3.2" fill={color} />
            </g>
          </g>
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <button type="button" onClick={summit ? () => setPct(0) : pedal} className={btnCls} style={{ background: color, color: "#05070b" }}>
          {summit ? <><Flag size={13} /> {t("Bajar y repetir", "Ride down and repeat")}</> : <><Play size={13} /> {t("Pedalear", "Pedal")}</>}
        </button>
        <label className="flex items-center gap-2 flex-1 min-w-[160px]">
          <span className="sr-only">{t("Avance en la subida", "Climb progress")}</span>
          <input
            type="range" min="0" max="100" step="1" value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="flex-1 h-6"
            style={{ accentColor: color }}
          />
          <span className="text-[11px] tabular-nums text-white/70 w-10 text-right" style={MONO}>{pct}%</span>
        </label>
      </div>
      <p className="text-[11.5px] mt-2" style={{ color }} aria-live="polite">
        {summit ? t("¡Cumbre! La vista siempre vale la subida. 🏁", "Summit! The view is always worth the climb. 🏁")
          : pct >= 50 ? t("Pasaste la mitad: la parte más empinada viene ahora.", "Past halfway: the steepest part is next.")
            : t("Pedalea o arrastra la barra para subir el cerro.", "Pedal or drag the slider to climb the hill.")}
      </p>
    </div>
  );
}

/* ---------------- constant learning: a terminal that types what I'm studying ---------------- */
function StudyScene({ color }) {
  const t = useT();
  const { openWindow } = useSystem();
  const { LEARNING, CERTS, EDUCATION } = useContent();
  const [i, setI] = useState(0);
  const topic = LEARNING[i % LEARNING.length];
  const full = `${topic.name}`;
  const [typed, setTyped] = useState(full);
  useEffect(() => {
    if (prefersReducedMotion()) { setTyped(full); return; }
    setTyped("");
    let n = 0;
    const iv = setInterval(() => {
      n += 1;
      setTyped(full.slice(0, n));
      if (n >= full.length) clearInterval(iv);
    }, 45);
    return () => clearInterval(iv);
  }, [full]);
  // formal learning so far, oldest first
  const milestones = [
    ...EDUCATION.map((e) => ({ year: e.period.split(/\s*[—–-]\s*/)[0], label: e.title })),
    ...CERTS.map((c) => ({ year: String(c.year), label: c.name })),
  ].sort((a, b) => a.year.localeCompare(b.year));
  return (
    <div>
      <div className="rounded-lg border border-white/10 bg-black/60 p-3 text-[11.5px] leading-6" style={MONO}>
        <div className="text-white/50">$ learn --now</div>
        <div>
          <span style={{ color }}>➜</span> <span className="text-white">{typed}</span>
          <span className="inline-block w-[7px] h-[13px] align-[-2px] ml-0.5 animate-pulse" style={{ background: color }} aria-hidden="true" />
        </div>
        <div className="text-white/55 min-h-[24px]">{typed === full ? topic.detail : ""}</div>
        <div className="mt-1 flex gap-1" aria-hidden="true">
          {LEARNING.map((l, k) => (
            <span key={l.id} className="h-1 flex-1 rounded-full" style={{ background: k === i % LEARNING.length ? color : "rgba(255,255,255,0.12)" }} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button type="button" onClick={() => { sound.play("click"); setI((n) => n + 1); }} className={btnCls} style={{ background: color, color: "#05070b" }}>
          <Play size={13} /> {t("Siguiente tema", "Next topic")}
        </button>
        <button type="button" onClick={() => openWindow("notes")} className={`${btnCls} border border-white/15 text-white/80 hover:bg-white/5`}>
          <BookOpen size={13} /> {t("Mis notas técnicas", "My tech notes")}
        </button>
      </div>
      <ol className="mt-4 relative border-l border-white/10 pl-4 space-y-2" aria-label={t("Formación hasta hoy", "Learning so far")}>
        {milestones.map((ms) => (
          <li key={ms.label} className="relative text-[11.5px] leading-5">
            <span className="absolute -left-[21px] top-[6px] w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-white/50 mr-2" style={MONO}>{ms.year}</span>
            <span className="text-white/80">{ms.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const SCENES = { swimming: SwimScene, mtb: MtbScene, study: StudyScene };

/* ---------------- photos: polaroid stack + lightbox ---------------- */
function Lightbox({ photos, index, onIndex, onClose, color }) {
  const t = useT();
  const { lang } = useLang();
  const ref = useRef(null);
  useFocusTrap(ref, true, { focusFirst: true, restore: true });
  useEffect(() => {
    // on document (before the shell's window listener): Esc closes the photo, not the Hobbies window
    const onKey = (e) => {
      if (!isTopTrap(ref)) return;
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      else if (e.key === "ArrowRight") onIndex((index + 1) % photos.length);
      else if (e.key === "ArrowLeft") onIndex((index - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, photos.length, onIndex, onClose]);
  const p = photos[index];
  return createPortal(
    <m.div
      ref={ref}
      role="dialog" aria-modal="true" aria-label={t("Foto ampliada", "Enlarged photo")}
      className="fixed inset-0 z-[320] flex items-center justify-center p-4"
      style={{ background: "rgba(3,5,9,0.88)", backdropFilter: "blur(4px)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <figure className="m-0 max-w-[min(92vw,1100px)] max-h-full flex flex-col items-center">
        <img src={p.src} alt={loc(p, "alt", lang)} width={p.w} height={p.h} className="max-h-[78dvh] w-auto h-auto rounded-md shadow-2xl object-contain" />
        <figcaption className="mt-2 text-[12px] text-white/75 text-center">{loc(p, "alt", lang)} <span className="text-white/40 ml-2" style={MONO}>{index + 1}/{photos.length}</span></figcaption>
      </figure>
      <button onClick={onClose} aria-label={t("Cerrar", "Close")} data-autofocus className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden"><X size={16} /></button>
      {photos.length > 1 && (
        <>
          <button onClick={() => onIndex((index - 1 + photos.length) % photos.length)} aria-label={t("Foto anterior", "Previous photo")} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden"><ChevronLeft size={18} /></button>
          <button onClick={() => onIndex((index + 1) % photos.length)} aria-label={t("Foto siguiente", "Next photo")} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden" style={{ outlineColor: color }}><ChevronRight size={18} /></button>
        </>
      )}
    </m.div>,
    document.body
  );
}

const TILTS = [-5, 4, -2, 6, -4];
function PhotoStack({ hobby }) {
  const t = useT();
  const { lang } = useLang();
  const [open, setOpen] = useState(null);
  const photos = hobby.photos;
  if (!photos.length) {
    // only while developing: where to put the pictures (visitors never see an empty frame)
    if (!import.meta.env.DEV) return null;
    return (
      <div className="mt-4 rounded-lg border border-dashed border-white/20 p-3 flex items-center gap-2.5 text-[11px] text-white/55">
        <ImagePlus size={16} className="shrink-0" />
        <span>DEV · {t("Sin fotos aún: agrégalas en", "No photos yet: add them in")} <code>src/data/hobbies.js</code> → <code>photos</code> (<code>public/img/hobbies/</code>).</span>
      </div>
    );
  }
  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-white/60 mb-3" style={MONO}>
        <Camera size={12} style={{ color: hobby.color }} /> {t("Fotos", "Photos")} ({photos.length})
      </div>
      <div className="flex flex-wrap gap-4 justify-center @md:justify-start pl-2">
        {photos.map((p, i) => (
          <m.button
            key={p.src}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`${t("Ampliar foto", "Enlarge photo")}: ${loc(p, "alt", lang)}`}
            className="bg-[#f8fafc] p-1.5 pb-5 rounded-sm shadow-xl shadow-black/50 focus-visible:ring-2 focus-visible:ring-white/70 focus:outline-hidden"
            style={{ rotate: TILTS[i % TILTS.length] }}
            whileHover={{ rotate: 0, scale: 1.06, zIndex: 2 }}
            whileFocus={{ rotate: 0, scale: 1.06, zIndex: 2 }}
          >
            <img src={p.src} alt="" width={p.w} height={p.h} loading="lazy" decoding="async" className="w-[120px] h-[96px] object-cover block" />
          </m.button>
        ))}
      </div>
      <AnimatePresence>
        {open !== null && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} color={hobby.color} />}
      </AnimatePresence>
    </div>
  );
}

export function HobbiesContent() {
  const t = useT();
  const { lang } = useLang();
  const { unlock } = useSystem();
  const [active, setActive] = useState(HOBBIES[0].id);
  const tabsRef = useRef(null);
  useEffect(() => { unlock("human"); }, [unlock]);
  const hobby = HOBBIES.find((h) => h.id === active);
  const Scene = SCENES[hobby.id];
  const onTabKey = (e) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = HOBBIES.findIndex((h) => h.id === active);
    const next = HOBBIES[(i + step + HOBBIES.length) % HOBBIES.length];
    setActive(next.id);
    tabsRef.current?.querySelector(`[data-hobby="${next.id}"]`)?.focus();
  };
  return (
    <div className="w-full">
      <p className="text-[12.5px] text-white/65 leading-5 mb-4">
        {t("Más allá del código: lo que hago cuando no estoy frente a un editor. Cada hobby tiene algo para jugar.", "Beyond the code: what I do when I'm away from the editor. Each hobby has something to play with.")}
      </p>
      <div ref={tabsRef} role="tablist" aria-label="Hobbies" onKeyDown={onTabKey} className="grid grid-cols-3 gap-2 mb-4">
        {HOBBIES.map((h) => {
          const on = h.id === active;
          return (
            <button
              key={h.id}
              data-hobby={h.id}
              role="tab"
              id={`hobby-tab-${h.id}`}
              aria-selected={on}
              aria-controls={`hobby-panel-${h.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(h.id)}
              className="relative rounded-lg border px-2 py-2.5 flex flex-col items-center gap-1.5 text-center transition-all focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden hover:-translate-y-0.5"
              style={{ borderColor: on ? `${h.color}99` : "rgba(255,255,255,0.1)", background: on ? `${h.color}1a` : "rgba(255,255,255,0.02)" }}
            >
              <h.Icon size={20} style={{ color: on ? h.color : "rgba(255,255,255,0.6)" }} />
              <span className={`text-[11.5px] leading-4 ${on ? "text-white" : "text-white/70"}`}>{loc(h, "name", lang)}</span>
              {on && <m.span layoutId="hobby-underline" className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full" style={{ background: h.color }} />}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={hobby.id}
          role="tabpanel"
          id={`hobby-panel-${hobby.id}`}
          aria-labelledby={`hobby-tab-${hobby.id}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h3 className="text-[16px] font-semibold text-white" style={DISPLAY}>{loc(hobby, "name", lang)}</h3>
            <span className="text-[10.5px] uppercase tracking-wider" style={{ color: hobby.color, ...MONO }}>{loc(hobby, "tagline", lang)}</span>
          </div>
          <p className="text-[12.5px] text-white/70 leading-6 mb-3">{loc(hobby, "text", lang)}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {hobby.traits.map((tr) => (
              <span key={tr.es} className="rounded-full px-2.5 py-1 text-[11px]" style={{ color: hobby.color, background: `${hobby.color}17`, border: `1px solid ${hobby.color}40` }}>
                {lang === "en" ? tr.en : tr.es}
              </span>
            ))}
          </div>
          <Scene color={hobby.color} />
          <PhotoStack hobby={hobby} />
        </m.div>
      </AnimatePresence>
    </div>
  );
}
