/* Window contents for the RRHH view, including the dedicated recruiter summary. */
import { useState } from "react";
import { Award, Briefcase, Calendar, Check, CheckCircle2, ChevronRight, Copy, Linkedin, MapPin, Target, TrendingUp } from "lucide-react";
import { BeforeAfter, Chip, CountUp, SectionTitle, SimulatorBanner, Tilt } from "../components/ui.jsx";
import { CERTS, EXPERIENCE, PROJECTS } from "../data/content.js";
import { ATS_KEYWORDS, HR_CERT_NOTES, HR_COMPETENCIES, HR_EXPERIENCE, HR_FACTS, HR_GLOSSARY, HR_KPIS, HR_PROJECTS, HR_ROLES, HR_VALUE } from "../data/hr.js";
import { HR_ACCENT, LANG, SOCIAL_LINKS } from "../theme.js";

function KpiGrid() {
  return (
    <div className="grid grid-cols-1 @md:grid-cols-3 gap-3">
      {HR_KPIS.map((k) => (
        <Tilt key={k.client} className="h-full">
        <div className="h-full rounded-lg border p-3.5 flex @md:flex-col items-center @md:items-start gap-3 @md:gap-1" style={{ borderColor: `${k.color}33`, background: `${k.color}0b` }}>
          <div className="text-[26px] leading-none font-semibold shrink-0 min-w-[78px] @md:min-w-0" style={{ color: k.color, fontFamily: "'Space Grotesk', sans-serif" }}>
            <CountUp value={k.value} />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-white/90 leading-4 @md:mt-1.5">{k.label}</div>
            <div className="text-[11px] text-white/55 mt-1 leading-4">{k.detail}</div>
            <div className="text-[10px] text-white/40 mt-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{k.client}</div>
          </div>
        </div>
        </Tilt>
      ))}
    </div>
  );
}

export function HRSummaryContent({ onOpen }) {
  const [copied, setCopied] = useState(false);
  const copyKeywords = async () => {
    try {
      await navigator.clipboard.writeText(ATS_KEYWORDS.join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable (http / permissions) — keywords stay visible to copy manually */ }
  };

  return (
    <div className="w-full space-y-6">
      {/* candidate card */}
      <div className="rounded-xl border p-4" style={{ borderColor: `${HR_ACCENT}2e`, background: `linear-gradient(135deg, ${HR_ACCENT}0d, transparent 60%)` }}>
        <div className="flex items-center gap-3.5 mb-4">
          <img src="/img/max_andres_head.webp" alt="" className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0 bg-black/40" />
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-white leading-5 text-balance" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Maximiliano Andrés Caniullan Lefiñir
            </div>
            <div className="text-[12px] text-white/55 mt-0.5">Backend Developer · Especialista en optimización</div>
          </div>
        </div>
        <dl className="grid grid-cols-2 @lg:grid-cols-4 gap-2.5">
          {HR_FACTS.map(({ Icon, label, value }) => (
            <div key={label} className="rounded-lg bg-black/25 border border-white/[0.06] px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <Icon size={11} style={{ color: HR_ACCENT }} /> {label}
              </dt>
              <dd className="text-[12.5px] text-white/90 mt-1 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section>
        <SectionTitle>En 30 segundos</SectionTitle>
        <p className="text-[13px] leading-6 text-white/75">
          Una aplicación se parece a un restaurante: el <span className="text-white">frontend</span> es el salón que ve el cliente
          y el <span className="text-white">backend</span> es la cocina, donde se prepara cada pedido. Yo trabajo en la cocina:
          construyo los sistemas que procesan la información y me especializo en que funcionen
          <span className="text-white"> más rápido y con menos recursos</span>, lo que se traduce en mejor servicio y menores costos.
        </p>
      </section>

      <section>
        <SectionTitle>Resultados medibles</SectionTitle>
        <KpiGrid />
      </section>

      <section>
        <SectionTitle>Cargos donde encajo</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {HR_ROLES.map((r) => <Chip key={r} color={HR_ACCENT}>{r}</Chip>)}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <SectionTitle className="!mb-0">Palabras clave para filtros (ATS)</SectionTitle>
          <button
            onClick={copyKeywords}
            className="inline-flex items-center gap-1.5 shrink-0 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-white/70 hover:text-white hover:border-white/25 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
          >
            {copied ? <><Check size={12} style={{ color: LANG.node.c2 }} /> Copiado</> : <><Copy size={12} /> Copiar</>}
          </button>
        </div>
        <p className="text-[11.5px] text-white/50 mb-2.5">Términos técnicos de mi perfil tal como aparecen en avisos de empleo.</p>
        <div className="flex flex-wrap gap-1.5">
          {ATS_KEYWORDS.map((k) => (
            <span key={k} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/70" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {k}
            </span>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Glosario express</SectionTitle>
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
          className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-[12.5px] font-medium hover:brightness-110 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none"
          style={{ background: `linear-gradient(90deg, ${HR_ACCENT}, ${LANG.java.c1})`, color: "#05070b" }}
        >
          <Calendar size={14} /> Coordinar una entrevista
        </button>
        <a
          href={SOCIAL_LINKS.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 py-2.5 text-[12.5px] font-medium text-white/80 hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
        >
          <Linkedin size={14} /> Ver perfil en LinkedIn
        </a>
      </div>
    </div>
  );
}

export function AboutHRContent() {
  return (
    <div className="w-full space-y-5">
      <div className="flex items-center gap-3.5">
        <img src="/img/max_andres_head.webp" alt="Maximiliano Caniullan" className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 bg-black/40" />
        <div className="min-w-0">
          <h3 className="text-white text-[15px] font-semibold text-balance" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Maximiliano Andrés Caniullan Lefiñir
          </h3>
          <p className="text-white/50 text-[12px]">Desarrollador de sistemas · Especialista en eficiencia</p>
        </div>
      </div>

      <section>
        <SectionTitle>En pocas palabras</SectionTitle>
        <p className="text-[13px] leading-6 text-white/75">
          Construyo y mejoro la parte invisible de las aplicaciones: la que procesa la información cada vez que un usuario
          presiona un botón. Mi sello es la <strong className="text-white/90">eficiencia</strong>: hago que los sistemas respondan
          más rápido y cuesten menos de operar. Llevo <strong className="text-white/90">2 años</strong> resolviendo este tipo de
          desafíos para empresas.
        </p>
      </section>

      <section>
        <SectionTitle>Qué aporto a tu organización</SectionTitle>
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

      <section className="pt-4 border-t border-white/10">
        <SectionTitle>Lo que busco</SectionTitle>
        <p className="text-[12.5px] leading-6 text-white/65">
          Integrarme como Backend Developer a equipos de tecnología y startups que desarrollen productos de alto impacto,
          donde la calidad, la velocidad y la solidez de los sistemas sean una prioridad para el crecimiento del negocio.
        </p>
      </section>
    </div>
  );
}

export function SkillsHRContent() {
  return (
    <div className="w-full">
      <p className="text-[12.5px] text-white/60 mb-4 leading-5">
        Mis competencias traducidas a lo que significan para una empresa. Debajo de cada una aparecen los nombres técnicos
        que suelen pedir los avisos de empleo.
      </p>
      <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-3">
        {HR_COMPETENCIES.map((c) => (
          <div key={c.area} className="rounded-lg border p-3.5 flex flex-col" style={{ borderColor: `${c.color}2e`, background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="text-[13px] font-medium text-white/90 leading-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.area}</div>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap" style={{ color: c.color, background: `${c.color}17`, fontFamily: "'JetBrains Mono', monospace" }}>
                {c.level}
              </span>
            </div>
            <p className="text-[12px] text-white/65 leading-5 mb-3">{c.plain}</p>
            <div className="mt-auto flex flex-wrap gap-1.5">
              {c.tech.map((t) => (
                <span key={t} className="rounded border border-white/10 px-1.5 py-0.5 text-[10.5px] text-white/50" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[10.5px] text-white/40 leading-4">
        Niveles basados en la autoevaluación técnica del perfil (vista TI). Donde no hay medición, se indica la evidencia práctica.
      </p>
    </div>
  );
}

export function ProjectsHRContent({ onOpenProject }) {
  return (
    <div className="w-full">
      <SimulatorBanner />
      <p className="text-[12.5px] text-white/60 mb-3">Resultados concretos en empresas reales. Selecciona uno para ver el detalle.</p>
      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-3">
        {PROJECTS.map((p) => {
          const hr = HR_PROJECTS[p.id];
          return (
            <Tilt key={p.id} className="h-full">
            <button
              onClick={() => onOpenProject(p.id)}
              className="w-full h-full text-left rounded-lg border border-white/10 p-3.5 hover:border-white/25 hover:-translate-y-0.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none flex flex-col"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <BeforeAfter hr={hr} />
              <div className="text-[13px] font-medium text-white/90 mt-2 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{hr.title}</div>
              <p className="text-[11.5px] text-white/60 leading-5 mb-2">{hr.result}</p>
              <div className="mt-auto flex items-center gap-1 text-[10.5px]" style={{ color: HR_ACCENT }}>
                Ver el caso <ChevronRight size={12} />
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
  const hr = HR_PROJECTS[project.id];
  const steps = [
    { label: "El desafío", text: hr.challenge, Icon: Target },
    { label: "Lo que hice", text: hr.action, Icon: Briefcase },
    { label: "El resultado", text: hr.result, Icon: TrendingUp },
  ];
  return (
    <div className="w-full">
      <div className="rounded-lg border p-4 mb-4 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: `${HR_ACCENT}33`, background: `${HR_ACCENT}0b` }}>
        <div className="text-[10.5px] uppercase tracking-wider text-white/45" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Impacto</div>
        <BeforeAfter hr={hr} size="text-[18px] @md:text-[22px]" />
      </div>
      <ol className="space-y-3.5">
        {steps.map(({ label, text, Icon }) => (
          <li key={label} className="flex gap-3">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/10" style={{ color: HR_ACCENT }}>
              <Icon size={14} />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-white/45" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
              <p className="text-[12.5px] text-white/80 leading-5 mt-0.5">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      {project.id === "iacc-optimizer" && <SimulatorBanner compact />}
    </div>
  );
}

export function ExperienceHRContent() {
  return (
    <div className="w-full">
      <div className="relative pl-5 border-l" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
        {EXPERIENCE.map((e, i) => (
          <div key={i} className="mb-5 last:mb-0 relative">
            <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: HR_ACCENT, background: "#0d1117" }} />
            <div className="text-[13px] font-medium text-white/90" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{HR_EXPERIENCE[i].plainRole}</div>
            <div className="text-[11.5px] mb-1" style={{ color: HR_ACCENT }}>{e.company}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-white/40 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span className="inline-flex items-center gap-1"><Calendar size={11} /> {e.period}</span>
              <span className="inline-flex items-center gap-1"><MapPin size={11} /> {e.location}</span>
              <span className="inline-flex items-center gap-1"><Briefcase size={11} /> Cargo técnico: {e.role}</span>
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

export function CertificationsHRContent() {
  return (
    <div className="w-full grid grid-cols-1 @md:grid-cols-2 gap-3">
      {CERTS.map((c) => (
        <div key={c.name} className="rounded-lg border border-white/10 p-3.5 flex items-start gap-2.5" style={{ background: "rgba(255,255,255,0.02)" }}>
          <Award size={16} style={{ color: HR_ACCENT }} className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-white/90 leading-4">{c.name}</div>
            <div className="text-[10.5px] text-white/45 mt-1">{c.org} &middot; {c.year}</div>
            <p className="text-[11.5px] text-white/60 leading-5 mt-2">{HR_CERT_NOTES[c.name]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
