/* CV viewer. Pages are pre-rendered images instead of an embedded PDF: iOS Safari shows only the first page
   of an embedded PDF, Android Chrome has no inline PDF viewer, and the CSP (object-src 'none') plus
   X-Frame-Options DENY block <object>/<iframe> anyway. The original PDF stays one tap away. */
import { Download, ExternalLink, FileText } from "lucide-react";
import { useT } from "../app/context.js";
import { useContent } from "../data/useContent.js";
import { CORE } from "../styles/theme.js";

const MONO = { fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" };
const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden";

export function CvContent() {
  const t = useT();
  const { CV } = useContent();
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${CORE}1a`, color: CORE }}>
            <FileText size={16} />
          </span>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-white/90">{t("Currículum vitae", "Curriculum vitae")}</div>
            <div className="text-[10.5px] text-white/60" style={MONO}>
              {CV.updated} · {CV.pages.length} {t("páginas", "pages")} · PDF {CV.size}{t("", " · in Spanish")}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full @md:w-auto">
          <a
            href={CV.pdf} download={CV.fileName}
            className={`${btn} flex-1 @md:flex-none hover:brightness-110`}
            style={{ background: CORE, color: "#05070b" }}
          >
            <Download size={14} /> {t("Descargar PDF", "Download PDF")}
          </a>
          <a
            href={CV.pdf} target="_blank" rel="noopener"
            className={`${btn} flex-1 @md:flex-none border border-white/15 text-white/80 hover:bg-white/5`}
          >
            <ExternalLink size={14} /> {t("Abrir en pestaña", "Open in new tab")}
          </a>
        </div>
      </div>

      <div className="space-y-4">
        {CV.pages.map((pg, i) => (
          <figure key={pg.jpg} className="m-0">
            <a href={CV.pdf} target="_blank" rel="noopener" className="block rounded-md overflow-hidden focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden" aria-label={t(`Abrir el CV en PDF (página ${i + 1})`, `Open the CV as PDF (page ${i + 1})`)}>
              <picture>
                <source type="image/webp" srcSet={`${pg.webpSmall} 760w, ${pg.webp} 1240w`} sizes="(max-width: 640px) 100vw, 1240px" />
                <img
                  src={pg.jpg} width={1240} height={1754}
                  loading={i === 0 ? "eager" : "lazy"} decoding="async"
                  alt={t(`CV de Maximiliano Caniullán, página ${i + 1} de ${CV.pages.length}`, `Maximiliano Caniullán's CV, page ${i + 1} of ${CV.pages.length}`)}
                  className="block w-full h-auto bg-white shadow-lg shadow-black/40"
                />
              </picture>
            </a>
            <figcaption className="text-center text-[10.5px] text-white/60 mt-1.5" style={MONO}>
              {t(`Página ${i + 1} de ${CV.pages.length}`, `Page ${i + 1} of ${CV.pages.length}`)}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
