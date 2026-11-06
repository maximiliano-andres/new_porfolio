/* Window contents for the technical (TI) view. */
import { useRef, useState } from "react";
import { Award, Calendar, ChevronRight, MapPin } from "lucide-react";
import { LangBadge, ProjectDiagram, SimulatorBanner, Tilt } from "../components/ui.jsx";
import { CERTS, EDUCATION, EXPERIENCE, PROJECT_HISTORY, PROJECTS, TECH_GROUPS, TECH_KNOWN, projectsUsing } from "../data/content.js";
import { CORE, LANG } from "../styles/theme.js";

export function AboutContent() {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="w-full">
      <div className="flex flex-col @md:flex-row gap-5 items-center @md:items-start">
        {/* Column 1: Profile Photo */}
        <div className="w-full @md:w-[130px] shrink-0 flex flex-col items-center select-none">
          <div className="relative group rounded-xl overflow-hidden border p-1" style={{ borderColor: `${CORE}33`, background: "rgba(255,255,255,0.02)" }}>
            <div className="w-28 h-28 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center relative">
              {!imgError ? (
                <img
                  src="/img/max_andres_head_256.webp" width={256} height={234} decoding="async"
                  alt="Maximiliano Caniullán"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="text-white/20 font-bold text-lg select-none" style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>MC</span>
              )}
              {/* Scanline overlay */}
              <div className="absolute inset-0 bg-linear-to-b from-transparent via-cyan-500/10 to-transparent pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity duration-300" style={{ animation: "dashflow 8s linear infinite" }} />
            </div>
          </div>
          <span className="text-[10px] text-white/60 mt-1.5 font-mono">max_andres_head.webp</span>
        </div>

        {/* Column 2: Presentation Text */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 mb-3 text-center @md:text-left">
            <div className="w-full">
              <h3 className="text-white text-[15px] font-semibold text-balance" style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>
                Maximiliano Andrés Caniullán Lefiñir
              </h3>
              <p className="text-white/50 text-[12px]">Backend Developer &middot; Especialista en Optimización</p>
            </div>
          </div>

          <div className="space-y-4 text-[13px] leading-6 text-white/75">
            <p>
              Soy <strong className="text-white/90">Backend Developer</strong> con <strong className="text-white/90">más de 2 años</strong> de experiencia en Java (Spring Boot), Python (FastAPI) y Node.js, sobre PostgreSQL, MySQL y MongoDB.
            </p>
            <p>
              Mi especialidad es la <strong className="text-white/90">optimización</strong>: transformo procesos lentos y pesados en sistemas rápidos, estables y con menor consumo de recursos.
            </p>
            <p>
              Un ejemplo: rediseñé una migración masiva de documentos hacia BUK que tardaba <strong className="text-white/90">más de 1 hora</strong> y hoy se ejecuta en <strong className="text-white/90">5–10 minutos</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10">
        <h4 className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-3" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
          Lo que hago mejor (Y cómo ayudo a tu equipo):
        </h4>
        <ul className="space-y-3 text-[12.5px] text-white/70">
          <li className="flex gap-2.5">
            <span className="text-cyan-400">⚡</span>
            <div>
              <strong>Optimización de rendimiento:</strong> Reduzco tiempos de respuesta y consumo de CPU y memoria, para que los sistemas hagan más con menos recursos.
            </div>
          </li>
          <li className="flex gap-2.5">
            <span className="text-cyan-400">⚡</span>
            <div>
              <strong>Desarrollo Backend y APIs REST:</strong> Construyo APIs REST, microservicios y aplicaciones empresariales mantenibles sobre PostgreSQL, MySQL y MongoDB, configurables según los requerimientos de cada cliente.
            </div>
          </li>
          <li className="flex gap-2.5">
            <span className="text-cyan-400">⚡</span>
            <div>
              <strong>Automatización y procesamiento masivo de datos:</strong> Automatizo migraciones, validaciones y reportes sobre grandes volúmenes de información, con trazabilidad completa y foco en la calidad de los datos.
            </div>
          </li>
        </ul>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10">
        <h4 className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-2" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
          Objetivo Profesional
        </h4>
        <p className="text-[12px] leading-5 text-white/60">
          Integrarme como Backend Developer a equipos de tecnología y startups que construyan productos escalables, donde el rendimiento, la calidad del código y la arquitectura sean prioridad. Me motivan los desafíos donde optimizar un sistema tiene un impacto directo en el negocio.
        </p>
      </div>
    </div>
  );
}

const MONO = { fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" };
const TOTAL = PROJECT_HISTORY.length;
const PERIOD = "2023–2026";
/* rows per group, most used first (ties keep the group's declared order) */
const USAGE = TECH_GROUPS.map((g) => ({
  ...g,
  rows: g.items
    .map((tech) => ({ tech, projects: projectsUsing(tech) }))
    .filter((r) => r.projects.length > 0)
    .sort((x, y) => y.projects.length - x.projects.length),
})).filter((g) => g.rows.length > 0);
const ALL_ROWS = USAGE.flatMap((g) => g.rows);
const TOP = ALL_ROWS.reduce((best, r) => (r.projects.length > best.projects.length ? r : best));

/* one radio per technology (single selection); arrow keys move across the whole chart (roving tabindex) */
function UsageRow({ row, active, onSelect }) {
  const n = row.projects.length;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      data-tech={row.tech}
      onClick={() => onSelect(row.tech)}
      title={`${row.tech} · ${n}/${TOTAL}: ${row.projects.map((p) => p.name).join(", ")}`}
      aria-label={`${row.tech}: usado en ${n} de ${TOTAL} proyectos`}
      className="w-full grid grid-cols-[minmax(0,1fr)_2.75rem] @md:grid-cols-[minmax(0,9rem)_minmax(4rem,1fr)_2.75rem] items-center gap-x-2.5 gap-y-1 rounded-md px-1.5 py-[5px] text-left transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
      style={active ? { background: "rgba(255,255,255,0.05)" } : undefined}
    >
      <span className={`text-[12px] truncate ${active ? "text-white" : "text-white/75"}`}>{row.tech}</span>
      <span className="h-2 rounded-r-[4px] bg-white/[0.06] overflow-hidden col-span-2 row-start-2 @md:col-span-1 @md:row-start-1 @md:col-start-2" aria-hidden="true">
        <span
          className="block h-full rounded-r-[4px] transition-[width,opacity] duration-500 ease-out"
          style={{ width: `${(n / TOTAL) * 100}%`, background: CORE, opacity: active ? 1 : 0.7 }}
        />
      </span>
      <span className="text-[11px] text-right text-white/65 tabular-nums col-start-2 row-start-1 @md:col-start-3" style={MONO}>{n}/{TOTAL}</span>
    </button>
  );
}

export function SkillsContent() {
  const [selected, setSelected] = useState(TOP.tech);
  const sel = ALL_ROWS.find((r) => r.tech === selected) ?? TOP;
  const detailRef = useRef(null);
  const chartRef = useRef(null);
  /* arrow keys / Home / End walk every technology of the chart in display order */
  const onChartKey = (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (step === undefined && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const i = ALL_ROWS.findIndex((r) => r.tech === sel.tech);
    const next = e.key === "Home" ? 0 : e.key === "End" ? ALL_ROWS.length - 1 : (i + step + ALL_ROWS.length) % ALL_ROWS.length;
    const tech = ALL_ROWS[next].tech;
    setSelected(tech);
    requestAnimationFrame(() => chartRef.current?.querySelector(`[data-tech="${CSS.escape(tech)}"]`)?.focus());
  };
  /* picking from the project list below: the detail panel is far above, bring it into view */
  const pickFromHistory = (tech) => {
    setSelected(tech);
    detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  const stats = [
    { value: TOTAL, label: `Proyectos analizados · ${PERIOD}` },
    { value: ALL_ROWS.length, label: "Tecnologías aplicadas" },
    { value: `${TOP.projects.length}/${TOTAL}`, label: `Más usada: ${TOP.tech}` },
  ];
  return (
    <div className="w-full">
      <p className="text-[12px] text-white/60 mb-4 leading-5">
        En cuántos de mis proyectos apliqué cada tecnología, según el histórico de trabajo {PERIOD}. Haz clic o toca
        una barra para ver en qué proyectos se usó.
      </p>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {stats.map((st) => (
          <div key={st.label} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 min-w-0">
            <div className="text-[20px] leading-none font-semibold text-white" style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>
              {st.value}
            </div>
            <div className="text-[10.5px] text-white/50 mt-1.5 leading-4">{st.label}</div>
          </div>
        ))}
      </div>

      {/* detail of the hovered/selected bar */}
      <div ref={detailRef} className="rounded-lg border p-3 mb-4 scroll-mt-2" style={{ borderColor: `${CORE}33`, background: `${CORE}0a` }} aria-live="polite">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <span className="text-[13px] font-medium text-white">{sel.tech}</span>
          <span className="text-[10.5px] text-white/55" style={MONO}>
            {sel.projects.length} de {TOTAL} proyectos
          </span>
        </div>
        <ul className="grid grid-cols-1 @md:grid-cols-2 gap-x-4 gap-y-1">
          {sel.projects.map((p) => (
            <li key={p.id} className="text-[11.5px] text-white/70 leading-5 flex gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0" style={{ background: CORE }} />
              <span className="min-w-0">
                {p.name} <span className="text-white/60">· {p.org} · {p.period}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div ref={chartRef} role="radiogroup" aria-label="Tecnologías por cantidad de proyectos" onKeyDown={onChartKey} className="grid grid-cols-1 @2xl:grid-cols-2 gap-x-6 gap-y-4">
        {USAGE.map((g) => (
          <section key={g.id} className="min-w-0">
            <h4 className="text-[10.5px] uppercase tracking-wider text-white/60 mb-1 px-1.5" style={MONO}>{g.label}</h4>
            {g.rows.map((row) => (
              <UsageRow key={row.tech} row={row} active={row.tech === sel.tech} onSelect={setSelected} />
            ))}
          </section>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.08]">
        <div className="text-[10.5px] uppercase tracking-wider mb-2 text-white/60" style={MONO}>
          También en mi CV (sin proyecto listado aquí)
        </div>
        <div className="flex flex-wrap gap-2">
          {TECH_KNOWN.map((t) => (
            <span key={t} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/65">{t}</span>
          ))}
        </div>
      </div>

      {/* table view of the same data */}
      <details className="mt-4 group">
        <summary className="cursor-pointer text-[11.5px] text-white/60 hover:text-white/85 select-none" style={MONO}>
          Ver histórico de proyectos ({TOTAL})
        </summary>
        <ul className="mt-3 space-y-2.5">
          {PROJECT_HISTORY.map((p) => (
            <li key={p.id} className="rounded-lg border border-white/[0.08] p-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="text-[12px] text-white/85">{p.name}</span>
                <span className="text-[10.5px] text-white/60" style={MONO}>{p.org} · {p.period}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {p.tech.map((t) => (
                  <button
                    key={t} type="button" onClick={() => pickFromHistory(t)}
                    className="rounded-sm border border-white/10 px-1.5 py-0.5 text-[10.5px] text-white/65 hover:text-white hover:border-white/30 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
                    style={MONO}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export function ProjectsContent({ onOpenProject }) {
  return (
    <div className="w-full">
      <SimulatorBanner />
      <p className="text-[12px] text-white/60 mb-3">
        Selecciona un proyecto para abrir su infografía de arquitectura en una nueva ventana.
      </p>
      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-3">
        {PROJECTS.map((p) => (
          <Tilt key={p.id} className="h-full">
          <button
            onClick={() => onOpenProject(p.id)}
            className="w-full h-full text-left rounded-lg border border-white/10 p-3 hover:border-white/25 hover:-translate-y-0.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            {p.langs.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                {p.langs.map((l) => <LangBadge key={l} id={l} />)}
              </div>
            )}
            <div className="text-[13px] font-medium text-white/90 mb-1" style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>
              {p.title}
            </div>
            <div className="text-[10.5px] mb-1.5" style={{ color: CORE, fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>{p.org}</div>
            <p className="text-[11.5px] text-white/65 leading-5 mb-2">{p.summary}</p>
            <div className="flex items-center gap-1 text-[10.5px]" style={{ color: CORE }}>
              Ver infografía <ChevronRight size={12} />
            </div>
          </button>
          </Tilt>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailContent({ project }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {project.langs.map((l) => <LangBadge key={l} id={l} size="md" />)}
        <span className="text-[11px] text-white/60 ml-1" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>{project.org}</span>
      </div>
      <p className="text-[12.5px] text-white/65 leading-6 mb-4">{project.summary}</p>

      {/* narrow windows scroll the diagram sideways instead of shrinking its labels to unreadable sizes */}
      <div className="rounded-lg border border-white/10 bg-black/30 overflow-x-auto mb-4 relative min-h-[160px] select-none" style={{ scrollbarWidth: "thin" }}>
        <div className="p-3 w-full min-w-fit">
          <ProjectDiagram kind={project.diagram} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {project.stack.map((s) => (
          <span key={s} className="rounded-full border border-white/10 px-2 py-0.5 text-[10.5px] text-white/60" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
            {s}
          </span>
        ))}
      </div>
      {project.id === "buk-migration" && <SimulatorBanner compact />}
    </div>
  );
}

export function ExperienceContent() {
  return (
    <div className="w-full">
      <div className="relative pl-5 border-l" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
        {EXPERIENCE.map((e, i) => (
          <div key={i} className="mb-5 last:mb-0 relative">
            <span
              className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full border-2"
              style={{ borderColor: CORE, background: "#0d1117" }}
            />
            <div className="text-[13px] font-medium text-white/90" style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>
              {e.role}
            </div>
            <div className="text-[11.5px] mb-1" style={{ color: CORE }}>{e.company}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-white/60 mb-2" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
              <span className="inline-flex items-center gap-1"><Calendar size={11} /> {e.period}</span>
              <span className="inline-flex items-center gap-1"><MapPin size={11} /> {e.location}</span>
            </div>
            <ul className="space-y-1">
              {e.bullets.map((b, bi) => (
                <li key={bi} className="text-[12px] text-white/60 leading-5 flex gap-1.5">
                  <span className="text-white/25 mt-0.5">&bull;</span>{b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EducationContent() {
  return (
    <div className="w-full space-y-3">
      {EDUCATION.map((ed, i) => (
        <div key={i} className="rounded-lg border border-white/10 p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="text-[13px] font-medium text-white/90" style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>
              {ed.title}
            </div>
            <span className="text-[10.5px] text-white/60 shrink-0" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>{ed.period}</span>
          </div>
          <div className="text-[11.5px] mb-1.5" style={{ color: CORE }}>{ed.place}</div>
          <p className="text-[12px] text-white/55 leading-5">{ed.detail}</p>
        </div>
      ))}
    </div>
  );
}

export function CertificationsContent() {
  return (
    <div className="w-full grid grid-cols-1 @md:grid-cols-2 gap-3">
      {CERTS.map((c, i) => {
        const color = [LANG.python.c1, LANG.java.c1, LANG.node.c1, CORE][i % 4];
        return (
          <div key={c.name} className="rounded-lg border p-3 flex items-start gap-2.5" style={{ borderColor: `${color}33`, background: `${color}0d` }}>
            <Award size={16} style={{ color }} className="shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-white/90 leading-4">{c.name}</div>
              <div className="text-[10.5px] text-white/60 mt-1">{c.org} &middot; {c.year}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
