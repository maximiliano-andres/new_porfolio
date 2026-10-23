/* Achievements and exploration progress window. */
import { useState } from "react";
import { Lock, RotateCcw } from "lucide-react";
import { ACHIEVEMENTS } from "../data/system.js";
import { HR_ACCENT, LANG } from "../theme.js";

export function BadgesContent({ unlocked, progress, visitedCount, totalSections, onReset }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="w-full">
      <div className="rounded-lg border p-4 mb-4" style={{ borderColor: `${HR_ACCENT}33`, background: `${HR_ACCENT}0b` }}>
        <div className="flex items-end justify-between gap-3 mb-2">
          <div>
            <div className="text-[10.5px] uppercase tracking-wider text-white/45" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Sistema explorado</div>
            <div className="text-[28px] leading-none font-semibold mt-1" style={{ color: HR_ACCENT, fontFamily: "'Space Grotesk', sans-serif" }}>{progress}%</div>
          </div>
          <div className="text-right text-[11.5px] text-white/55">
            {visitedCount} de {totalSections} secciones<br />{unlocked.size} de {ACHIEVEMENTS.length} insignias
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${HR_ACCENT}, ${LANG.java.c1})` }} />
        </div>
      </div>
      <ul className="grid grid-cols-1 @md:grid-cols-2 gap-2.5">
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.has(a.id);
          return (
            <li key={a.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5" style={{ borderColor: got ? `${HR_ACCENT}44` : "rgba(255,255,255,0.08)", background: got ? `${HR_ACCENT}0a` : "transparent" }}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: got ? `${HR_ACCENT}1f` : "rgba(255,255,255,0.04)", color: got ? HR_ACCENT : "rgba(255,255,255,0.3)" }}>
                {got ? <a.Icon size={15} /> : <Lock size={13} />}
              </span>
              <div className="min-w-0">
                <div className={`text-[12.5px] font-medium ${got ? "text-white/90" : "text-white/50"}`}>{a.title}</div>
                <div className="text-[11px] text-white/45 leading-4">{a.desc}</div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-end gap-2 text-[11px]">
        {confirm ? (
          <>
            <span className="text-white/50">¿Borrar todo el progreso?</span>
            <button onClick={() => setConfirm(false)} className="rounded-md border border-white/15 px-2.5 py-1.5 text-white/70 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">Cancelar</button>
            <button onClick={() => { onReset(); setConfirm(false); }} className="rounded-md px-2.5 py-1.5 bg-red-500/80 text-white focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">Borrar</button>
          </>
        ) : (
          <button onClick={() => setConfirm(true)} className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 px-1 py-1.5 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none rounded">
            <RotateCcw size={12} /> Reiniciar progreso
          </button>
        )}
      </div>
    </div>
  );
}
