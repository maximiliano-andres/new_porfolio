/* "Badge unlocked" toast. */
import { useEffect } from "react";
import { m } from "framer-motion";
import { ACHIEVEMENTS } from "../data/system.js";
import { HR_ACCENT } from "../styles/theme.js";

export function AchievementToast({ id, onDone }) {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  useEffect(() => {
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [id, onDone]);
  if (!a) return null;
  // z-[250]: below the modal overlays (tour 260, palette 300) so a badge never covers their controls
  return (
    <div className="fixed top-11 inset-x-0 z-[250] flex justify-center px-2 pointer-events-none">
    <m.div
      key={id}
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      // announced through the shell's persistent live region (a region mounted with its text is often skipped)
      className="w-full max-w-[340px] flex items-center gap-3 rounded-xl border px-3.5 py-2.5 shadow-2xl"
      style={{ background: "rgba(10,14,20,0.96)", borderColor: `${HR_ACCENT}66`, boxShadow: `0 10px 30px -10px rgba(0,0,0,0.6), 0 0 24px ${HR_ACCENT}22` }}
    >
      <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${HR_ACCENT}1f`, color: HR_ACCENT }}>
        <a.Icon size={17} />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider" style={{ color: HR_ACCENT, fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>Insignia desbloqueada</div>
        <div className="text-[13px] font-semibold text-white truncate" style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>{a.title}</div>
        <div className="text-[11px] text-white/65 truncate">{a.desc}</div>
      </div>
    </m.div>
    </div>
  );
}
