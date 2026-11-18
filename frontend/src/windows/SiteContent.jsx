/* "Cómo está hecho": how this portfolio is built, with numbers measured on the project itself. */
import { useEffect } from "react";
import { ArrowUpRight, Cpu, Github } from "lucide-react";
import { useLang, useSystem, useT } from "../app/context.js";
import { SectionTitle } from "../components/ui.jsx";
import { REPO_URL, SITE_LAYERS, SITE_STATS } from "../data/site.js";
import { loc } from "../data/system.js";
import { CORE, LANG } from "../styles/theme.js";

const MONO = { fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" };
const DISPLAY = { fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" };
const COLORS = [CORE, LANG.python.c1, LANG.java.c1, LANG.node.c2];

export function SiteContent() {
  const t = useT();
  const { lang } = useLang();
  const { unlock, openProject } = useSystem();
  useEffect(() => { unlock("reader"); }, [unlock]);
  return (
    <div className="w-full space-y-6">
      <p className="text-[12.5px] text-white/65 leading-6">
        {t(
          "Este portafolio también es un proyecto: lo construí con las mismas prácticas que aplico en el trabajo. Estos son sus números, medidos en el propio código.",
          "This portfolio is a project too: I built it with the same practices I use at work. These are its numbers, measured on the code itself."
        )}
      </p>
      <div className="grid grid-cols-2 @lg:grid-cols-4 gap-2.5">
        {SITE_STATS.map((s, i) => (
          <div key={s.label} className="rounded-lg border p-3" style={{ borderColor: `${COLORS[i]}33`, background: `${COLORS[i]}0b` }}>
            <div className="text-[24px] leading-none font-semibold" style={{ color: COLORS[i], ...DISPLAY }}>{s.value}</div>
            <div className="text-[10.5px] text-white/60 mt-1.5 leading-4">{loc(s, "label", lang)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-4">
        {SITE_LAYERS.map((layer, i) => (
          <section key={layer.id} className="rounded-lg border border-white/10 p-3.5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <SectionTitle color={COLORS[i]}>{loc(layer, "title", lang)}</SectionTitle>
            <ul className="space-y-1.5">
              {layer.items.map((it) => (
                <li key={it.es} className="flex gap-2 text-[12px] text-white/75 leading-5">
                  <Cpu size={12} className="mt-[4px] shrink-0" style={{ color: COLORS[i] }} />{lang === "en" ? it.en : it.es}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-2.5 pt-4 border-t border-white/10">
        <a
          href={REPO_URL} target="_blank" rel="noopener noreferrer"
          className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-[12.5px] font-medium hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden"
          style={{ background: CORE, color: "#05070b" }}
        >
          <Github size={14} /> {t("Ver el código en GitHub", "View the code on GitHub")} <ArrowUpRight size={13} />
        </a>
        <button
          onClick={() => openProject("portfolio")}
          className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 py-2.5 text-[12.5px] font-medium text-white/80 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
        >
          {t("Ver el caso de estudio", "View the case study")}
        </button>
      </div>
      <p className="text-[10.5px] text-white/45 leading-4" style={MONO}>
        {t("Pruebas: pytest en backend/. Peso: build de producción comprimido con Brotli.", "Tests: pytest in backend/. Size: production build compressed with Brotli.")}
      </p>
    </div>
  );
}
