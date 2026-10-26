/* Window contents for the technical (TI) view. */
import { useState } from "react";
import { Award, Calendar, ChevronRight, Cpu, Gauge, MapPin, MemoryStick, ShieldCheck } from "lucide-react";
import { LangBadge, ProjectDiagram, RadarChart, SimulatorBanner, SkillBar, Tilt } from "../components/ui.jsx";
import { CERTS, DB_TOOLS, EDUCATION, EXPERIENCE, PROJECTS, RADAR, SKILL_BARS } from "../data/content.js";
import { CORE, LANG } from "../theme.js";

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
                  alt="Maximiliano Caniullan"
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
          <span className="text-[10px] text-white/40 mt-1.5 font-mono">max_andres_head.webp</span>
        </div>

        {/* Column 2: Presentation Text */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 mb-3 text-center @md:text-left">
            <div className="w-full">
              <h3 className="text-white text-[15px] font-semibold text-balance" style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>
                Maximiliano Andrés Caniullan Lefiñir
              </h3>
              <p className="text-white/50 text-[12px]">Backend Developer &middot; Especialista en Optimización</p>
            </div>
          </div>

          <div className="space-y-4 text-[13px] leading-6 text-white/75">
            <p>
              Soy <strong className="text-white/90">Backend Developer</strong> enfocado en crear sistemas rápidos, eficientes y preparados para soportar miles de usuarios en simultáneo.
            </p>
            <p>
              Mi especialidad es la <strong className="text-white/90">optimización</strong>: hago que las aplicaciones funcionen a máxima velocidad consumiendo la menor cantidad de recursos posible. Esto se traduce directamente en una mejor experiencia para el usuario y una reducción significativa en los costos de infraestructura en la nube.
            </p>
            <p>
              A lo largo de mi trayectoria de <strong className="text-white/90">2 años</strong>, he colaborado con empresas para resolver cuellos de botella críticos de rendimiento y transformar flujos complejos en arquitecturas backend ágiles, estables y escalables.
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
              <strong>Optimización de rendimiento y reducción de costos:</strong> Reduzco el consumo de memoria y CPU, disminuyendo costos de infraestructura y mejorando la eficiencia general.
            </div>
          </li>
          <li className="flex gap-2.5">
            <span className="text-cyan-400">⚡</span>
            <div>
              <strong>Desarrollo de aplicaciones de alto rendimiento:</strong> Utilizo tecnologías modernas como GraalVM para lograr tiempos de inicio ultra-rápidos y respuestas en milisegundos.
            </div>
          </li>
          <li className="flex gap-2.5">
            <span className="text-cyan-400">⚡</span>
            <div>
              <strong>Automatización y procesamiento masivo de datos:</strong> Diseño procesos eficientes para grandes volúmenes de información, garantizando estabilidad y disponibilidad.
            </div>
          </li>
        </ul>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10">
        <h4 className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-2" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
          Objetivo Profesional
        </h4>
        <p className="text-[12px] leading-5 text-white/60">
          Estoy interesado en integrarme a equipos tecnológicos y startups que desarrollen productos escalables y de alto impacto como Backend Developer. Busco proyectos donde el rendimiento, la calidad del código y la arquitectura sean prioridades, aportando soluciones que permitan al negocio crecer sin limitaciones técnicas.
        </p>
      </div>
    </div>
  );
}

export function SkillsContent() {
  return (
    <div className="w-full">
      <p className="text-[12px] text-white/60 mb-4">
        Métricas relativas de cada runtime en mi stack &mdash; velocidad, memoria, seguridad,
        concurrencia y ecosistema disponible hoy.
      </p>
      <div className="grid grid-cols-1 @lg:grid-cols-3 gap-3 @lg:gap-4 mb-5">
        {Object.entries(LANG).map(([id, l]) => (
          <div key={id} className="rounded-lg border p-3 min-w-0" style={{ borderColor: `${l.c1}2a`, background: "rgba(255,255,255,0.02)" }}>
            <div className="text-center text-[11.5px] font-medium mb-1" style={{ color: l.c2, fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>
              {l.name}
            </div>
            <RadarChart values={RADAR[id]} color={l.c1} size={150} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 gap-5">
        {Object.entries(SKILL_BARS).map(([id, bars]) => (
          <div key={id} className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-wider mb-2" style={{ color: LANG[id].c2, fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
              {LANG[id].name}
            </div>
            {bars.map((b, i) => (
              <SkillBar key={b.name} name={b.name} value={b.v} color={LANG[id].c1} delay={i * 90} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-white/[0.08]">
        <div className="text-[10.5px] uppercase tracking-wider mb-2 text-white/40" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
          Datos &amp; infraestructura
        </div>
        <div className="flex flex-wrap gap-2">
          {DB_TOOLS.map((t) => (
            <span key={t.name} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/70">
              {t.icon === "Database" && <Cpu size={11} style={{ color: CORE }} />}
              {t.icon === "Layers" && <MemoryStick size={11} style={{ color: CORE }} />}
              {t.icon === "Network" && <Gauge size={11} style={{ color: CORE }} />}
              {t.icon === "Lock" && <ShieldCheck size={11} style={{ color: CORE }} />}
              {t.name}
            </span>
          ))}
        </div>
      </div>
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
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {p.langs.map((l) => <LangBadge key={l} id={l} />)}
            </div>
            <div className="text-[13px] font-medium text-white/90 mb-1" style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>
              {p.title}
            </div>
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
      {project.id === "iacc-optimizer" && <SimulatorBanner compact />}
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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-white/40 mb-2" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
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
            <span className="text-[10.5px] text-white/40 shrink-0" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>{ed.period}</span>
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
              <div className="text-[10.5px] text-white/45 mt-1">{c.org} &middot; {c.year}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
