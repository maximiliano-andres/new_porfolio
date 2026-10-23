/* "Badge unlocked" toast. */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ACHIEVEMENTS } from "../data/system.js";
import { HR_ACCENT } from "../theme.js";

export function AchievementToast({ id, onDone }) {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  useEffect(() => {
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [id, onDone]);
  if (!a) return null;
  return (
    <div className="fixed top-11 inset-x-0 z-[1000] flex justify-center px-2 pointer-events-none">
    <motion.div
      key={id}
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      role="status"
      className="w-full max-w-[340px] flex items-center gap-3 rounded-xl border px-3.5 py-2.5 shadow-2xl"
      style={{ background: "rgba(10,14,20,0.96)", borderColor: `${HR_ACCENT}66`, boxShadow: `0 10px 30px -10px rgba(0,0,0,0.6), 0 0 24px ${HR_ACCENT}22` }}
    >
      <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${HR_ACCENT}1f`, color: HR_ACCENT }}>
        <a.Icon size={17} />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider" style={{ color: HR_ACCENT, fontFamily: "'JetBrains Mono', monospace" }}>Insignia desbloqueada</div>
        <div className="text-[13px] font-semibold text-white truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{a.title}</div>
        <div className="text-[11px] text-white/55 truncate">{a.desc}</div>
      </div>
    </motion.div>
    </div>
  );
}
