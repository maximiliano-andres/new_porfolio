/* Window contents for the RRHH view, including the dedicated recruiter summary. */
import { useEffect, useRef, useState } from "react";
import { Briefcase, Calendar, Check, CheckCircle2, ChevronRight, ClipboardCopy, Contact, Copy, FileText, Linkedin, MapPin, Target, TrendingUp } from "lucide-react";
import { BeforeAfter, CareerTimeline, Chip, CopyLinkButton, CountUp, SectionTitle, SimulatorBanner, Tilt } from "../components/ui.jsx";
import { useCareerRows } from "../lib/career.js";
import { useLang, useT } from "../app/context.js";
import { useContent } from "../data/useContent.js";
import { useHR } from "../data/useHR.js";
import { CONTACT_EMAIL, HR_ACCENT, LANG, SOCIAL_LINKS } from "../styles/theme.js";

const MONO = { fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" };
const DISPLAY = { fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" };
const FULL_NAME = "Maximiliano Andrés Caniullán Lefiñir";

/* "Copiado" feedback for a clipboard action; the timer is cleared on unmount */
function useCopied() {
  const [copied, setCopied] = useState(null);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 2000);
    } catch { /* clipboard unavailable (http / permissions) — the content stays visible to copy manually */ }
  };
  return [copied, copy];
}

const portfolioUrl = (lang) => {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.origin + "/");
  url.searchParams.set("vista", "rrhh");
  if (lang === "en") url.searchParams.set("lang", "en");
  return url.toString();
};

/* contact card (RFC 6350 vCard 3.0); no phone number on purpose */
function downloadVCard(lang) {
  const esc = (v) => String(v).replace(/[\\,;]/g, (c) => `\\${c}`);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc("Caniullán Lefiñir")};${esc("Maximiliano Andrés")};;;`,
    `FN:${esc(FULL_NAME)}`,
    "TITLE:Backend Developer",
    `EMAIL;TYPE=INTERNET:${CONTACT_EMAIL}`,
    `URL:${SOCIAL_LINKS.linkedin}`,
    `URL:${portfolioUrl(lang)}`,
    `ADR;TYPE=HOME:;;;Peñaflor;${esc("Región Metropolitana")};;Chile`,
    `NOTE:${esc(lang === "en" ? "Backend Developer · Java, Python, Node.js · performance optimization" : "Backend Developer · Java, Python, Node.js · optimización de rendimiento")}`,
    "END:VCARD",
  ];
  const blob = new Blob([lines.join("\r\n") + "\r\n"], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Maximiliano_Caniullan.vcf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function KpiGrid() {
  const { HR_KPIS } = useHR();
  return (
    <div className="grid grid-cols-1 @md:grid-cols-3 gap-3">
      {HR_KPIS.map((k) => (
        <Tilt key={k.client} className="h-full">
        <div className="h-full rounded-lg border p-3.5 flex @md:flex-col items-center @md:items-start gap-3 @md:gap-1" style={{ borderColor: `${k.color}33`, background: `${k.color}0b` }}>
          <div className="text-[24px] leading-none font-semibold shrink-0 min-w-[78px] @md:min-w-0" style={{ color: k.color, ...DISPLAY }}>
            <CountUp value={k.value} />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-white/90 leading-4 @md:mt-1.5">{k.label}</div>
            <div className="text-[11px] text-white/55 mt-1 leading-4">{k.detail}</div>
            <div className="text-[10px] text-white/60 mt-1.5" style={MONO}>{k.client}</div>
          </div>
        </div>
        </Tilt>
      ))}
    </div>
  );
}

const kitBtn = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-[11.5px] text-white/80 hover:text-white hover:bg-white/5 hover:border-white/25 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden";

export function HRSummaryContent({ onOpen }) {
  const t = useT();
  const { lang } = useLang();
  const { HR_FACTS, HR_KPIS, HR_SEEKING, HR_DOMAIN, HR_WORKSTYLE, HR_ROLES, ATS_KEYWORDS, HR_GLOSSARY } = useHR();
  const [copied, copy] = useCopied();

  // ready-to-paste summary for an ATS note or an email to the hiring manager
  const summary = [
    `${FULL_NAME} — Backend Developer (Java/Spring Boot, Python/FastAPI, Node.js)`,
    HR_FACTS.map((f) => `${f.label}: ${f.value}`).join(" · "),
    `${t("Resultados", "Results")}: ${HR_KPIS.map((k) => `${k.label} ${k.value} (${k.detail}, ${k.client})`).join("; ")}.`,
    `${t("Busca", "Looking for")}: ${HR_SEEKING.roles.join("; ")}.`,
    `${t("Correo", "Email")}: ${CONTACT_EMAIL} · LinkedIn: ${SOCIAL_LINKS.linkedin}`,
    `${t("Portafolio", "Portfolio")}: ${portfolioUrl(lang)}`,
  ].join("\n");

  return (
    <div className="w-full space-y-6">
      {/* candidate card */}
      <div className="rounded-xl border p-4" style={{ borderColor: `${HR_ACCENT}2e`, background: `linear-gradient(135deg, ${HR_ACCENT}0d, transparent 60%)` }}>
        <div className="flex items-center gap-3.5 mb-4">
          <img src="/img/max_andres_head_256.webp" width={256} height={234} decoding="async" alt="" className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0 bg-black/40" />
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-white leading-5 text-balance" style={DISPLAY}>{FULL_NAME}</div>
            <div className="text-[12px] text-white/55 mt-0.5">Backend Developer · {t("Especialista en optimización", "Optimization specialist")}</div>
          </div>
        </div>
        <dl className="grid grid-cols-2 @lg:grid-cols-3 gap-2.5">
          {HR_FACTS.map(({ Icon, label, value }) => (
            <div key={label} className="rounded-lg bg-black/25 border border-white/[0.06] px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/60" style={MONO}>
                <Icon size={11} style={{ color: HR_ACCENT }} /> {label}
              </dt>
              <dd className="text-[12.5px] text-white/90 mt-1 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* recruiter kit */}
      <section>
        <SectionTitle>{t("Kit para el reclutador", "Recruiter kit")}</SectionTitle>
        <div className="grid grid-cols-1 @md:grid-cols-3 gap-2">
          <button type="button" onClick={() => copy("summary", summary)} className={kitBtn}>
            {copied === "summary" ? <Check size={13} style={{ color: LANG.node.c2 }} /> : <ClipboardCopy size={13} />}
            {copied === "summary" ? t("Resumen copiado", "Summary copied") : t("Copiar resumen", "Copy summary")}
          </button>
          <button type="button" onClick={() => downloadVCard(lang)} className={kitBtn}>
            <Contact size={13} /> {t("Descargar contacto (vCard)", "Download contact (vCard)")}
          </button>
          <CopyLinkButton className="justify-center rounded-lg! py-2! text-[11.5px]!" params={{ vista: "rrhh", lang: lang === "en" ? "en" : null }} label={t("Copiar enlace a esta ficha", "Copy link to this summary")} />
        </div>
        <details className="mt-2.5">
          <summary className="cursor-pointer text-[11px] text-white/55 hover:text-white/80 select-none" style={MONO}>{t("Ver el resumen que se copia", "Preview the copied summary")}</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/30 p-3 text-[11px] leading-5 text-white/70 select-text" style={MONO}>{summary}</pre>
        </details>
      </section>

      <section>
        <SectionTitle>{t("En 30 segundos", "In 30 seconds")}</SectionTitle>
        <p className="text-[13px] leading-6 text-white/75">
          {t(
            <>Una aplicación se parece a un restaurante: el <span className="text-white">frontend</span> es el salón que ve el cliente
              y el <span className="text-white">backend</span> es la cocina, donde se prepara cada pedido. Yo trabajo en la cocina:
              construyo los sistemas que procesan la información y me especializo en que funcionen
              <span className="text-white"> más rápido y con menos recursos</span>, lo que se traduce en mejor servicio y menores costos.</>,
            <>An application is like a restaurant: the <span className="text-white">frontend</span> is the dining room the customer sees,
              and the <span className="text-white">backend</span> is the kitchen, where every order is prepared. I work in the kitchen:
              I build the systems that process the information, and I specialize in making them run
              <span className="text-white"> faster and with fewer resources</span>, which means better service and lower costs.</>
          )}
        </p>
      </section>

      <section>
        <SectionTitle>{t("Resultados medibles", "Measurable results")}</SectionTitle>
        <KpiGrid />
      </section>

      <section>
        <SectionTitle>{t("Qué busco", "What I'm looking for")}</SectionTitle>
        <p className="text-[12.5px] leading-6 text-white/70 mb-2.5">{HR_SEEKING.text}</p>
        <ul className="grid grid-cols-1 @md:grid-cols-2 gap-2">
          {HR_SEEKING.roles.map((r) => (
            <li key={r} className="flex gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-[12px] text-white/80 leading-5">
              <Target size={13} className="mt-[3px] shrink-0" style={{ color: HR_ACCENT }} />{r}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle>{t("Conozco el negocio de RRHH", "I know the HR business")}</SectionTitle>
        <p className="text-[12.5px] leading-6 text-white/70 mb-3">{HR_DOMAIN.intro}</p>
        <dl className="grid grid-cols-1 @lg:grid-cols-2 gap-x-5 gap-y-3">
          {HR_DOMAIN.items.map((d) => (
            <div key={d.term} className="border-l-2 pl-3" style={{ borderColor: `${HR_ACCENT}55` }}>
              <dt className="text-[12px] font-medium text-white/90">{d.term}</dt>
              <dd className="text-[11.5px] text-white/60 leading-5 mt-0.5">{d.evidence}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <SectionTitle>{t("Cómo trabajo", "How I work")}</SectionTitle>
        <ul className="grid grid-cols-1 @lg:grid-cols-2 gap-2.5">
          {HR_WORKSTYLE.map(({ Icon, title, evidence }) => (
            <li key={title} className="flex gap-3 rounded-lg border border-white/[0.08] p-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${HR_ACCENT}14`, color: HR_ACCENT }}>
                <Icon size={15} />
              </span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-white/90">{title}</div>
                <p className="text-[11.5px] text-white/60 leading-5 mt-0.5">{evidence}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle>{t("Cargos donde encajo", "Roles I fit")}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {HR_ROLES.map((r) => <Chip key={r} color={HR_ACCENT}>{r}</Chip>)}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <SectionTitle className="mb-0!">{t("Palabras clave para filtros (ATS)", "Keywords for ATS filters")}</SectionTitle>
          <button
            onClick={() => copy("ats", ATS_KEYWORDS.join(", "))}
            className="inline-flex items-center gap-1.5 shrink-0 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-white/70 hover:text-white hover:border-white/25 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
          >
            {copied === "ats" ? <><Check size={12} style={{ color: LANG.node.c2 }} /> {t("Copiado", "Copied")}</> : <><Copy size={12} /> {t("Copiar", "Copy")}</>}
          </button>
        </div>
        <p className="text-[11.5px] text-white/50 mb-2.5">{t("Términos técnicos de mi perfil tal como aparecen en avisos de empleo.", "Technical terms from my profile, as they appear in job posts.")}</p>
        <div className="flex flex-wrap gap-1.5">
          {ATS_KEYWORDS.map((k) => (
            <span key={k} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/70" style={MONO}>{k}</span>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>{t("Glosario express", "Quick glossary")}</SectionTitle>
        <dl className="grid grid-cols-1 @lg:grid-cols-2 gap-x-5 gap-y-3">
          {HR_GLOSSARY.map((g) => (
            <div key={g.term} className="border-l-2 pl-3" style={{ borderColor: `${HR_ACCENT}55` }}>
              <dt className="text-[12px] font-medium text-white/90">{g.term}</dt>
              <dd className="text-[11.5px] text-white/60 leading-5 mt-0.5">{g.def}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="flex flex-wrap gap-2.5 pt-4 border-t border-white/10">
        <button
          onClick={() => onOpen("contact")}
          className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-[12.5px] font-medium hover:brightness-110 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden"
          style={{ background: `linear-gradient(90deg, ${HR_ACCENT}, ${LANG.java.c1})`, color: "#05070b" }}
        >
          <Calendar size={14} /> {t("Coordinar una entrevista", "Schedule an interview")}
        </button>
        <a
          href={SOCIAL_LINKS.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 py-2.5 text-[12.5px] font-medium text-white/80 hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
        >
          <Linkedin size={14} /> {t("Ver perfil en LinkedIn", "View LinkedIn profile")}
        </a>
        <button
          onClick={() => onOpen("cv")}
          className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 py-2.5 text-[12.5px] font-medium text-white/80 hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
        >
          <FileText size={14} /> {t("Ver CV", "View CV")}
        </button>
      </div>
    </div>
  );
}

export function AboutHRContent() {
  const t = useT();
  const { HR_VALUE, HR_SEEKING, HR_WORKSTYLE } = useHR();
  return (
    <div className="w-full space-y-5">
      <div className="flex items-center gap-3.5">
        <img src="/img/max_andres_head_256.webp" width={256} height={234} decoding="async" alt="Maximiliano Caniullán" className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 bg-black/40" />
        <div className="min-w-0">
          <h3 className="text-white text-[15px] font-semibold text-balance" style={DISPLAY}>{FULL_NAME}</h3>
          <p className="text-white/50 text-[12px]">{t("Desarrollador de sistemas · Especialista en eficiencia", "Systems developer · Efficiency specialist")}</p>
        </div>
      </div>

      <section>
        <SectionTitle>{t("En pocas palabras", "In a nutshell")}</SectionTitle>
        <p className="text-[13px] leading-6 text-white/75">
          {t(
            <>Construyo y mejoro la parte invisible de las aplicaciones: la que procesa la información cada vez que un usuario
              presiona un botón. Mi sello es la <strong className="text-white/90">eficiencia</strong>: hago que los sistemas respondan
              más rápido y cuesten menos de operar. Llevo <strong className="text-white/90">más de 2 años</strong> resolviendo este tipo de
              desafíos en empresas como Push HR y BiceVida.</>,
            <>I build and improve the invisible part of applications: the part that processes information every time a user
              presses a button. My trademark is <strong className="text-white/90">efficiency</strong>: I make systems respond
              faster and cost less to run. I've spent <strong className="text-white/90">over 2 years</strong> solving this kind of
              challenge at companies like Push HR and BiceVida.</>
          )}
        </p>
      </section>

      <section>
        <SectionTitle>{t("Qué aporto a tu organización", "What I bring to your organization")}</SectionTitle>
        <ul className="space-y-3">
          {HR_VALUE.map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${HR_ACCENT}14`, color: HR_ACCENT }}>
                <Icon size={15} />
              </span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-white/90">{title}</div>
                <p className="text-[12px] text-white/60 leading-5 mt-0.5">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle>{t("Cómo trabajo", "How I work")}</SectionTitle>
        <ul className="space-y-2">
          {HR_WORKSTYLE.slice(0, 4).map(({ Icon, title, evidence }) => (
            <li key={title} className="flex gap-2.5 text-[12px] leading-5">
              <Icon size={14} className="mt-[3px] shrink-0" style={{ color: HR_ACCENT }} />
              <span><span className="text-white/90 font-medium">{title}.</span> <span className="text-white/60">{evidence}</span></span>
            </li>
          ))}
        </ul>
      </section>

      <section className="pt-4 border-t border-white/10">
        <SectionTitle>{t("Lo que busco", "What I'm looking for")}</SectionTitle>
        <p className="text-[12.5px] leading-6 text-white/65 mb-2">{HR_SEEKING.text}</p>
        <div className="flex flex-wrap gap-1.5">
          {HR_SEEKING.roles.map((r) => <Chip key={r} color={HR_ACCENT}>{r}</Chip>)}
        </div>
      </section>
    </div>
  );
}

export function SkillsHRContent() {
  const t = useT();
  const { PROJECT_HISTORY } = useContent();
  const { HR_COMPETENCIES } = useHR();
  /* projects of the history where a competency was applied (see HR_COMPETENCIES) */
  const competencyCount = (c) =>
    c.projects ? c.projects.length : PROJECT_HISTORY.filter((p) => c.tech.some((tech) => p.tech.includes(tech))).length;
  return (
    <div className="w-full">
      <p className="text-[12.5px] text-white/60 mb-4 leading-5">
        {t(
          "Mis competencias traducidas a lo que significan para una empresa. Debajo de cada una aparecen los nombres técnicos que suelen pedir los avisos de empleo.",
          "My skills translated into what they mean for a company. Under each one are the technical names job posts usually ask for."
        )}
      </p>
      <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-3">
        {HR_COMPETENCIES.map((c) => (
          <div key={c.area} className="rounded-lg border p-3.5 flex flex-col" style={{ borderColor: `${c.color}2e`, background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="text-[13px] font-medium text-white/90 leading-5" style={DISPLAY}>{c.area}</div>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap" style={{ color: c.color, background: `${c.color}17`, ...MONO }}>
                {t(`En ${competencyCount(c)} de ${PROJECT_HISTORY.length} proyectos`, `In ${competencyCount(c)} of ${PROJECT_HISTORY.length} projects`)}
              </span>
            </div>
            <p className="text-[12px] text-white/65 leading-5 mb-3">{c.plain}</p>
            <div className="mt-auto flex flex-wrap gap-1.5">
              {c.tech.map((tech) => (
                <span key={tech} className="rounded-sm border border-white/10 px-1.5 py-0.5 text-[10.5px] text-white/50" style={MONO}>{tech}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[10.5px] text-white/60 leading-4">
        {t(
          "Cantidad de proyectos de mi histórico 2023–2026 en que apliqué cada competencia. El detalle por tecnología está en la vista TI.",
          "Number of projects in my 2023–2026 history where I applied each skill. The per-technology breakdown is in the Tech view."
        )}
      </p>
    </div>
  );
}

export function ProjectsHRContent({ onOpenProject }) {
  const t = useT();
  const { PROJECTS } = useContent();
  const { HR_PROJECTS } = useHR();
  return (
    <div className="w-full">
      <SimulatorBanner />
      <p className="text-[12.5px] text-white/60 mb-3">{t("Resultados concretos en empresas reales y herramientas que construí este año. Selecciona uno para ver el detalle.", "Concrete results at real companies and tools I built this year. Pick one to see the details.")}</p>
      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-3">
        {PROJECTS.map((p) => {
          const hr = HR_PROJECTS[p.id];
          return (
            <Tilt key={p.id} className="h-full">
            <button
              onClick={() => onOpenProject(p.id)}
              className="w-full h-full text-left rounded-lg border border-white/10 p-3.5 hover:border-white/25 hover:-translate-y-0.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden flex flex-col"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <BeforeAfter hr={hr} />
              <div className="text-[13px] font-medium text-white/90 mt-2 mb-1" style={DISPLAY}>{hr.title}</div>
              <div className="text-[10.5px] text-white/60 mb-1">{p.org}</div>
              <p className="text-[11.5px] text-white/60 leading-5 mb-2">{hr.result}</p>
              <div className="mt-auto flex items-center gap-1 text-[10.5px]" style={{ color: HR_ACCENT }}>
                {t("Ver el caso", "View the case")} <ChevronRight size={12} />
              </div>
            </button>
            </Tilt>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectDetailHRContent({ project }) {
  const t = useT();
  const { HR_PROJECTS } = useHR();
  const hr = HR_PROJECTS[project.id];
  const steps = [
    { label: t("El desafío", "The challenge"), text: hr.challenge, Icon: Target },
    { label: t("Lo que hice", "What I did"), text: hr.action, Icon: Briefcase },
    { label: t("El resultado", "The result"), text: hr.result, Icon: TrendingUp },
  ];
  return (
    <div className="w-full">
      <div className="rounded-lg border p-4 mb-4 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: `${HR_ACCENT}33`, background: `${HR_ACCENT}0b` }}>
        <div className="text-[10.5px] uppercase tracking-wider text-white/60" style={MONO}>{t("Impacto", "Impact")}</div>
        <BeforeAfter hr={hr} size="text-[18px] @md:text-[22px]" />
      </div>
      <ol className="space-y-3.5">
        {steps.map(({ label, text, Icon }) => (
          <li key={label} className="flex gap-3">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/10" style={{ color: HR_ACCENT }}>
              <Icon size={14} />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-white/60" style={MONO}>{label}</div>
              <p className="text-[12.5px] text-white/80 leading-5 mt-0.5">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex justify-end">
        <CopyLinkButton params={{ proyecto: project.id, vista: "rrhh" }} label={t("Copiar enlace a este logro", "Copy link to this achievement")} />
      </div>
      {project.id === "buk-migration" && <SimulatorBanner compact />}
    </div>
  );
}

export function ExperienceHRContent() {
  const t = useT();
  const { EXPERIENCE } = useContent();
  const { HR_EXPERIENCE } = useHR();
  const rows = useCareerRows(HR_ACCENT);
  return (
    <div className="w-full">
      <CareerTimeline rows={rows} title={t("Línea de tiempo", "Timeline")} />
      <div className="relative pl-5 border-l" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
        {EXPERIENCE.map((e, i) => (
          <div key={i} className="mb-5 last:mb-0 relative">
            <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: HR_ACCENT, background: "#0d1117" }} />
            <div className="text-[13px] font-medium text-white/90" style={DISPLAY}>{HR_EXPERIENCE[i].plainRole}</div>
            <div className="text-[11.5px] mb-1" style={{ color: HR_ACCENT }}>{e.company}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-white/60 mb-2" style={MONO}>
              <span className="inline-flex items-center gap-1"><Calendar size={11} /> {e.period}</span>
              <span className="inline-flex items-center gap-1"><MapPin size={11} /> {e.location}</span>
              <span className="inline-flex items-center gap-1"><Briefcase size={11} /> {t("Cargo técnico", "Job title")}: {e.role}</span>
            </div>
            <ul className="space-y-1.5">
              {HR_EXPERIENCE[i].bullets.map((b) => (
                <li key={b} className="text-[12px] text-white/65 leading-5 flex gap-2">
                  <CheckCircle2 size={12} className="mt-1 shrink-0" style={{ color: `${HR_ACCENT}aa` }} />{b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
