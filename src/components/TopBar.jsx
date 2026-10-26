/* Top bar: live-ish system metrics, exploration progress, search, sound and profile toggle. */
import { useCallback, useEffect, useState } from "react";
import { Cpu, Gauge, Github, Linkedin, MemoryStick, Search, ShieldCheck, Trophy, Volume2, VolumeX, Zap } from "lucide-react";
import { AudienceToggle } from "./ui.jsx";
import { CORE, HR_ACCENT, LANG, SOCIAL_LINKS } from "../theme.js";

/* metrics follow what the visitor does: every open window is a "process" that adds load */
export function TopBar({ scale = 1, openCount = 0, progress = 0, onPalette, onBadges, soundOn, onToggleSound }) {
  const loadFor = useCallback((n) => ({
    cpu: Math.min(96, 6 + n * 9 + Math.round(Math.random() * 5)),
    mem: Math.min(94, 18 + n * 6 + Math.round(Math.random() * 3)),
    lat: 5 + Math.round(Math.random() * 4) + n,
  }), []);
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
      <span className="text-[10.5px] text-white/50">{label}</span>
      <span className="text-[10.5px] tabular-nums" style={{ color }}>{val}{unit}</span>
    </div>
  );
  const iconBtn = "inline-flex items-center justify-center gap-1.5 h-7 min-w-[28px] rounded-full border border-white/10 bg-black/40 px-2 text-white/60 hover:text-white hover:border-white/25 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden";
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  return (
    <div
      className="fixed top-0 inset-x-0 z-[90] flex items-center justify-between gap-2 px-3 sm:px-6 py-2 pointer-events-none"
      style={{ zoom: scale, background: "linear-gradient(to bottom, rgba(5,7,11,0.75), transparent)" }}
    >
      <div className="flex items-center gap-3 pointer-events-auto min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CORE, boxShadow: `0 0 8px ${CORE}` }} />
          <span className="text-[11px] tracking-wide text-white/70 truncate" style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>
            polyglot_core <span className="text-white/30 hidden min-[380px]:inline">v1.0</span>
          </span>
        </div>
      </div>
      <div data-live className="hidden lg:flex items-center gap-4 pointer-events-auto" title="Carga simulada: cada ventana abierta es un proceso">
        {item(Cpu, "CPU", stats.cpu, "%", LANG.python.c2)}
        {item(MemoryStick, "MEM", stats.mem, "%", LANG.node.c2)}
        {item(Gauge, "LAT", stats.lat, "ms", LANG.java.c1)}
        {item(Zap, "PROC", openCount, "", CORE)}
        {item(ShieldCheck, "TLS", "OK", "", CORE)}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto shrink-0">
        <button data-live data-tour="progress" onClick={onBadges} className={iconBtn} aria-label={`Exploración ${progress}%. Ver insignias`} title="Progreso de exploración e insignias">
          <Trophy size={13} style={{ color: HR_ACCENT }} />
          <span className="hidden sm:block w-10 h-1 rounded-full bg-white/10 overflow-hidden">
            <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${progress}%`, background: HR_ACCENT }} />
          </span>
          <span className="text-[10px] tabular-nums" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>{progress}%</span>
        </button>
        <button data-tour="palette" onClick={onPalette} className={iconBtn} aria-label="Buscar o ejecutar un comando" aria-keyshortcuts="Control+K Meta+K" title="Buscar (Ctrl+K)">
          <Search size={13} />
          <kbd className="hidden md:inline text-[9.5px] text-white/40" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>{isMac ? "⌘K" : "Ctrl K"}</kbd>
        </button>
        <button data-live onClick={onToggleSound} className={iconBtn} aria-pressed={soundOn} aria-label={soundOn ? "Desactivar sonidos" : "Activar sonidos"} title={soundOn ? "Sonidos activados" : "Sonidos desactivados"}>
          {soundOn ? <Volume2 size={13} style={{ color: CORE }} /> : <VolumeX size={13} />}
        </button>
        <div data-tour="audience"><AudienceToggle /></div>
        <div className="hidden sm:flex items-center gap-3 pl-1 pr-3 border-r border-white/10">
          <a
            href={SOCIAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            title="Ver GitHub"
            aria-label="Ver GitHub"
            className="p-1.5 -m-1.5 text-white/50 hover:text-white transition-colors"
          >
            <Github size={15} />
          </a>
          <a
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            title="Ver LinkedIn"
            aria-label="Ver LinkedIn"
            className="p-1.5 -m-1.5 text-white/50 hover:text-white transition-colors"
          >
            <Linkedin size={15} />
          </a>
        </div>
        <div data-live className="hidden sm:block text-[10.5px] text-white/45" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
          {time.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
