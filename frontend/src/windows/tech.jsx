/* Window contents for the technical (TI) view, plus the Education window shared by both views. */
import { useMemo, useRef, useState } from "react";
import { ArrowRight, Award, BookOpen, Calendar, ChevronRight, Cpu, GraduationCap, Lightbulb, MapPin, Target } from "lucide-react";
import { CareerTimeline, CodeBlock, CopyLinkButton, LangBadge, ProjectDiagram, SectionTitle, SimulatorBanner, Tilt } from "../components/ui.jsx";
import { useCareerRows } from "../lib/career.js";
import { useSystem, useT } from "../app/context.js";
import { useContent } from "../data/useContent.js";
import { useHR } from "../data/useHR.js";
import { CORE, HR_ACCENT, LANG } from "../styles/theme.js";

const MONO = { fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" };
const DISPLAY = { fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" };

export function AboutContent() {
  const t = useT();
  const { HR_SEEKING, HR_DOMAIN } = useHR();
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
                <span className="text-white/20 font-bold text-lg select-none" style={DISPLAY}>MC</span>
              )}
              {/* Scanline overlay. No animation on purpose: it used to run `dashflow` (a stroke-dashoffset animation),
                  which does nothing to a <div> yet repainted the window on every frame (~120 paints/s) */}
              <div className="absolute inset-0 bg-linear-to-b from-transparent via-cyan-500/10 to-transparent pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity duration-300" />
            </div>
          </div>
          <span className="text-[10px] text-white/60 mt-1.5 font-mono">max_andres_head.webp</span>
        </div>

        {/* Column 2: Presentation Text */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 mb-3 text-center @md:text-left">
            <div className="w-full">
              <h3 className="text-white text-[15px] font-semibold text-balance" style={DISPLAY}>
                Maximiliano Andrés Caniullán Lefiñir
              </h3>
              <p className="text-white/50 text-[12px]">Backend Developer &middot; {t("Especialista en Optimización", "Performance Optimization Specialist")}</p>
            </div>
          </div>

          <div className="space-y-4 text-[13px] leading-6 text-white/75">
            {t(
              <>
                <p>Soy <strong className="text-white/90">Backend Developer</strong> con <strong className="text-white/90">más de 2 años</strong> de experiencia en Java (Spring Boot), Python (FastAPI) y Node.js, sobre PostgreSQL, MySQL y MongoDB.</p>
                <p>Mi especialidad es la <strong className="text-white/90">optimización</strong>: transformo procesos lentos y pesados en sistemas rápidos, estables y con menor consumo de recursos.</p>
                <p>Un ejemplo: rediseñé una migración masiva de documentos hacia BUK que tardaba <strong className="text-white/90">más de 1 hora</strong> y hoy se ejecuta en <strong className="text-white/90">5–10 minutos</strong>.</p>
              </>,
              <>
                <p>I'm a <strong className="text-white/90">Backend Developer</strong> with <strong className="text-white/90">over 2 years</strong> of experience in Java (Spring Boot), Python (FastAPI) and Node.js, on PostgreSQL, MySQL and MongoDB.</p>
                <p>My specialty is <strong className="text-white/90">optimization</strong>: I turn slow, heavy processes into fast, stable systems that use fewer resources.</p>
                <p>One example: I redesigned a bulk document migration to BUK that took <strong className="text-white/90">over 1 hour</strong>; it now runs in <strong className="text-white/90">5–10 minutes</strong>.</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10">
        <h4 className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-3" style={MONO}>
          {t("Lo que hago mejor (y cómo ayudo a tu equipo)", "What I do best (and how I help your team)")}
        </h4>
        <ul className="space-y-3 text-[12.5px] text-white/70">
          {[
            [t("Optimización de rendimiento:", "Performance optimization:"), t("Reduzco tiempos de respuesta y consumo de CPU y memoria, para que los sistemas hagan más con menos recursos.", "I cut response times and CPU and memory usage, so systems do more with fewer resources.")],
            [t("Desarrollo Backend y APIs REST:", "Backend development and REST APIs:"), t("Construyo APIs REST, microservicios y aplicaciones empresariales mantenibles sobre PostgreSQL, MySQL y MongoDB, configurables según los requerimientos de cada cliente.", "I build maintainable REST APIs, microservices and enterprise applications on PostgreSQL, MySQL and MongoDB, configurable to each client's requirements.")],
            [t("Automatización y procesamiento masivo de datos:", "Automation and bulk data processing:"), t("Automatizo migraciones, validaciones y reportes sobre grandes volúmenes de información, con trazabilidad completa y foco en la calidad de los datos.", "I automate migrations, validations and reports over large volumes of data, fully traceable and focused on data quality.")],
          ].map(([title, text]) => (
            <li key={title} className="flex gap-2.5">
              <span className="text-cyan-400">⚡</span>
              <div><strong>{title}</strong> {text}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10">
        <h4 className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-2" style={MONO}>
          {t("Dominio de negocio: RRHH y nómina", "Business domain: HR and payroll")}
        </h4>
        <p className="text-[12px] leading-5 text-white/60 mb-2.5">{HR_DOMAIN.intro}</p>
        <div className="flex flex-wrap gap-1.5">
          {HR_DOMAIN.items.map((d) => (
            <span key={d.term} title={d.evidence} className="rounded-full border px-2.5 py-1 text-[11px] text-white/75" style={{ borderColor: `${CORE}33`, background: `${CORE}0a` }}>{d.term}</span>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10">
        <h4 className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-2" style={MONO}>
          {t("Qué busco", "What I'm looking for")}
        </h4>
        <p className="text-[12px] leading-5 text-white/60 mb-2.5">{HR_SEEKING.text}</p>
        <ul className="grid grid-cols-1 @md:grid-cols-2 gap-1.5">
          {HR_SEEKING.roles.map((r) => (
            <li key={r} className="flex gap-2 text-[12px] text-white/75 leading-5"><Target size={13} className="mt-[3px] shrink-0" style={{ color: CORE }} />{r}</li>
          ))}
        </ul>
        <p className="mt-2.5 text-[11px] text-white/55" style={MONO}>
          {t("Disponibilidad inmediata · remoto o presencial · inglés intermedio (B1–B2)", "Available now · remote or on-site · intermediate English (B1–B2)")}
        </p>
      </div>
    </div>
  );
}

/* rows per group, most used first (ties keep the group's declared order) */
function usageFor({ TECH_GROUPS, projectsUsing }) {
  const usage = TECH_GROUPS.map((g) => ({
    ...g,
    rows: g.items
      .map((tech) => ({ tech, projects: projectsUsing(tech) }))
      .filter((r) => r.projects.length > 0)
      .sort((x, y) => y.projects.length - x.projects.length),
  })).filter((g) => g.rows.length > 0);
  const allRows = usage.flatMap((g) => g.rows);
  const top = allRows.reduce((best, r) => (r.projects.length > best.projects.length ? r : best));
  return { usage, allRows, top };
}
const PERIOD = "2023–2026";

/* one radio per technology (single selection); arrow keys move across the whole chart (roving tabindex) */
function UsageRow({ row, active, total, onSelect }) {
  const t = useT();
  const n = row.projects.length;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      data-tech={row.tech}
      onClick={() => onSelect(row.tech)}
      title={`${row.tech} · ${n}/${total}: ${row.projects.map((p) => p.name).join(", ")}`}
      aria-label={t(`${row.tech}: usado en ${n} de ${total} proyectos`, `${row.tech}: used in ${n} of ${total} projects`)}
      className="w-full grid grid-cols-[minmax(0,1fr)_2.75rem] @md:grid-cols-[minmax(0,9rem)_minmax(4rem,1fr)_2.75rem] items-center gap-x-2.5 gap-y-1 rounded-md px-1.5 py-[5px] text-left transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
      style={active ? { background: "rgba(255,255,255,0.05)" } : undefined}
    >
      <span className={`text-[12px] truncate ${active ? "text-white" : "text-white/75"}`}>{row.tech}</span>
      <span className="h-2 rounded-r-[4px] bg-white/[0.06] overflow-hidden col-span-2 row-start-2 @md:col-span-1 @md:row-start-1 @md:col-start-2" aria-hidden="true">
        <span
          className="block h-full rounded-r-[4px] transition-[width,opacity] duration-500 ease-out"
          style={{ width: `${(n / total) * 100}%`, background: CORE, opacity: active ? 1 : 0.7 }}
        />
      </span>
      <span className="text-[11px] text-right text-white/65 tabular-nums col-start-2 row-start-1 @md:col-start-3" style={MONO}>{n}/{total}</span>
    </button>
  );
}

export function SkillsContent() {
  const t = useT();
  const C = useContent();
  const { usage, allRows, top } = useMemo(() => usageFor(C), [C]);
  const total = C.PROJECT_HISTORY.length;
  const [selected, setSelected] = useState(null);
  const sel = allRows.find((r) => r.tech === selected) ?? top;
  const detailRef = useRef(null);
  const chartRef = useRef(null);
  /* arrow keys / Home / End walk every technology of the chart in display order */
  const onChartKey = (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (step === undefined && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const i = allRows.findIndex((r) => r.tech === sel.tech);
    const next = e.key === "Home" ? 0 : e.key === "End" ? allRows.length - 1 : (i + step + allRows.length) % allRows.length;
    const tech = allRows[next].tech;
    setSelected(tech);
    requestAnimationFrame(() => chartRef.current?.querySelector(`[data-tech="${CSS.escape(tech)}"]`)?.focus());
  };
  /* picking from the project list below: the detail panel is far above, bring it into view */
  const pickFromHistory = (tech) => {
    setSelected(tech);
    detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  const stats = [
    { value: total, label: t(`Proyectos analizados · ${PERIOD}`, `Projects analyzed · ${PERIOD}`) },
    { value: allRows.length, label: t("Tecnologías aplicadas", "Technologies applied") },
    { value: `${top.projects.length}/${total}`, label: t(`Más usada: ${top.tech}`, `Most used: ${top.tech}`) },
  ];
  return (
    <div className="w-full">
      <p className="text-[12px] text-white/60 mb-4 leading-5">
        {t(
          `En cuántos de mis proyectos apliqué cada tecnología, según el histórico de trabajo ${PERIOD}. Haz clic o toca una barra para ver en qué proyectos se usó.`,
          `How many of my projects used each technology, based on my ${PERIOD} work history. Click or tap a bar to see which projects.`
        )}
      </p>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {stats.map((st) => (
          <div key={st.label} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 min-w-0">
            <div className="text-[20px] leading-none font-semibold text-white" style={DISPLAY}>{st.value}</div>
            <div className="text-[10.5px] text-white/50 mt-1.5 leading-4">{st.label}</div>
          </div>
        ))}
      </div>

      {/* detail of the hovered/selected bar */}
      <div ref={detailRef} className="rounded-lg border p-3 mb-4 scroll-mt-2" style={{ borderColor: `${CORE}33`, background: `${CORE}0a` }} aria-live="polite">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <span className="text-[13px] font-medium text-white">{sel.tech}</span>
          <span className="text-[10.5px] text-white/55" style={MONO}>
            {t(`${sel.projects.length} de ${total} proyectos`, `${sel.projects.length} of ${total} projects`)}
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

      <div ref={chartRef} role="radiogroup" aria-label={t("Tecnologías por cantidad de proyectos", "Technologies by number of projects")} onKeyDown={onChartKey} className="grid grid-cols-1 @2xl:grid-cols-2 gap-x-6 gap-y-4">
        {usage.map((g) => (
          <section key={g.id} className="min-w-0">
            <h4 className="text-[10.5px] uppercase tracking-wider text-white/60 mb-1 px-1.5" style={MONO}>{g.label}</h4>
            {g.rows.map((row) => (
              <UsageRow key={row.tech} row={row} total={total} active={row.tech === sel.tech} onSelect={setSelected} />
            ))}
          </section>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.08]">
        <div className="text-[10.5px] uppercase tracking-wider mb-2 text-white/60" style={MONO}>
          {t("También en mi CV (sin proyecto listado aquí)", "Also on my CV (no project listed here)")}
        </div>
        <div className="flex flex-wrap gap-2">
          {C.TECH_KNOWN.map((k) => (
            <span key={k} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/65">{k}</span>
          ))}
        </div>
      </div>

      {/* table view of the same data */}
      <details className="mt-4 group">
        <summary className="relative cursor-pointer text-[11.5px] text-white/60 hover:text-white/85 select-none after:absolute after:content-[''] after:inset-x-0 after:-inset-y-2" style={MONO}>
          {t(`Ver histórico de proyectos (${total})`, `View project history (${total})`)}
        </summary>
        <ul className="mt-3 space-y-2.5">
          {C.PROJECT_HISTORY.map((p) => (
            <li key={p.id} className="rounded-lg border border-white/[0.08] p-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="text-[12px] text-white/85">{p.name}</span>
                <span className="text-[10.5px] text-white/60" style={MONO}>{p.org} · {p.period}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {p.tech.map((tech) => (
                  <button
                    key={tech} type="button" onClick={() => pickFromHistory(tech)}
                    className="rounded-sm border border-white/10 px-1.5 py-0.5 text-[10.5px] text-white/65 hover:text-white hover:border-white/30 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
                    style={MONO}
                  >
                    {tech}
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
  const t = useT();
  const { PROJECTS } = useContent();
  return (
    <div className="w-full">
      <SimulatorBanner />
      <p className="text-[12px] text-white/60 mb-3">
        {t("Selecciona un proyecto para ver su caso de estudio: contexto, enfoque, resultado y diagrama de arquitectura.", "Pick a project to see its case study: context, approach, result and architecture diagram.")}
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
            <div className="text-[13px] font-medium text-white/90 mb-1" style={DISPLAY}>{p.title}</div>
            <div className="text-[10.5px] mb-1.5" style={{ color: CORE, ...MONO }}>{p.org}</div>
            <p className="text-[11.5px] text-white/65 leading-5 mb-2">{p.summary}</p>
            <div className="flex items-center gap-1 text-[10.5px]" style={{ color: CORE }}>
              {t("Ver caso de estudio", "View case study")} <ChevronRight size={12} />
            </div>
          </button>
          </Tilt>
        ))}
      </div>
    </div>
  );
}

function CaseBlock({ label, children, Icon }) {
  return (
    <section className="flex gap-3">
      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/10" style={{ color: CORE }}>
        <Icon size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="text-[10.5px] uppercase tracking-wider text-white/60 mb-1" style={MONO}>{label}</h4>
        {children}
      </div>
    </section>
  );
}

export function ProjectDetailContent({ project }) {
  const t = useT();
  const { openWindow } = useSystem();
  const { CASES } = useContent();
  const cs = CASES[project.id];
  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {project.langs.map((l) => <LangBadge key={l} id={l} size="md" />)}
        <span className="text-[11px] text-white/60 ml-1" style={MONO}>{project.org}</span>
        <CopyLinkButton className="ml-auto" params={{ proyecto: project.id }} label={t("Copiar enlace", "Copy link")} />
      </div>
      <p className="text-[12.5px] text-white/65 leading-6 mb-4">{project.summary}</p>

      {/* narrow windows scroll the diagram sideways instead of shrinking its labels to unreadable sizes */}
      <div className="rounded-lg border border-white/10 bg-black/30 overflow-x-auto mb-4 relative min-h-[160px] select-none" style={{ scrollbarWidth: "thin" }}>
        <div className="p-3 w-full min-w-fit">
          <ProjectDiagram kind={project.diagram} />
        </div>
      </div>

      {cs && (
        <div className="space-y-4 mb-4">
          <CaseBlock label={t("Contexto", "Context")} Icon={Target}>
            <p className="text-[12.5px] text-white/75 leading-5">{cs.context}</p>
          </CaseBlock>
          <CaseBlock label={t("Enfoque técnico", "Technical approach")} Icon={Lightbulb}>
            <ul className="space-y-1">
              {cs.approach.map((a) => (
                <li key={a} className="text-[12px] text-white/70 leading-5 flex gap-1.5"><span className="text-white/30">&bull;</span>{a}</li>
              ))}
            </ul>
          </CaseBlock>
          <CaseBlock label={t("Resultado", "Result")} Icon={ArrowRight}>
            <p className="text-[12.5px] font-medium leading-5" style={{ color: LANG.node.c2 }}>{cs.result}</p>
            {cs.evidence && <p className="text-[10.5px] text-white/50 mt-1" style={MONO}>{cs.evidence}</p>}
          </CaseBlock>
          {cs.snippet && (
            <CodeBlock
              code={cs.snippet.code}
              lang={cs.snippet.lang}
              note={cs.snippet.illustrative
                ? t("Ejemplo ilustrativo del patrón aplicado; no es el código del cliente.", "Illustrative example of the pattern applied; not the client's code.")
                : null}
            />
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {project.stack.map((s) => (
          <span key={s} className="rounded-full border border-white/10 px-2 py-0.5 text-[10.5px] text-white/60" style={MONO}>{s}</span>
        ))}
      </div>
      {project.id === "portfolio" && (
        <button
          onClick={() => openWindow("site")}
          className="mt-4 w-full flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-left text-[12.5px] text-white/85 hover:brightness-125 transition-all focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
          style={{ borderColor: `${CORE}44`, background: `${CORE}10` }}
        >
          <Cpu size={15} style={{ color: CORE }} /> {t("Ver cómo está hecho este sitio, con sus números", "See how this site is built, with its numbers")}
          <ChevronRight size={14} className="ml-auto text-white/55" />
        </button>
      )}
      {project.id === "buk-migration" && <SimulatorBanner compact />}
    </div>
  );
}

export function ExperienceContent() {
  const t = useT();
  const { EXPERIENCE } = useContent();
  const rows = useCareerRows(CORE);
  return (
    <div className="w-full">
      <CareerTimeline rows={rows} title={t("Línea de tiempo", "Timeline")} />
      <div className="relative pl-5 border-l" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
        {EXPERIENCE.map((e, i) => (
          <div key={i} className="mb-5 last:mb-0 relative">
            <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: CORE, background: "#0d1117" }} />
            <div className="text-[13px] font-medium text-white/90" style={DISPLAY}>{e.role}</div>
            <div className="text-[11.5px] mb-1" style={{ color: CORE }}>{e.company}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-white/60 mb-2" style={MONO}>
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

/* "Formación": degree, certifications and what I'm learning now. `plain`: the RRHH view adds a short
   plain-language note under each certification. */
function Education({ plain }) {
  const t = useT();
  const { openWindow } = useSystem();
  const { EDUCATION, CERTS, LEARNING } = useContent();
  const { HR_CERT_NOTES } = useHR();
  const accent = plain ? HR_ACCENT : CORE;
  return (
    <div className="w-full space-y-6">
      <section>
        <SectionTitle color={accent}>{t("Estudios", "Degree")}</SectionTitle>
        <div className="space-y-3">
          {EDUCATION.map((ed, i) => (
            <div key={i} className="rounded-lg border border-white/10 p-3 flex gap-3" style={{ background: "rgba(255,255,255,0.02)" }}>
              <GraduationCap size={18} className="shrink-0 mt-0.5" style={{ color: accent }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-[13px] font-medium text-white/90" style={DISPLAY}>{ed.title}</div>
                  <span className="text-[10.5px] text-white/60 shrink-0" style={MONO}>{ed.period}</span>
                </div>
                <div className="text-[11.5px] mb-1.5" style={{ color: accent }}>{ed.place}</div>
                <p className="text-[12px] text-white/55 leading-5">{ed.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle color={accent}>{t("Certificaciones y capacitaciones", "Certifications and training")}</SectionTitle>
        <div className="grid grid-cols-1 @md:grid-cols-2 gap-3">
          {CERTS.map((c, i) => {
            const color = plain ? HR_ACCENT : [LANG.python.c1, LANG.java.c1, LANG.node.c1, CORE][i % 4];
            return (
              <div key={c.name} className="rounded-lg border p-3 flex items-start gap-2.5" style={{ borderColor: `${color}33`, background: `${color}0d` }}>
                <Award size={16} style={{ color }} className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-white/90 leading-4">{c.name}</div>
                  <div className="text-[10.5px] text-white/60 mt-1">{c.org} &middot; {c.year}</div>
                  {plain && HR_CERT_NOTES[c.name] && <p className="text-[11.5px] text-white/60 leading-5 mt-2">{HR_CERT_NOTES[c.name]}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle color={accent}>{t("Aprendiendo ahora", "Learning right now")}</SectionTitle>
        <ul className="space-y-2">
          {LEARNING.map((l) => (
            <li key={l.id} className="flex gap-3 rounded-lg border border-white/[0.08] px-3 py-2.5">
              <span className="relative flex w-2.5 h-2.5 mt-1.5 shrink-0" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: accent }} />
                <span className="relative inline-flex rounded-full w-2.5 h-2.5" style={{ background: accent }} />
              </span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-white/90">{l.name}</div>
                <p className="text-[11.5px] text-white/60 leading-5">{l.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <button
          onClick={() => openWindow("notes")}
          className="relative mt-3 inline-flex items-center gap-1.5 text-[11.5px] hover:underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden rounded-sm after:absolute after:content-[''] after:-inset-x-1 after:-inset-y-2"
          style={{ color: accent }}
        >
          <BookOpen size={13} /> {t("Ver mis notas técnicas", "Read my tech notes")} <ChevronRight size={12} />
        </button>
      </section>
    </div>
  );
}

export const EducationContent = () => <Education />;
export const EducationHRContent = () => <Education plain />;
