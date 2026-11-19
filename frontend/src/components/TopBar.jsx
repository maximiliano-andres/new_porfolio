/* Top bar: live-ish system metrics, exploration progress, search, sound and profile toggle. */
import { useCallback, useEffect, useState } from "react";
import { Cpu, Gauge, Github, Linkedin, MemoryStick, Search, ShieldCheck, Trophy, Volume2, VolumeX, Zap } from "lucide-react";
import { AudienceToggle, LangToggle } from "./audience.jsx";
import { useT } from "../app/context.js";
import { CORE, HR_ACCENT, LANG, SOCIAL_LINKS } from "../styles/theme.js";

/* metrics follow what the visitor does: every open window is a "process" that adds load */
export function TopBar({ scale = 1, openCount = 0, progress = 0, onPalette, onBadges, soundOn, onToggleSound }) {
  const loadFor = useCallback((n) => ({
    cpu: Math.min(96, 6 + n * 9 + Math.round(Math.random() * 5)),
    mem: Math.min(94, 18 + n * 6 + Math.round(Math.random() * 3)),
    lat: 5 + Math.round(Math.random() * 4) + n,
  }), []);
  const t = useT();
  const [stats, setStats] = useState(() => loadFor(openCount));
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    setStats(loadFor(openCount));
    const tick = () => {
      if (document.hidden) return;
      setStats(loadFor(openCount));
      setTime(new Date());
    };
    const iv = setInterval(tick, 2200);
    return () => clearInterval(iv);
  }, [openCount, loadFor]);
  const item = (Icon, label, val, unit, color) => (
    <div className="flex items-center gap-1.5" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
      <Icon size={12} style={{ color }} />
      <span className="text-[10.5px] text-white/60">{label}</span>
      <span className="text-[10.5px] tabular-nums" style={{ color }}>{val}{unit}</span>
    </div>
  );
  /* Fitts: 28px buttons whose hit area (invisible ::after) reaches the top edge of the screen (9px above them), goes
     3px down (to y = 40px, where windows start on phones) and fills half the gap to each neighbour
     (gap-1.5 = 6px → 3px, sm:gap-2.5 = 10px → 5px) */
  const iconBtn = "relative inline-flex items-center justify-center gap-1.5 h-7 min-w-[28px] rounded-full border border-white/10 bg-black/40 px-2 text-white/70 hover:text-white hover:border-white/25 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden after:absolute after:content-[''] after:-top-3 after:-bottom-[3px] after:-inset-x-[3px] sm:after:-inset-x-[5px]";
  // GitHub / LinkedIn (desktop): same reach to the top edge. Their -m-1.5 already makes the two boxes touch,
  // so their areas don't grow sideways
  const socialHit = "relative after:absolute after:content-[''] after:inset-x-0 after:-top-3 after:-bottom-[3px]";
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  return (
    <div
      className="fixed top-0 inset-x-0 z-[90] flex items-center justify-between gap-2 px-3 sm:px-6 py-2 pointer-events-none"
      style={{ zoom: scale, background: "linear-gradient(to bottom, rgba(5,7,11,0.75), transparent)" }}
    >
      <div className="flex items-center gap-3 pointer-events-auto min-w-0">

      </div>
      <div data-live className="hidden lg:flex items-center gap-4 pointer-events-auto" title={t("Carga simulada: cada ventana abierta es un proceso", "Simulated load: every open window is a process")}>
        {item(Cpu, "CPU", stats.cpu, "%", LANG.python.c2)}
        {item(MemoryStick, "MEM", stats.mem, "%", LANG.node.c2)}
        {item(Gauge, "LAT", stats.lat, "ms", LANG.java.c1)}
        {item(Zap, "PROC", openCount, "", CORE)}
        {item(ShieldCheck, "TLS", "OK", "", CORE)}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto shrink-0">
        <button data-live data-tour="progress" onClick={onBadges} className={iconBtn} aria-label={t(`Exploración ${progress}%. Ver insignias`, `Explored ${progress}%. View badges`)} title={t("Progreso de exploración e insignias", "Exploration progress and badges")}>
          <Trophy size={13} style={{ color: HR_ACCENT }} />
          <span className="hidden sm:block w-10 h-1 rounded-full bg-white/10 overflow-hidden">
            <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${progress}%`, background: HR_ACCENT }} />
          </span>
          <span className="text-[10px] tabular-nums" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>{progress}%</span>
        </button>
        <button data-tour="palette" onClick={onPalette} className={iconBtn} aria-label={t("Buscar o ejecutar un comando", "Search or run a command")} aria-keyshortcuts="Control+K Meta+K" title={t("Buscar (Ctrl+K)", "Search (Ctrl+K)")}>
          <Search size={13} />
          {!import.meta.env.SSR && <kbd className="hidden md:inline text-[9.5px] text-white/60" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>{isMac ? "⌘K" : "Ctrl K"}</kbd>}
        </button>
        <button data-live onClick={onToggleSound} className={iconBtn} aria-pressed={soundOn} aria-label={soundOn ? t("Desactivar sonidos", "Turn sounds off") : t("Activar sonidos", "Turn sounds on")} title={soundOn ? t("Sonidos activados", "Sounds on") : t("Sonidos desactivados", "Sounds off")}>
          {soundOn ? <Volume2 size={13} style={{ color: CORE }} /> : <VolumeX size={13} />}
        </button>
        <div data-tour="lang"><LangToggle edge /></div>
        <div data-tour="audience"><AudienceToggle edge /></div>
        <div className="hidden sm:flex items-center gap-3 pl-1 pr-3 border-r border-white/10">
          <a
            href={SOCIAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            title={t("Ver GitHub", "View GitHub")}
            aria-label={t("Ver GitHub", "View GitHub")}
            className={`p-1.5 -m-1.5 text-white/65 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden rounded-sm ${socialHit}`}
          >
            <Github size={15} />
          </a>
          <a
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            title={t("Ver LinkedIn", "View LinkedIn")}
            aria-label={t("Ver LinkedIn", "View LinkedIn")}
            className={`p-1.5 -m-1.5 text-white/65 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden rounded-sm ${socialHit}`}
          >
            <Linkedin size={15} />
          </a>
        </div>
        <div data-live className="hidden sm:block text-[10.5px] text-white/60" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
          {time.toLocaleTimeString(t("es-CL", "en-US"), { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
