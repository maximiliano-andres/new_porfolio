/* "Notas técnicas": a showcase of my concurrency and data-access guide (full text on GitHub). */
import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { useLang, useSystem, useT } from "../app/context.js";
import { CodeBlock, SectionTitle } from "../components/ui.jsx";
import { GUIDE, GUIDE_URL, HIGHLIGHTS } from "../data/notes.js";
import { loc } from "../data/system.js";
import { LANG } from "../styles/theme.js";

const MONO = { fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" };
const DISPLAY = { fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" };
const ACCENT = LANG.python.c1;

export function NotesContent() {
  const t = useT();
  const { lang } = useLang();
  const { unlock } = useSystem();
  const [active, setActive] = useState(HIGHLIGHTS[0].id);
  useEffect(() => { unlock("reader"); }, [unlock]);
  const hl = HIGHLIGHTS.find((h) => h.id === active);
  return (
    <div className="w-full space-y-6">
      <div className="rounded-xl border p-4" style={{ borderColor: `${ACCENT}40`, background: `linear-gradient(135deg, ${ACCENT}14, transparent 65%)` }}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ACCENT}22`, color: ACCENT }}><BookOpen size={18} /></span>
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-wider text-white/55" style={MONO}>{t("Guía", "Guide")}</div>
            <h3 className="text-[15px] font-semibold text-white leading-5 text-balance" style={DISPLAY}>{loc(GUIDE, "title", lang)}</h3>
          </div>
        </div>
        <p className="text-[12.5px] text-white/70 leading-6 mt-3">{loc(GUIDE, "summary", lang)}</p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {GUIDE.stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-black/25 border border-white/[0.06] px-2.5 py-2">
              <div className="text-[18px] font-semibold text-white leading-none" style={DISPLAY}>{loc(s, "value", lang)}</div>
              <div className="text-[10px] text-white/55 mt-1 leading-4">{loc(s, "label", lang)}</div>
            </div>
          ))}
        </div>
        <a
          href={GUIDE_URL} target="_blank" rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden"
          style={{ background: ACCENT, color: "#05070b" }}
        >
          {t("Leer la guía completa en GitHub", "Read the full guide on GitHub")} <ArrowUpRight size={13} />
        </a>
      </div>

      <section>
        <SectionTitle color={ACCENT}>{t("Tres ejemplos de la guía", "Three examples from the guide")}</SectionTitle>
        <div role="tablist" aria-label={t("Ejemplos", "Examples")} className="flex flex-wrap gap-1.5 mb-3">
          {HIGHLIGHTS.map((h) => {
            const on = h.id === active;
            return (
              <button
                key={h.id} role="tab" aria-selected={on} onClick={() => setActive(h.id)}
                className="rounded-full border px-3 py-1.5 text-[11.5px] transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
                style={on ? { borderColor: ACCENT, background: `${ACCENT}22`, color: "#fff" } : { borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
              >
                {loc(h, "title", lang)}
              </button>
            );
          })}
        </div>
        <div role="tabpanel" className="space-y-3">
          <p className="text-[12.5px] text-white/75 leading-6">{loc(hl, "definition", lang)}</p>
          <CodeBlock code={loc(hl, "code", lang)} lang="python" accent={ACCENT} />
          <p className="text-[11.5px] leading-5" style={{ color: ACCENT }}>→ {loc(hl, "link", lang)}</p>
        </div>
      </section>

      <section>
        <SectionTitle color={ACCENT}>{t("Índice de la guía", "Guide contents")}</SectionTitle>
        <div className="space-y-4">
          {GUIDE.parts.map((part, pi) => (
            <div key={part.title}>
              <div className="text-[12px] font-medium text-white/85 mb-2">{t("Parte", "Part")} {pi + 1} · {loc(part, "title", lang)} <span className="text-white/45" style={MONO}>({part.topics.length})</span></div>
              <div className="flex flex-wrap gap-1.5">
                {part.topics.map((topic) => (
                  <span key={topic} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10.5px] text-white/65" style={MONO}>{topic}</span>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11.5px] text-white/55">{t("Parte 3 · Recomendaciones por stack (Java, Python, Node.js y bases de datos).", "Part 3 · Recommendations per stack (Java, Python, Node.js and databases).")}</p>
        </div>
      </section>
    </div>
  );
}
