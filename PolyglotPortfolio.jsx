import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext, useId } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import {
  User, Code2, FolderGit2, Briefcase, GraduationCap, Award, Mail,
  Github, Linkedin, Send,
  Cpu, MemoryStick, ShieldCheck, Gauge, ChevronRight,
  MapPin, Calendar, CheckCircle2, AlertCircle, Loader2, Sparkles,
  Terminal, Users, Laptop, Copy, Check, ArrowRight, Target, TrendingUp, TrendingDown,
} from "lucide-react";

/* ============================================================
   DESIGN TOKENS
   Display: "Space Grotesk" — technical, geometric, reads like an
   engineering typeface rather than a generic portfolio serif.
   Body: "Inter". Utility/data: "JetBrains Mono" (stats, badges).
   Palette: near-black PCB base + the three runtime colors
   (Python / Java / Node) + a cyan "compiled core" accent that
   stands for the native, memory-safe, zero-cost layer underneath
   every runtime — the literal "background" of this portfolio.
   ============================================================ */

const LANG = {
  python: { name: "Python", c1: "#4B8BBE", c2: "#FFD43B", label: "CPython 3.13" },
  java: { name: "Java", c1: "#F8981D", c2: "#5382A1", label: "OpenJDK 21 LTS" },
  node: { name: "Node.js", c1: "#3C8C40", c2: "#7CC576", label: "Node 22 LTS" },
};
const CORE = "#22D3EE";
const SOCIAL_LINKS = {
  github: "https://github.com/maxcaniullan",
  linkedin: "https://www.linkedin.com/in/maximiliano-caniullan-lefi%C3%B1ir/",
  email: "mailto:max.andres.caniullan@gmail.com"
};

const NOTIFICATION_MESSAGES = [
  {
    title: "Guía de Interacción",
    text: "¡Bienvenido! Abre las ventanas desde la barra inferior (Dock); puedes arrastrarlas, minimizarlas o maximizarlas. Con el selector TI / RRHH eliges leer el portafolio en lenguaje técnico o en lenguaje de negocio."
  },
  {
    title: "Optimización IACC",
    text: "⚡ En IACC, logré reducir el tiempo de un proceso crítico de 1 hora a solo 5-10 minutos (una mejora superior al 83%)."
  },
  {
    title: "Latencia Reducida",
    text: "🚀 En PUMA, optimicé las interfaces reduciendo los tiempos de respuesta de 4 segundos a milisegundos."
  },
  {
    title: "Rendimiento SQL",
    text: "💾 En GyG, optimicé las consultas a bases de datos incrementando la velocidad en más de un 20%."
  },
  {
    title: "Eficiencia & Nube",
    text: "☁️ Mi especialidad es la optimización de código para disminuir el consumo de CPU y memoria, reduciendo costos de infraestructura."
  },
  {
    title: "Stack Políglota",
    text: "🛠️ Desarrollo sistemas backend robustos usando Java (Spring Boot con compilación GraalVM), Python (FastAPI/Django) y Node.js."
  }
];

/* ---------- boot sequence: the hero, staged as a compile log ---------- */
/* localStorage throws in some private-browsing modes — never let that break the boot */
const storage = {
  get(k) { try { return window.localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch { /* ignore */ } },
};

const BOOT_LINES = [
  { t: "$ init polyglot_core --runtime=python,java,node", kind: "cmd" },
  { t: "  \u251c\u2500 mounting CPython 3.13 ................. OK", kind: "ok" },
  { t: "  \u251c\u2500 mounting OpenJDK 21 (virtual threads) .. OK", kind: "ok" },
  { t: "  \u2514\u2500 mounting Node 22 LTS ................... OK", kind: "ok" },
  { t: "$ verify --memory-safety --tls --no-known-cves", kind: "cmd" },
  { t: "  \u2514\u2500 0 vulnerabilities \u00b7 0 GC pauses > 4ms .. OK", kind: "ok" },
  { t: "$ compile ui --target=web --mode=release", kind: "cmd" },
  { t: "  \u2514\u2500 build ready in 84ms", kind: "ok" },
  { t: "$ boot complete \u2014 welcome", kind: "cmd" },
];

function BootScreen({ onDone }) {
  const [count, setCount] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const finish = useCallback(() => {
    setLeaving(true);
    storage.set("boot_seen", "1");
    setTimeout(onDone, 250);
  }, [onDone]);

  useEffect(() => {
    if (storage.get("boot_seen")) {
      onDone();
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lineDelay = reduceMotion ? 30 : 190;
    const endDelay = reduceMotion ? 250 : 2150;
    const doneDelay = reduceMotion ? 350 : 2750;

    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= BOOT_LINES.length) clearInterval(iv);
    }, lineDelay);
    const endTimer = setTimeout(() => setLeaving(true), endDelay);
    const doneTimer = setTimeout(finish, doneDelay);
    return () => {
      clearInterval(iv);
      clearTimeout(endTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone, finish]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#05070b] px-4 cursor-pointer"
      onClick={finish}
      animate={leaving ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
      style={{ pointerEvents: leaving ? "none" : "auto" }}
      aria-hidden={leaving}
      role="status"
      aria-label="Cargando portafolio, clic para saltar"
    >
      <div
        className="w-full max-w-xl rounded-lg border px-4 py-4 sm:px-6 sm:py-6"
        style={{
          borderColor: "rgba(34,211,238,0.25)",
          background: "rgba(10,14,20,0.92)",
          boxShadow: "0 0 60px rgba(34,211,238,0.08)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <div className="flex items-center gap-1.5 pb-3 mb-3 border-b border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-3 text-[11px] text-white/40">boot \u2014 polyglot_core</span>
        </div>
        <div className="text-[9.5px] min-[380px]:text-[11px] sm:text-[13px] leading-5 sm:leading-6 min-h-[180px] sm:min-h-[210px] overflow-x-auto">
          {BOOT_LINES.slice(0, count).map((line, i) => (
            <div
              key={i}
              style={{
                color: line.kind === "ok" ? "#7CC576" : CORE,
                whiteSpace: "pre",
              }}
            >
              {line.t}
            </div>
          ))}
          {count >= BOOT_LINES.length && (
            <span className="inline-block w-2 h-4 bg-[#22D3EE] align-middle animate-pulse ml-1" />
          )}
        </div>
        <p className="mt-3 text-right text-[10px] text-white/30" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          clic para saltar &rarr;
        </p>
      </div>
    </motion.div>
  );
}

/* ---------- circuit background: signature element ---------- */
const CIRCUIT_PATHS = [
  { d: "M0,120 H260 V260 H520 V180 H760", color: LANG.python.c1, dur: 5.5, delay: 0 },
  { d: "M0,420 H180 V520 H460 V420 H720", color: LANG.java.c1, dur: 6.2, delay: 0.6 },
  { d: "M0,680 H320 V600 H580 V680 H760", color: LANG.node.c1, dur: 5.8, delay: 1.1 },
  { d: "M1440,140 H1180 V280 H920 V180 H760", color: LANG.python.c2, dur: 6.6, delay: 0.3 },
  { d: "M1440,400 H1260 V500 H980 V400 H760", color: LANG.java.c2, dur: 5.4, delay: 0.9 },
  { d: "M1440,660 H1120 V580 H860 V660 H760", color: LANG.node.c2, dur: 6.1, delay: 1.4 },
  { d: "M760,0 V180", color: CORE, dur: 4.4, delay: 0.2 },
  { d: "M760,900 V680", color: CORE, dur: 4.4, delay: 0.7 },
];

function CircuitBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#05070b]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(34,211,238,0.09), transparent 60%)",
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.55]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1440" height="900" fill="url(#grid)" />
        {CIRCUIT_PATHS.map((p, i) => (
          <g key={i}>
            <path d={p.d} stroke={p.color} strokeWidth="1.5" strokeOpacity="0.18" fill="none" />
            <path
              d={p.d}
              stroke={p.color}
              strokeWidth="2"
              fill="none"
              strokeDasharray="10 22"
              style={{
                animation: `dashflow ${p.dur}s linear infinite`,
                animationDelay: `${p.delay}s`,
                filter: `drop-shadow(0 0 3px ${p.color})`,
              }}
            />
            <circle r="3" fill={p.color}>
              <animateMotion dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite" path={p.d} />
            </circle>
          </g>
        ))}
        <g style={{ animation: "corepulse 3.2s ease-in-out infinite" }}>
          <polygon
            points="760,140 820,175 820,245 760,280 700,245 700,175"
            fill="rgba(34,211,238,0.07)"
            stroke={CORE}
            strokeWidth="1.5"
          />
        </g>
        <text x="760" y="214" textAnchor="middle" fill={CORE} fontSize="9"
          fontFamily="'JetBrains Mono', monospace" opacity="0.85" letterSpacing="1">
          CORE
        </text>
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 45%, transparent 40%, rgba(5,7,11,0.85) 100%)",
        }}
      />
    </div>
  );
}

/* ============================================================
   CONTENT DATA
   ============================================================ */
const RADAR_AXES = ["Speed", "Memory", "Security", "Concurrency", "Ecosystem"];
const RADAR = {
  java: [92, 85, 90, 88, 92],
  python: [88, 82, 80, 85, 94],
  node: [86, 78, 82, 84, 93],
};

const SKILL_BARS = {
  java: [
    { name: "Spring Boot / Core", v: 90 },
    { name: "GraalVM Native Image", v: 85 },
    { name: "JVM Performance Tuning", v: 88 },
    { name: "Multithreading & Concurrency", v: 84 },
  ],
  python: [
    { name: "FastAPI / Django", v: 92 },
    { name: "Code Optimization (CPU/RAM)", v: 88 },
    { name: "Async / Asyncio", v: 86 },
    { name: "Data Processing Pipelines", v: 82 },
  ],
  node: [
    { name: "Node.js / Express / NestJS", v: 87 },
    { name: "TypeScript", v: 85 },
    { name: "API REST / Event-Driven", v: 84 },
  ],
};

const DB_TOOLS = [
  { name: "PostgreSQL", icon: "Database" },
  { name: "MySQL", icon: "Database" },
  { name: "MongoDB", icon: "Database" },
  { name: "Docker", icon: "Layers" },
  { name: "AWS (EC2, S3, RDS)", icon: "Layers" },
  { name: "GraalVM", icon: "Lock" },
];

const PROJECTS = [
  {
    id: "iacc-optimizer",
    title: "Optimizador de Procesos Críticos",
    langs: ["java", "python"],
    summary:
      "Reestructuración y optimización de un proceso pesado para IACC. Se redujo el tiempo de procesamiento de más de 1 hora a solo 5–10 minutos (más del 83% de mejora).",
    stack: ["Java", "Spring Boot", "Python", "Multithreading", "PostgreSQL"],
    diagram: "gateway",
  },
  {
    id: "puma-api",
    title: "API Gateway de Respuestas Ultra-Rápidas",
    langs: ["node", "java"],
    summary:
      "Optimización de tiempos de respuesta en interfaces de PUMA. Se disminuyó la latencia de respuestas lentas de 3–4 segundos a milisegundos usando caché distribuido y optimización de consultas.",
    stack: ["Node.js", "Express", "GraalVM", "MySQL", "Docker"],
    diagram: "auth",
  },
  {
    id: "gyg-performance",
    title: "Sistema de Eficiencia de Datos",
    langs: ["python"],
    summary:
      "Sintonía fina de base de datos y procesamiento asíncrono para GyG. Se logró una mejora de más del 20% en el rendimiento de consultas a bases de datos y reducción de consumo de CPU/RAM.",
    stack: ["Python", "FastAPI", "PostgreSQL", "Optimización de Memoria", "AWS"],
    diagram: "events",
  },
];

const EXPERIENCE = [
  {
    role: "Backend Developer",
    company: "Proyectos y Consultorías Independientes (PUMA, GyG, IACC)",
    period: "2024 — Presente",
    location: "Chile (Remoto / Presencial)",
    bullets: [
      "Diseñé e implementé soluciones de backend de alto rendimiento resolviendo problemas de velocidad crítica y latencia.",
      "Reduje la duración de procesos críticos de procesamiento de datos de más de 1 hora a solo 5-10 minutos (mejora >83%).",
      "Optimicé tiempos de respuesta de endpoints que demoraban de 3 a 4 segundos a milisegundos usando técnicas avanzadas de optimización de código y bases de datos.",
      "Reduje en más de un 20% el tiempo de ejecución de consultas de bases de datos mediante reindexación, análisis de planes de ejecución y optimización de query builders."
    ],
  },
  {
    role: "Backend Engineer",
    company: "Desarrollo y Optimización de Software",
    period: "2022 — 2024",
    location: "Chile",
    bullets: [
      "Desarrollé APIs REST robustas y escalables utilizando Java, Python (FastAPI/Django) y Node.js (Express).",
      "Mejoré la eficiencia del consumo de memoria y CPU en servidores cloud, traduciéndose en una reducción significativa de costos de infraestructura en la nube.",
      "Autometicé y diseñé pipelines para el procesamiento masivo de datos, asegurando una alta disponibilidad y resiliencia ante picos de demanda."
    ]
  }
];

const EDUCATION = [
  {
    title: "Ingeniería en Informática / Computación",
    place: "Institución Académica",
    period: "2019 — 2023",
    detail: "Formación centrada en ingeniería de software, bases de datos y algoritmos eficientes.",
  },
];

const CERTS = [
  { name: "AWS Certified Developer / Cloud Practitioner", org: "Amazon Web Services", year: "2024" },
  { name: "Oracle Certified Professional — Java SE", org: "Oracle", year: "2023" },
  { name: "Especialización en Bases de Datos Relacionales", org: "Udemy / Coursera", year: "2023" },
  { name: "Desarrollo Backend de Alto Rendimiento", org: "Tech Academy", year: "2022" },
];

/* ============================================================
   AUDIENCE MODE — "TI" (technical) vs "RRHH" (recruiters / HR)
   Same facts, two vocabularies. The RRHH copy only re-explains data
   already present above; it never adds achievements of its own.
   ============================================================ */
const HR_ACCENT = LANG.python.c2;

const AUDIENCES = [
  { id: "ti", label: "TI", long: "Perfil TI", hint: "Ver en lenguaje técnico", Icon: Code2, color: CORE },
  { id: "rrhh", label: "RRHH", long: "Perfil RRHH", hint: "Ver en lenguaje para RRHH y reclutadores", Icon: Users, color: HR_ACCENT },
];

const AudienceContext = createContext({ audience: "ti", setAudience: () => {} });
const useAudience = () => useContext(AudienceContext);

const HR_FACTS = [
  { Icon: Briefcase, label: "Experiencia", value: "2 años" },
  { Icon: MapPin, label: "Ubicación", value: "Chile" },
  { Icon: Laptop, label: "Modalidad", value: "Remoto o presencial" },
  { Icon: Sparkles, label: "Estado", value: "Disponible" },
];

const HR_KPIS = [
  { value: "−83%", label: "Tiempo de un proceso crítico", detail: "De más de 1 hora a 5–10 minutos", client: "IACC", color: LANG.java.c1 },
  { value: "< 1 s", label: "Tiempo de respuesta", detail: "Antes tardaba 3–4 segundos", client: "PUMA", color: LANG.node.c2 },
  { value: "+20%", label: "Velocidad en consultas de datos", detail: "Con menor consumo de servidores", client: "GyG", color: LANG.python.c1 },
];

const HR_VALUE = [
  {
    Icon: TrendingDown,
    title: "Menores costos de operación",
    text: "Reduzco el consumo de servidores en la nube. Como ese servicio se paga por uso, el ahorro se refleja directamente en la factura mensual.",
  },
  {
    Icon: Gauge,
    title: "Mejor experiencia para los usuarios",
    text: "Sistemas que responden en milésimas de segundo en lugar de segundos: menos esperas para clientes y colaboradores.",
  },
  {
    Icon: ShieldCheck,
    title: "Operación estable",
    text: "Automatizo procesos que manejan grandes volúmenes de información y que siguen funcionando en momentos de alta demanda.",
  },
];

const HR_ROLES = [
  "Desarrollador/a Backend", "Backend Developer", "Ingeniero/a de Software",
  "Desarrollador/a Java", "Desarrollador/a Python", "Desarrollador/a Node.js",
];

const ATS_KEYWORDS = [
  "Backend", "Java", "Spring Boot", "GraalVM", "Python", "FastAPI", "Django",
  "Node.js", "Express", "NestJS", "TypeScript", "API REST", "SQL", "PostgreSQL",
  "MySQL", "MongoDB", "AWS", "Docker", "Multithreading", "Optimización de rendimiento",
];

/* levels mirror the self-assessed percentages of the TI view (≥88 → Avanzado);
   areas without a percentage show the evidence instead of an invented level */
const HR_COMPETENCIES = [
  {
    area: "Construcción de sistemas empresariales",
    plain: "Desarrollo el “motor” de las aplicaciones: procesa la información, aplica las reglas del negocio y conecta servicios entre sí.",
    level: "Avanzado",
    tech: ["Java", "Spring Boot", "Python", "FastAPI", "Django", "Node.js", "NestJS"],
    color: LANG.java.c1,
  },
  {
    area: "Optimización de rendimiento y costos",
    plain: "Hago que los sistemas respondan más rápido usando menos recursos, lo que baja el gasto en servidores.",
    level: "Avanzado",
    tech: ["GraalVM", "Ajuste de JVM", "Código eficiente (CPU / memoria)"],
    color: CORE,
  },
  {
    area: "Gestión de bases de datos",
    plain: "Organizo y acelero los “archivos digitales” donde la empresa guarda su información: clientes, ventas, registros.",
    level: "Comprobado en proyectos",
    tech: ["SQL", "PostgreSQL", "MySQL", "MongoDB"],
    color: LANG.python.c1,
  },
  {
    area: "Integración entre sistemas",
    plain: "Construyo los “puentes” que permiten que distintas aplicaciones intercambien información de forma ordenada y segura.",
    level: "Sólido",
    tech: ["API REST", "Arquitectura orientada a eventos", "TypeScript"],
    color: LANG.node.c2,
  },
  {
    area: "Automatización de procesos de datos",
    plain: "Automatizo tareas que procesan grandes volúmenes de información sin intervención manual.",
    level: "Sólido",
    tech: ["Python", "Asyncio", "Pipelines de datos"],
    color: HR_ACCENT,
  },
  {
    area: "Nube e infraestructura",
    plain: "Publico y mantengo aplicaciones en servidores de Amazon (AWS) y las empaqueto para que funcionen igual en cualquier entorno.",
    level: "Experiencia práctica",
    tech: ["AWS (EC2, S3, RDS)", "Docker"],
    color: LANG.java.c2,
  },
];

const HR_GLOSSARY = [
  { term: "Backend", def: "La “cocina” de una aplicación: no se ve, pero prepara cada pedido que hace el usuario." },
  { term: "API", def: "El “mesero” entre sistemas: lleva solicitudes y trae respuestas de forma ordenada." },
  { term: "Java · Python · Node.js", def: "Lenguajes de programación de amplio uso en empresas. Dominar los tres permite adaptarse al equipo." },
  { term: "Spring Boot · FastAPI · Django", def: "Frameworks: kits de herramientas que aceleran el desarrollo en cada lenguaje." },
  { term: "Base de datos (SQL)", def: "El archivo digital ordenado donde la empresa guarda y consulta su información." },
  { term: "Nube (AWS)", def: "Servidores arrendados a Amazon que se pagan por consumo; optimizar es ahorrar." },
  { term: "Docker", def: "Empaqueta una aplicación con todo lo que necesita, como un contenedor de transporte." },
  { term: "Latencia", def: "El tiempo de espera entre que el usuario hace clic y recibe una respuesta." },
];

/* plain-language versions of the TI data, keyed by the same ids */
const HR_PROJECTS = {
  "iacc-optimizer": {
    title: "Proceso crítico: de 1 hora a 10 minutos",
    challenge: "Un proceso de datos clave para la operación tardaba más de una hora en completarse.",
    action: "Lo rediseñé para ejecutar varias tareas en paralelo y optimicé el acceso a la información.",
    result: "Hoy termina en 5–10 minutos: más de un 83% menos de tiempo.",
    before: "+1 h", after: "5–10 min",
  },
  "puma-api": {
    title: "Respuestas instantáneas en las plataformas de PUMA",
    challenge: "Algunas pantallas tardaban entre 3 y 4 segundos en responder.",
    action: "Optimicé las consultas de datos y dejé en memoria la información más solicitada.",
    result: "El tiempo de respuesta bajó de segundos a milésimas de segundo.",
    before: "3–4 s", after: "< 1 s",
  },
  "gyg-performance": {
    title: "Bases de datos más rápidas y eficientes en GyG",
    challenge: "Las consultas a la base de datos y el consumo de recursos limitaban el rendimiento.",
    action: "Reorganicé la estructura de búsqueda de los datos y reduje el uso de memoria y procesador.",
    result: "Más de un 20% de mejora en velocidad de consultas, con menor consumo de servidores.",
    before: null, after: "+20%",
  },
};

const HR_EXPERIENCE = [
  {
    plainRole: "Desarrollador de sistemas · Consultor independiente",
    bullets: [
      "Resuelvo problemas de lentitud en sistemas de clientes como PUMA, GyG e IACC.",
      "Reduje un proceso crítico de más de 1 hora a 5–10 minutos (83% menos tiempo).",
      "Logré que pantallas que tardaban 3–4 segundos respondan de forma prácticamente instantánea.",
      "Aceleré en más de un 20% las consultas a bases de datos.",
    ],
  },
  {
    plainRole: "Desarrollador de sistemas",
    bullets: [
      "Construí sistemas que conectan aplicaciones entre sí, usando tres lenguajes de amplio uso empresarial (Java, Python y Node.js).",
      "Reduje el consumo de servidores en la nube, generando ahorros en costos de infraestructura.",
      "Automaticé procesos de grandes volúmenes de datos, manteniendo los sistemas disponibles en momentos de alta demanda.",
    ],
  },
];

const HR_CERT_NOTES = {
  "AWS Certified Developer / Cloud Practitioner": "Valida conocimientos en los servicios de nube de Amazon, uno de los proveedores líderes del mercado.",
  "Oracle Certified Professional — Java SE": "Certificación oficial de Oracle, la empresa responsable del lenguaje Java.",
  "Especialización en Bases de Datos Relacionales": "Formación específica en diseño y manejo de bases de datos.",
  "Desarrollo Backend de Alto Rendimiento": "Formación en construcción de sistemas rápidos y eficientes.",
};

/* ============================================================
   SMALL UI PRIMITIVES
   ============================================================ */
function LangBadge({ id, size = "sm" }) {
  const l = LANG[id];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 ${size === "sm" ? "py-0.5 text-[10px]" : "py-1 text-[11px]"
        } font-medium`}
      style={{
        borderColor: `${l.c1}55`,
        background: `${l.c1}14`,
        color: l.c2,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.c1 }} />
      {l.name}
    </span>
  );
}

function SkillBar({ name, value, color, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 80 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between gap-2 mb-1">
        <span className="text-[12.5px] text-white/80 min-w-0">{name}</span>
        <span
          className="text-[11px] shrink-0"
          style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-[1100ms] ease-out"
          style={{ width: `${w}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
        />
      </div>
    </div>
  );
}

function RadarChart({ values, color, size = 168 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 26;
  const n = RADAR_AXES.length;
  const pt = (i, val) => {
    const angle = -90 + i * (360 / n);
    const rad = (angle * Math.PI) / 180;
    const rr = (val / 100) * r;
    return [cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)];
  };
  const poly = values.map((v, i) => pt(i, v).join(",")).join(" ");
  // horizontal padding in the viewBox keeps side labels ("Ecosystem", "Memory") from clipping
  const padX = 22;
  return (
    <svg
      viewBox={`${-padX} 0 ${size + padX * 2} ${size}`}
      className="mx-auto block w-full h-auto"
      style={{ maxWidth: size + padX * 2 }}
    >
      {[0.33, 0.66, 1].map((f, i) => (
        <polygon
          key={i}
          points={RADAR_AXES.map((_, ai) => pt(ai, 100 * f).join(",")).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}
      {RADAR_AXES.map((label, i) => {
        const [x, y] = pt(i, 100);
        const [lx, ly] = pt(i, 122);
        return (
          <g key={label}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8.5"
              fill="rgba(255,255,255,0.45)"
              fontFamily="'JetBrains Mono', monospace"
            >
              {label}
            </text>
          </g>
        );
      })}
      <polygon points={poly} fill={`${color}2e`} stroke={color} strokeWidth="2" />
      {values.map((v, i) => {
        const [x, y] = pt(i, v);
        return <circle key={i} cx={x} cy={y} r="2.6" fill={color} />;
      })}
    </svg>
  );
}

/* project mini-infographics: abstract architecture diagrams (SVG) */
function ProjectDiagram({ kind }) {
  const box = (x, y, w, h, label, color) => (
    <g key={label}>
      <rect x={x} y={y} width={w} height={h} rx="6" fill={`${color}18`} stroke={color} strokeWidth="1.3" />
      <text x={x + w / 2} y={y + h / 2 + 3.5} textAnchor="middle" fontSize="8.5"
        fill="rgba(255,255,255,0.85)" fontFamily="'JetBrains Mono', monospace">
        {label}
      </text>
    </g>
  );
  const arrow = (x1, y1, x2, y2, color) => (
    <line key={`${x1}${y1}${x2}${y2}`} x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color} strokeWidth="1.3" strokeDasharray="4 4"
      style={{ animation: "dashflow 2.4s linear infinite" }} markerEnd="url(#arrowhead)" />
  );
  const layouts = {
    gateway: (
      <>
        {box(10, 60, 70, 34, "Client", LANG.node.c2)}
        {arrow(80, 77, 130, 77, LANG.node.c1)}
        {box(130, 40, 90, 74, "Gateway", CORE)}
        {arrow(220, 60, 270, 40, LANG.python.c1)}
        {arrow(220, 95, 270, 115, LANG.node.c1)}
        {box(270, 20, 90, 40, "Auth (JWT)", LANG.python.c1)}
        {box(270, 95, 90, 40, "Redis cache", LANG.node.c1)}
      </>
    ),
    events: (
      <>
        {box(10, 20, 80, 34, "Producers", LANG.python.c1)}
        {arrow(90, 37, 150, 37, LANG.java.c1)}
        {box(150, 10, 90, 54, "Kafka", LANG.java.c2)}
        {arrow(240, 37, 290, 37, LANG.java.c1)}
        {box(290, 10, 80, 34, "Consumers", LANG.java.c1)}
        {arrow(190, 64, 190, 100, LANG.java.c1)}
        {box(140, 100, 100, 34, "PostgreSQL", LANG.python.c2)}
      </>
    ),
    dashboard: (
      <>
        {box(10, 50, 90, 44, "WebSocket", LANG.node.c1)}
        {arrow(100, 72, 160, 72, LANG.node.c2)}
        {box(160, 40, 100, 64, "React UI", CORE)}
        {arrow(260, 55, 320, 40, LANG.node.c1)}
        {arrow(260, 90, 320, 105, LANG.node.c2)}
        {box(320, 20, 70, 34, "Metrics", LANG.node.c1)}
        {box(320, 90, 70, 34, "Alerts", LANG.node.c2)}
      </>
    ),
    auth: (
      <>
        {box(10, 50, 80, 40, "App", LANG.java.c2)}
        {arrow(90, 70, 150, 70, LANG.java.c1)}
        {box(150, 35, 100, 70, "OAuth2/OIDC", CORE)}
        {arrow(250, 50, 310, 30, LANG.java.c1)}
        {arrow(250, 90, 310, 110, LANG.java.c2)}
        {box(310, 12, 80, 34, "MFA", LANG.java.c1)}
        {box(310, 96, 80, 34, "Audit log", LANG.java.c2)}
      </>
    ),
  };
  return (
    <svg viewBox="0 0 410 150" className="w-full min-w-[340px] h-auto">
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,0.5)" />
        </marker>
      </defs>
      {layouts[kind]}
    </svg>
  );
}

/* ============================================================
   FLOATING WINDOW — draggable, closable, minimizable, maximizable
   ============================================================ */
function FloatingWindow({
  id, title, IconCmp, accent, pos, scale = 1,
  z, isMinimized, isMaximized, isMobile, boundsRef,
  onClose, onMinimize, onMaximize, onFocus, children,
}) {
  const collapsedHeight = 44;
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // a new layout slot discards any manual drag offset
  useEffect(() => {
    x.set(0);
    y.set(0);
  }, [pos.left, pos.top, x, y]);

  // 12px traffic lights get an invisible 28px hit area for touch
  const dotCls =
    "relative w-3 h-3 rounded-full hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none after:absolute after:-inset-2 after:content-['']";

  return (
    <motion.div
      data-win={id}
      layout="position"
      drag={!isMobile && !isMaximized}
      dragMomentum={false}
      dragConstraints={boundsRef}
      dragElastic={0}
      onPointerDown={onFocus}
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{
        opacity: isMinimized ? 0 : 1,
        scale: isMinimized ? 0.1 : 1,
        y: isMinimized ? 300 : 0,
        height: isMinimized ? collapsedHeight : pos.height ?? "auto",
      }}
      exit={{ opacity: 0, scale: 0.92, y: 10, transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className="pointer-events-auto absolute rounded-xl border shadow-2xl overflow-hidden flex flex-col"
      style={{
        x,
        y,
        left: pos.left,
        top: pos.top,
        width: pos.width,
        maxHeight: pos.maxHeight,
        pointerEvents: isMinimized ? "none" : "auto",
        zIndex: z,
        background: "rgba(13,17,23,0.92)",
        backdropFilter: "blur(14px)",
        borderColor: `${accent}33`,
        boxShadow: `0 20px 60px -15px rgba(0,0,0,0.6), 0 0 0 1px ${accent}14`,
      }}
    >
      {/* title bar */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b select-none shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)", cursor: isMobile || isMaximized ? "default" : "grab", zoom: scale }}
      >
        <div className="flex items-center gap-2.5 sm:gap-1.5 mr-1" onPointerDown={(e) => e.stopPropagation()}>
          <button aria-label={`Cerrar ${title}`} onClick={() => onClose(id)} className={`${dotCls} bg-[#ff5f56]`} />
          <button aria-label={`Minimizar ${title}`} onClick={() => onMinimize(id)} className={`${dotCls} bg-[#ffbd2e]`} />
          <button aria-label={`Maximizar ${title}`} onClick={() => onMaximize(id)} className={`${dotCls} bg-[#27c93f]`} />
        </div>
        <IconCmp size={13} style={{ color: accent }} />
        <span
          className="text-[12.5px] font-medium text-white/85 truncate min-w-0"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {title}
        </span>
        <div className="ml-auto pl-2 shrink-0">
          <AudienceToggle />
        </div>
      </div>
      {!isMinimized && (
        // @container: window contents respond to the window's width, not the viewport's
        <div
          className="@container flex flex-col overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5 flex-1 min-h-0"
          style={{ scrollbarWidth: "thin", zoom: scale }}
        >
          {/* cap line length when a window is maximized on wide screens */}
          <div className="w-full max-w-[1080px] mx-auto flex flex-col flex-1">
            {children}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ============================================================
   DOCK
   ============================================================ */
function Dock({ items, windows, onToggle, scale = 1 }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-0 min-[380px]:gap-0.5 sm:gap-1.5 p-1 min-[360px]:p-1.5 sm:p-2 rounded-2xl border pointer-events-auto max-w-[calc(100vw-12px)]"
      style={{
        zoom: scale,
        background: "rgba(10,14,20,0.85)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 12px 40px -10px rgba(0,0,0,0.6)",
      }}
    >
      {items.map((it) => {
        const w = windows[it.id];
        const active = w?.open && !w?.minimized;
        return (
          <button
            key={it.id}
            onClick={() => onToggle(it.id)}
            aria-label={it.label}
            aria-pressed={active}
            className="group relative flex flex-col items-center justify-center w-8 h-8 min-[360px]:w-9 min-[360px]:h-9 sm:w-11 sm:h-11 shrink-0 rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none hover:-translate-y-1"
            style={{
              background: active ? `${it.accent}22` : "transparent",
            }}
            title={it.label}
          >
            <it.IconCmp
              size={18}
              style={{ color: active ? it.accent : "rgba(255,255,255,0.65)" }}
            />
            <span
              className="absolute -top-1 sm:-top-1.5 w-1 h-1 rounded-full"
              style={{ background: w?.open ? it.accent : "transparent" }}
            />
            <span
              className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
              style={{
                background: "rgba(10,14,20,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.85)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {it.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* ============================================================
   TOP BAR — playful "system stats" that reinforce the
   performance/security theme ambiently, not just decoratively.
   ============================================================ */
function TopBar({ scale = 1 }) {
  const [stats, setStats] = useState({ cpu: 12, mem: 28, lat: 9 });
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const tick = () => {
      if (document.hidden) return;
      setStats({
        cpu: 8 + Math.round(Math.random() * 14),
        mem: 22 + Math.round(Math.random() * 10),
        lat: 6 + Math.round(Math.random() * 8),
      });
      setTime(new Date());
    };
    const iv = setInterval(tick, 2200);
    return () => clearInterval(iv);
  }, []);
  const item = (Icon, label, val, unit, color) => (
    <div className="flex items-center gap-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <Icon size={12} style={{ color }} />
      <span className="text-[10.5px] text-white/50 hidden sm:inline">{label}</span>
      <span className="text-[10.5px]" style={{ color }}>{val}{unit}</span>
    </div>
  );
  return (
    <div
      className="fixed top-0 inset-x-0 z-[90] flex items-center justify-between px-3 sm:px-6 py-2 pointer-events-none"
      style={{ zoom: scale, background: "linear-gradient(to bottom, rgba(5,7,11,0.75), transparent)" }}
    >
      <div className="flex items-center gap-3 pointer-events-auto min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CORE, boxShadow: `0 0 8px ${CORE}` }} />
          <span className="text-[11px] tracking-wide text-white/70 truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            polyglot_core <span className="text-white/30 hidden min-[380px]:inline">v1.0</span>
          </span>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-4 pointer-events-auto">
        {item(Cpu, "CPU", stats.cpu, "%", LANG.python.c2)}
        {item(MemoryStick, "MEM", stats.mem, "%", LANG.node.c2)}
        {item(Gauge, "LAT", stats.lat, "ms", LANG.java.c1)}
        {item(ShieldCheck, "TLS", "OK", "", CORE)}
      </div>
      <div className="flex items-center gap-2.5 sm:gap-3 pointer-events-auto shrink-0">
        <AudienceToggle />
        <div className="flex items-center gap-3 pr-3 border-r border-white/10 max-[399px]:border-r-0 max-[399px]:pr-0">
          <a
            href={SOCIAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            title="Ver GitHub"
            aria-label="Ver GitHub"
            className="p-1.5 -m-1.5 text-white/50 hover:text-white transition-colors"
          >
            <Github size={15} />
          </a>
          <a
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            title="Ver LinkedIn"
            aria-label="Ver LinkedIn"
            className="p-1.5 -m-1.5 text-white/50 hover:text-white transition-colors"
          >
            <Linkedin size={15} />
          </a>
        </div>
        <div className="hidden min-[400px]:block text-[10.5px] text-white/45" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {time.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
/* ============================================================
   WINDOW CONTENTS
   ============================================================ */
function AboutContent() {
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
                  src="/img/max_andres_head.webp"
                  alt="Maximiliano Caniullan"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="text-white/20 font-bold text-lg select-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>MC</span>
              )}
              {/* Scanline overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity duration-300" style={{ animation: "dashflow 8s linear infinite" }} />
            </div>
          </div>
          <span className="text-[10px] text-white/40 mt-1.5 font-mono">max_andres_head.webp</span>
        </div>

        {/* Column 2: Presentation Text */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 mb-3 text-center @md:text-left">
            <div className="w-full">
              <h3 className="text-white text-[15px] font-semibold text-balance" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
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
        <h4 className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
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
        <h4 className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Objetivo Profesional
        </h4>
        <p className="text-[12px] leading-5 text-white/60">
          Estoy interesado en integrarme a equipos tecnológicos y startups que desarrollen productos escalables y de alto impacto como Backend Developer. Busco proyectos donde el rendimiento, la calidad del código y la arquitectura sean prioridades, aportando soluciones que permitan al negocio crecer sin limitaciones técnicas.
        </p>
      </div>
    </div>
  );
}

function SkillsContent() {
  return (
    <div className="w-full">
      <p className="text-[12px] text-white/60 mb-4">
        Métricas relativas de cada runtime en mi stack &mdash; velocidad, memoria, seguridad,
        concurrencia y ecosistema disponible hoy.
      </p>
      <div className="grid grid-cols-1 @lg:grid-cols-3 gap-3 @lg:gap-4 mb-5">
        {Object.entries(LANG).map(([id, l]) => (
          <div key={id} className="rounded-lg border p-3 min-w-0" style={{ borderColor: `${l.c1}2a`, background: "rgba(255,255,255,0.02)" }}>
            <div className="text-center text-[11.5px] font-medium mb-1" style={{ color: l.c2, fontFamily: "'Space Grotesk', sans-serif" }}>
              {l.name}
            </div>
            <RadarChart values={RADAR[id]} color={l.c1} size={150} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 gap-5">
        {Object.entries(SKILL_BARS).map(([id, bars]) => (
          <div key={id} className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-wider mb-2" style={{ color: LANG[id].c2, fontFamily: "'JetBrains Mono', monospace" }}>
              {LANG[id].name}
            </div>
            {bars.map((b, i) => (
              <SkillBar key={b.name} name={b.name} value={b.v} color={LANG[id].c1} delay={i * 90} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-white/[0.08]">
        <div className="text-[10.5px] uppercase tracking-wider mb-2 text-white/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
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

function ProjectsContent({ onOpenProject }) {
  return (
    <div className="w-full">
      <p className="text-[12px] text-white/60 mb-3">
        Selecciona un proyecto para abrir su infografía de arquitectura en una nueva ventana.
      </p>
      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-3">
        {PROJECTS.map((p) => (
          <button
            key={p.id}
            onClick={() => onOpenProject(p.id)}
            className="text-left rounded-lg border border-white/10 p-3 hover:border-white/25 hover:-translate-y-0.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {p.langs.map((l) => <LangBadge key={l} id={l} />)}
            </div>
            <div className="text-[13px] font-medium text-white/90 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {p.title}
            </div>
            <p className="text-[11.5px] text-white/65 leading-5 mb-2">{p.summary}</p>
            <div className="flex items-center gap-1 text-[10.5px]" style={{ color: CORE }}>
              Ver infografía <ChevronRight size={12} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
function ProjectDetailContent({ project }) {
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
          <span key={s} className="rounded-full border border-white/10 px-2 py-0.5 text-[10.5px] text-white/60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function ExperienceContent() {
  return (
    <div className="w-full">
      <div className="relative pl-5 border-l" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
        {EXPERIENCE.map((e, i) => (
          <div key={i} className="mb-5 last:mb-0 relative">
            <span
              className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full border-2"
              style={{ borderColor: CORE, background: "#0d1117" }}
            />
            <div className="text-[13px] font-medium text-white/90" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {e.role}
            </div>
            <div className="text-[11.5px] mb-1" style={{ color: CORE }}>{e.company}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-white/40 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
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
function EducationContent() {
  return (
    <div className="w-full space-y-3">
      {EDUCATION.map((ed, i) => (
        <div key={i} className="rounded-lg border border-white/10 p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="text-[13px] font-medium text-white/90" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {ed.title}
            </div>
            <span className="text-[10.5px] text-white/40 shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{ed.period}</span>
          </div>
          <div className="text-[11.5px] mb-1.5" style={{ color: CORE }}>{ed.place}</div>
          <p className="text-[12px] text-white/55 leading-5">{ed.detail}</p>
        </div>
      ))}
    </div>
  );
}

function CertificationsContent() {
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

function ContactContent() {
  const { audience } = useAudience();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errors, setErrors] = useState({});
  const [imgError, setImgError] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Requerido";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Email inválido";
    if (!form.message.trim()) errs.message = "Requerido";
    setErrors(errs);
    if (Object.keys(errs).length) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("success");
    } catch {
      setErrors({ submit: "No se pudo enviar el mensaje. Intenta de nuevo en unos minutos." });
      setStatus("error");
    }
  };

  // 16px on phones: iOS Safari auto-zooms the page when focusing inputs smaller than that
  const inputCls =
    "w-full rounded-md bg-black/30 border px-3 py-2.5 sm:py-2 text-[16px] sm:text-[12.5px] text-white/90 placeholder:text-white/30 outline-none transition-colors focus:border-[#22D3EE] disabled:opacity-50";

  if (status === "success") {
    return (
      <div className="w-full flex flex-col items-center text-center py-6">
        <CheckCircle2 size={30} style={{ color: LANG.node.c2 }} className="mb-3" />
        <div className="text-[13.5px] font-medium text-white/90 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Mensaje enviado
        </div>
        <p className="text-[12px] text-white/65 mb-4">Responderé dentro de 24&ndash;48 horas hábiles.</p>
        <button
          onClick={() => { setStatus("idle"); setForm({ name: "", email: "", message: "" }); }}
          className="text-[11.5px] px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-4 p-2 rounded-lg border border-white/5 bg-white/[0.01] select-none">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-black/40 shrink-0 border border-cyan-500/20 flex items-center justify-center">
          {!imgError ? (
            <img
              src="/img/max_andres_head.webp"
              alt="Maximiliano"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white/20 font-bold text-[11px] select-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>MC</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-white/90">
            {audience === "rrhh" ? "¿Tienes un proceso de selección abierto?" : "¿Trabajamos juntos?"}
          </div>
          <div className="text-[10px] text-white/50">
            {audience === "rrhh" ? "Coordinemos una entrevista; respondo en 24–48 horas hábiles" : "Hablemos sobre tu próximo sistema backend"}
          </div>
        </div>
      </div>
      <form onSubmit={submit} noValidate>
        <div className="mb-3">
          <label htmlFor="c-name" className="block text-[11px] text-white/50 mb-1">Nombre</label>
          <input
            id="c-name" disabled={status === "loading"}
            className={inputCls} style={{ borderColor: errors.name ? "#f87171" : "rgba(255,255,255,0.1)" }}
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tu nombre"
          />
          {errors.name && <p className="text-[10.5px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.name}</p>}
        </div>
        <div className="mb-3">
          <label htmlFor="c-email" className="block text-[11px] text-white/50 mb-1">Email</label>
          <input
            id="c-email" type="email" disabled={status === "loading"}
            className={inputCls} style={{ borderColor: errors.email ? "#f87171" : "rgba(255,255,255,0.1)" }}
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="tu@correo.com"
          />
          {errors.email && <p className="text-[10.5px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.email}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="c-msg" className="block text-[11px] text-white/50 mb-1">Mensaje</label>
          <textarea
            id="c-msg" rows={3} disabled={status === "loading"}
            className={inputCls + " resize-none"} style={{ borderColor: errors.message ? "#f87171" : "rgba(255,255,255,0.1)" }}
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Cuéntame sobre tu proyecto..."
          />
          {errors.message && <p className="text-[10.5px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.message}</p>}
        </div>
        {status === "error" && errors.submit && (
          <p className="text-[11px] text-red-400 mb-3 flex items-center gap-1"><AlertCircle size={12} />{errors.submit}</p>
        )}
        <button
          type="submit" disabled={status === "loading"}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 sm:py-2 text-[13px] sm:text-[12.5px] font-medium transition-all disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none hover:brightness-110 active:scale-[0.98]"
          style={{ background: `linear-gradient(90deg, ${CORE}, ${LANG.node.c1})`, color: "#05070b" }}
        >
          {status === "loading" ? (<><Loader2 size={14} className="animate-spin" /> Enviando...</>) : (<><Send size={13} /> Enviar mensaje</>)}
        </button>
      </form>
      <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-white/[0.08]">
        <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" title="GitHub" aria-label="GitHub" className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">
          <Github size={18} />
        </a>
        <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" aria-label="LinkedIn" className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">
          <Linkedin size={18} />
        </a>
        <a href={SOCIAL_LINKS.email} title="Email" aria-label="Email" className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">
          <Mail size={18} />
        </a>
      </div>
    </div>
  );
}

function TerminalContent({ onTriggerNotification, onOpenHR }) {
  const { audience } = useAudience();
  const [history, setHistory] = useState([
    { text: "Max OS [Version 1.0.0]", type: "info" },
    { text: "Escribe 'help' para ver los comandos disponibles.", type: "info" },
    { text: "", type: "info" },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  // only grab focus on mouse devices — on touch it would pop the keyboard over the window
  const finePointer = useMemo(() => window.matchMedia("(pointer: fine)").matches, []);

  // scroll only the log itself; scrollIntoView would also scroll every ancestor (incl. the page)
  const scrollToEnd = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(scrollToEnd, [history]);

  const handleCommand = (e) => {
    e.preventDefault();
    const cmdClean = inputVal.trim().toLowerCase();
    const newHistory = [...history, { text: `mc-portfolio$ ${inputVal}`, type: "command" }];

    if (inputVal.trim()) {
      setCmdHistory((prev) => [...prev, inputVal.trim()]);
    }
    setHistoryIndex(-1);

    if (!cmdClean) {
      setHistory(newHistory);
      setInputVal("");
      return;
    }

    let reply = [];
    switch (cmdClean) {
      case "help":
        reply = [
          { text: "Comandos disponibles:", type: "info" },
          { text: "  neofetch    - Muestra info del sistema en estilo ASCII", type: "info" },
          { text: "  about       - Muestra el perfil profesional", type: "info" },
          { text: "  skills      - Muestra el stack tecnológico", type: "info" },
          { text: "  experience  - Muestra la trayectoria laboral", type: "info" },
          { text: "  clear       - Limpia la pantalla", type: "info" },
          { text: "  notify      - Envía una notificación de prueba", type: "info" },
        ];
        break;
      case "notify":
        if (onTriggerNotification) {
          onTriggerNotification();
          reply = [{ text: "Notificación manual enviada.", type: "info" }];
        } else {
          reply = [{ text: "Error: Sistema de notificación no enlazado.", type: "error" }];
        }
        break;
      case "clear":
        setHistory([]);
        setInputVal("");
        return;
      case "neofetch":
        reply = [
          { text: "      ███╗   ███╗ ██████╗", type: "accent" },
          { text: "      ████╗ ████║██╔════╝", type: "accent" },
          { text: "      ██╔████╔██║██║     ", type: "accent" },
          { text: "      ██║╚██╔╝██║██║     ", type: "accent" },
          { text: "      ██║ ╚═╝ ██║╚██████╗", type: "accent" },
          { text: "      ╚═╝     ╚═╝ ╚══════╝", type: "accent" },
          { text: "--------------------------", type: "info" },
          { text: "OS: Maximiliano Portfolio OS v1.0", type: "info" },
          { text: "Host: MacBook Air M5", type: "info" },
          { text: "Kernel: React / FastAPI Hybrid", type: "info" },
          { text: "Uptime: 2 years (Experience)", type: "info" },
          { text: "Shell: zsh (optimización-mode)", type: "info" },
          { text: "CPU: High Performance Backend Dev", type: "info" },
          { text: "Primary Stacks: Java, Python, Node.js", type: "info" },
        ];
        break;
      case "about":
        reply = [
          { text: "PERFIL PROFESIONAL:", type: "accent" },
          { text: "Backend Developer enfocado en crear sistemas rápidos, eficientes y preparados para soportar miles de usuarios en simultáneo.", type: "info" },
          { text: "Especialidad en optimización de CPU y memoria, reducción de costos en la nube y alta escalabilidad.", type: "info" },
        ];
        break;
      case "skills":
        reply = [
          { text: "TECNOLOGÍAS PRINCIPALES:", type: "accent" },
          { text: "  - Java / Spring Boot / GraalVM", type: "info" },
          { text: "  - Python / FastAPI / Django", type: "info" },
          { text: "  - Node.js / Express / NestJS", type: "info" },
          { text: "  - Databases: PostgreSQL, MySQL, MongoDB", type: "info" },
          { text: "  - Cloud & DevOps: AWS, Docker", type: "info" },
        ];
        break;
      case "experience":
        reply = [
          { text: "TRAYECTORIA LABORAL:", type: "accent" },
          { text: "  - Proyectos Independientes (PUMA, GyG, IACC) [2024 - Presente]", type: "info" },
          { text: "    * Optimización crítica de 1 hora a 5-10 min en IACC (83% mejora).", type: "info" },
          { text: "    * Tiempos de respuesta de 4s a milisegundos en PUMA.", type: "info" },
          { text: "    * Más de 20% de mejora en consultas DB en GyG.", type: "info" },
          { text: "  - Backend Engineer (Desarrollo y Optimización) [2022 - 2024]", type: "info" },
        ];
        break;
      default:
        reply = [{ text: `Comando no reconocido: '${cmdClean}'. Escribe 'help' para ver opciones.`, type: "error" }];
    }

    setHistory([...newHistory, ...reply]);
    setInputVal("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(cmdHistory[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex === cmdHistory.length - 1) {
        setHistoryIndex(-1);
        setInputVal("");
      } else {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    }
  };

  return (
    <>
    {audience === "rrhh" && (
      <div className="mb-3 shrink-0 rounded-lg border px-3 py-2.5 flex flex-wrap items-center justify-between gap-2" style={{ borderColor: `${HR_ACCENT}33`, background: `${HR_ACCENT}0b` }}>
        <p className="text-[11.5px] text-white/70 leading-5 min-w-0 flex-1 basis-[220px]">
          Consola interactiva pensada para perfiles técnicos. Para un resumen en lenguaje simple:
        </p>
        <button
          onClick={onOpenHR}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
          style={{ background: HR_ACCENT, color: "#05070b" }}
        >
          <Users size={12} /> Abrir ficha RRHH
        </button>
      </div>
    )}
    <div
      className="w-full flex-1 min-h-[240px] flex flex-col font-mono text-[11px] sm:text-[12px] bg-black/90 p-2.5 rounded-md overflow-hidden border"
      style={{ color: LANG.node.c2, borderColor: `${LANG.node.c1}33` }}
      onClick={() => {
        scrollToEnd();
        inputRef.current?.focus();
      }}
    >
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto pr-1 select-text space-y-1" style={{ scrollbarWidth: "thin" }}>
        {history.map((line, idx) => (
          <div
            key={idx}
            className={`whitespace-pre-wrap break-words ${line.type === "command"
                ? "text-white"
                : line.type === "accent"
                  ? "text-cyan-400 font-bold"
                  : line.type === "error"
                    ? "text-red-400"
                    : ""
              }`}
            style={line.type === "info" ? { color: `${LANG.node.c2}e6` } : undefined}
          >
            {line.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleCommand} className="flex items-center mt-2 border-t pt-1.5 shrink-0" style={{ borderColor: `${LANG.node.c1}33` }}>
        <span className="text-white mr-1.5 shrink-0">mc-portfolio$</span>
        <input
          ref={inputRef}
          type="text"
          aria-label="Comando de terminal"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="send"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 py-1 bg-transparent border-none outline-none text-white font-mono text-[16px] sm:text-[12px]"
          autoFocus={finePointer}
        />
      </form>
    </div>
    </>
  );
}

/* ============================================================
   AUDIENCE UI — toggle + RRHH (plain-language) window contents
   ============================================================ */
function AudienceToggle({ variant = "compact" }) {
  const { audience, setAudience } = useAudience();
  const uid = useId();
  const long = variant === "long";
  return (
    <div
      role="radiogroup"
      aria-label="Lenguaje del contenido"
      className="inline-flex items-center shrink-0 rounded-full border border-white/10 bg-black/40 p-0.5"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {AUDIENCES.map((a) => {
        const active = audience === a.id;
        return (
          <button
            key={a.id}
            role="radio"
            aria-checked={active}
            title={a.hint}
            onClick={() => setAudience(a.id)}
            className={`relative inline-flex items-center rounded-full font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none ${long ? "gap-1.5 px-3.5 py-1.5 text-[12px]" : "gap-1 px-2.5 py-[7px] text-[10px] leading-none"
              }`}
            style={{ color: active ? "#05070b" : "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            {active && (
              <motion.span
                layoutId={`audience-pill-${uid}`}
                className="absolute inset-0 rounded-full"
                style={{ background: a.color }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {long && <a.Icon size={13} />}
              {long ? a.long : a.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* cross-fades a window's content when the audience changes */
function AudienceSwap({ children }) {
  return (
    <motion.div className="w-full" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  );
}

function SectionTitle({ children, color = HR_ACCENT, className = "" }) {
  return (
    <h4
      className={`text-[10.5px] uppercase tracking-wider font-semibold mb-3 ${className}`}
      style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
    >
      {children}
    </h4>
  );
}

function Chip({ children, color }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] text-white/75"
      style={{ borderColor: color ? `${color}40` : "rgba(255,255,255,0.1)", background: color ? `${color}0d` : "transparent" }}
    >
      {children}
    </span>
  );
}

function KpiGrid() {
  return (
    <div className="grid grid-cols-1 @md:grid-cols-3 gap-3">
      {HR_KPIS.map((k) => (
        <div key={k.client} className="rounded-lg border p-3.5 flex @md:flex-col items-center @md:items-start gap-3 @md:gap-1" style={{ borderColor: `${k.color}33`, background: `${k.color}0b` }}>
          <div className="text-[26px] leading-none font-semibold shrink-0 min-w-[78px] @md:min-w-0" style={{ color: k.color, fontFamily: "'Space Grotesk', sans-serif" }}>
            {k.value}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-white/90 leading-4 @md:mt-1.5">{k.label}</div>
            <div className="text-[11px] text-white/55 mt-1 leading-4">{k.detail}</div>
            <div className="text-[10px] text-white/40 mt-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{k.client}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HRSummaryContent({ onOpen }) {
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

function AboutHRContent() {
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

function SkillsHRContent() {
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

function BeforeAfter({ hr, color = HR_ACCENT, size = "text-[13px]" }) {
  return (
    <div className={`flex items-center gap-2 ${size} font-semibold`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {hr.before && (
        <>
          <span className="text-white/40 line-through decoration-white/25">{hr.before}</span>
          <ArrowRight size={13} className="text-white/35 shrink-0" />
        </>
      )}
      <span style={{ color }}>{hr.after}</span>
    </div>
  );
}

function ProjectsHRContent({ onOpenProject }) {
  return (
    <div className="w-full">
      <p className="text-[12.5px] text-white/60 mb-3">Resultados concretos en empresas reales. Selecciona uno para ver el detalle.</p>
      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-3">
        {PROJECTS.map((p) => {
          const hr = HR_PROJECTS[p.id];
          return (
            <button
              key={p.id}
              onClick={() => onOpenProject(p.id)}
              className="text-left rounded-lg border border-white/10 p-3.5 hover:border-white/25 hover:-translate-y-0.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none flex flex-col"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <BeforeAfter hr={hr} />
              <div className="text-[13px] font-medium text-white/90 mt-2 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{hr.title}</div>
              <p className="text-[11.5px] text-white/60 leading-5 mb-2">{hr.result}</p>
              <div className="mt-auto flex items-center gap-1 text-[10.5px]" style={{ color: HR_ACCENT }}>
                Ver el caso <ChevronRight size={12} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProjectDetailHRContent({ project }) {
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
    </div>
  );
}

function ExperienceHRContent() {
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

function CertificationsHRContent() {
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

/* ============================================================
   MAIN APP
   ============================================================ */
/* `hrLabel`: window/dock name shown in RRHH mode (falls back to `label`) */
const DOCK_ITEMS = [
  { id: "about", label: "Sobre mí", IconCmp: User, accent: CORE, width: 520 },
  { id: "hr", label: "Para RRHH", IconCmp: Users, accent: HR_ACCENT, width: 680 },
  { id: "skills", label: "Skills", hrLabel: "Competencias", IconCmp: Code2, accent: LANG.python.c1, width: 720 },
  { id: "projects", label: "Proyectos", hrLabel: "Logros", IconCmp: FolderGit2, accent: LANG.node.c1, width: 680 },
  { id: "experience", label: "Experiencia", hrLabel: "Trayectoria", IconCmp: Briefcase, accent: LANG.java.c1, width: 580 },
  { id: "education", label: "Educación", IconCmp: GraduationCap, accent: LANG.python.c2, width: 520 },
  { id: "certifications", label: "Certificaciones", IconCmp: Award, accent: LANG.java.c2, width: 520 },
  { id: "contact", label: "Contacto", IconCmp: Mail, accent: LANG.node.c2, width: 480 },
  { id: "terminal", label: "Terminal.exe", IconCmp: Terminal, accent: LANG.node.c1, width: 580 },
];
const PROJECT_WIN_WIDTH = 520;

/* ============================================================
   LAYOUT ENGINE
   Every window position is computed in px from the real viewport,
   inside a "desk" area that excludes the top bar and the dock, so
   no window can ever sit off-screen or underneath the dock.
   ============================================================ */
const TILE_GAP = 12;
const MIN_TILE_W = 340;
const MIN_TILE_H = 230;

/* UI scale for large, high-res screens (1920+): the whole interface was
   designed around ~1440×860 and looked tiny on FHD/QHD notebooks */
function uiScaleFor({ width, height }) {
  const s = Math.min(width / 1440, height / 860);
  return Math.round(Math.min(2, Math.max(1, s)) * 20) / 20;
}

/* phones (portrait) and short landscape screens get a single full-width window */
function isCompactViewport({ width, height }) {
  return width < 640 || height < 500;
}

function deskArea({ width, height }, compact, scale) {
  const top = compact ? 40 : Math.round(48 * scale);
  // dock size follows the `sm` breakpoint (viewport width), not the compact flag:
  // 36px buttons + padding below 640px, 44px buttons + padding above; plus its bottom offset and a gap.
  // CSS `zoom` on the dock scales both its height and its `bottom` offset.
  const wide = width >= 640;
  const dockSpace = ((wide ? 62 : 50) + (wide ? 16 : 8)) * scale;
  const bottom = Math.round(dockSpace + (compact ? 8 : TILE_GAP));
  const padX = compact ? 8 : 16;
  return {
    x: padX,
    y: top,
    w: Math.max(0, width - padX * 2),
    h: Math.max(160, height - top - bottom),
  };
}

function tileWindows(items, area, compact, scale) {
  const pos = {};
  const N = items.length;
  if (!N) return pos;

  // phones: every window is a full "screen", so stacked windows fully cover each other
  if (compact) {
    items.forEach((it) => {
      pos[it.id] = maximizedPos(area);
    });
    return pos;
  }

  const minW = MIN_TILE_W * scale;
  const minH = MIN_TILE_H * scale;
  const maxCols = Math.max(1, Math.floor((area.w + TILE_GAP) / (minW + TILE_GAP)));
  const maxRows = Math.max(1, Math.floor((area.h + TILE_GAP) / (minH + TILE_GAP)));

  // not enough room to tile legibly → cascade instead of shrinking windows to slivers
  if (N > maxCols * maxRows) {
    const step = 28;
    items.forEach((it, i) => {
      const w = Math.min(area.w, it.width * scale);
      const top = area.y + Math.min(i * step, area.h * 0.3);
      pos[it.id] = {
        left: area.x + Math.min(i * step, area.w - w),
        top,
        width: w,
        maxHeight: area.y + area.h - top,
      };
    });
    return pos;
  }

  const rows = Math.ceil(N / maxCols);
  const cols = Math.ceil(N / rows);
  const cellW = (area.w - TILE_GAP * (cols - 1)) / cols;
  const cellH = (area.h - TILE_GAP * (rows - 1)) / rows;

  for (let r = 0; r < rows; r++) {
    const rowItems = items.slice(r * cols, (r + 1) * cols);
    const widths = rowItems.map((it) => Math.min(cellW, it.width * scale));
    const rowW = widths.reduce((a, b) => a + b, 0) + TILE_GAP * (rowItems.length - 1);
    let left = area.x + (area.w - rowW) / 2;
    // a single row sits optically centered instead of glued to the top bar
    const top = rows === 1
      ? area.y + Math.max(0, (area.h - 620 * scale) / 2)
      : area.y + r * (cellH + TILE_GAP);
    const maxHeight = rows === 1 ? area.y + area.h - top : cellH;
    rowItems.forEach((it, i) => {
      pos[it.id] = { left, top, width: widths[i], maxHeight };
      left += widths[i] + TILE_GAP;
    });
  }
  return pos;
}

function maximizedPos(area) {
  return { left: area.x, top: area.y, width: area.w, height: area.h, maxHeight: area.h };
}

function centeredPos(area, width, compact, scale) {
  if (compact) return maximizedPos(area);
  const w = Math.min(area.w, width * scale);
  const top = area.y + Math.max(0, (area.h - 560 * scale) / 2);
  return { left: area.x + (area.w - w) / 2, top, width: w, maxHeight: area.y + area.h - top };
}

function makeInitialWindows() {
  const w = {};
  DOCK_ITEMS.forEach((it) => {
    w[it.id] = { open: false, minimized: false, maximized: false, z: 1 };
  });
  return w;
}

export default function PolyglotPortfolio() {
  const [booted, setBooted] = useState(false);
  const [windows, setWindows] = useState(makeInitialWindows());
  const [projectWin, setProjectWin] = useState({ open: false, id: null, z: 1, minimized: false, maximized: false });
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });
  const isMobile = isCompactViewport(windowSize);
  const uiScale = isMobile ? 1 : uiScaleFor(windowSize);
  const area = useMemo(() => deskArea(windowSize, isMobile, uiScale), [windowSize, isMobile, uiScale]);
  const zRef = useRef(10);
  const boundsRef = useRef(null);

  const [activeToast, setActiveToast] = useState(null);

  // audience: ?vista=rrhh (shareable link for recruiters) > last choice > technical view
  const [audience, setAudienceState] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("vista");
    if (fromUrl === "rrhh" || fromUrl === "ti") return fromUrl;
    return storage.get("audience") === "rrhh" ? "rrhh" : "ti";
  });
  const setAudience = useCallback((next) => {
    setAudienceState(next);
    storage.set("audience", next);
    const url = new URL(window.location.href);
    if (next === "rrhh") url.searchParams.set("vista", "rrhh");
    else url.searchParams.delete("vista");
    window.history.replaceState(null, "", url);
  }, []);
  const audienceCtx = useMemo(() => ({ audience, setAudience }), [audience, setAudience]);

  useEffect(() => {
    if (!booted) return;

    let msgIndex = 0;
    const firstTimeout = setTimeout(() => {
      setActiveToast(NOTIFICATION_MESSAGES[0]);
      msgIndex = 1;
    }, 3000);

    const interval = setInterval(() => {
      setActiveToast(NOTIFICATION_MESSAGES[msgIndex]);
      msgIndex = (msgIndex + 1) % NOTIFICATION_MESSAGES.length;
    }, 300000); // 5 minutes

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, [booted]);

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 12000); // 12 seconds auto-dismiss
    return () => clearTimeout(timer);
  }, [activeToast]);

  const triggerNotification = useCallback(() => {
    const randomMsg = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
    setActiveToast(randomMsg);
  }, []);

  useEffect(() => {
    let frame = 0;
    const handleResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    // mobile browsers resize the visual viewport when the URL bar collapses
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  const windowPositions = useMemo(() => {
    const active = DOCK_ITEMS.filter((it) => {
      const w = windows[it.id];
      return w && w.open && !w.minimized && !w.maximized;
    });
    return tileWindows(active, area, isMobile, uiScale);
  }, [windows, area, isMobile, uiScale]);

  const bringFront = useCallback((key) => {
    zRef.current += 1;
    if (key === "project") {
      setProjectWin((p) => ({ ...p, z: zRef.current }));
    } else {
      setWindows((w) => ({ ...w, [key]: { ...w[key], z: zRef.current } }));
    }
  }, []);

  const toggleWindow = useCallback((id) => {
    setWindows((w) => {
      const cur = w[id];
      if (!cur.open) {
        zRef.current += 1;
        return { ...w, [id]: { open: true, minimized: false, maximized: false, z: zRef.current } };
      }
      if (cur.minimized) {
        zRef.current += 1;
        return { ...w, [id]: { ...cur, minimized: false, z: zRef.current } };
      }
      
      const activeWindows = Object.entries(w).filter(([_, win]) => win.open && !win.minimized);
      const isFrontmost = activeWindows.length === 0 || cur.z === Math.max(...activeWindows.map(([_, win]) => win.z));

      if (isFrontmost) {
        return { ...w, [id]: { ...cur, minimized: true } };
      } else {
        zRef.current += 1;
        return { ...w, [id]: { ...cur, minimized: false, z: zRef.current } };
      }
    });
  }, []);

  // open (or restore and raise) without the dock's toggle-to-minimize behaviour
  const openWindow = useCallback((id) => {
    zRef.current += 1;
    setWindows((w) => ({ ...w, [id]: { ...w[id], open: true, minimized: false, z: zRef.current } }));
  }, []);

  const closeWindow = useCallback((id) => {
    setWindows((w) => ({ ...w, [id]: { ...w[id], open: false, minimized: false, maximized: false } }));
  }, []);
  const minimizeWindow = useCallback((id) => {
    setWindows((w) => ({ ...w, [id]: { ...w[id], minimized: !w[id].minimized } }));
  }, []);
  const maximizeWindow = useCallback((id) => {
    setWindows((w) => ({ ...w, [id]: { ...w[id], maximized: !w[id].maximized } }));
    bringFront(id);
  }, [bringFront]);

  const openProject = useCallback((id) => {
    zRef.current += 1;
    setProjectWin({ open: true, id, z: zRef.current, minimized: false, maximized: false });
  }, []);

  const hr = audience === "rrhh";
  // windows with two vocabularies cross-fade between them; contact/terminal keep their state (form input, history)
  const swap = (ti, rrhh) => <AudienceSwap key={audience}>{hr ? rrhh : ti}</AudienceSwap>;
  const contentFor = (id) => {
    switch (id) {
      case "about": return swap(<AboutContent />, <AboutHRContent />);
      case "hr": return <HRSummaryContent onOpen={openWindow} />;
      case "skills": return swap(<SkillsContent />, <SkillsHRContent />);
      case "projects": return swap(<ProjectsContent onOpenProject={openProject} />, <ProjectsHRContent onOpenProject={openProject} />);
      case "experience": return swap(<ExperienceContent />, <ExperienceHRContent />);
      case "education": return <EducationContent />;
      case "certifications": return swap(<CertificationsContent />, <CertificationsHRContent />);
      case "contact": return <ContactContent />;
      case "terminal": return <TerminalContent onTriggerNotification={triggerNotification} onOpenHR={() => openWindow("hr")} />;
      default: return null;
    }
  };
  const dockItems = useMemo(
    () => DOCK_ITEMS.map((it) => ({ ...it, label: hr ? it.hrLabel || it.label : it.label })),
    [hr]
  );

  const activeProject = PROJECTS.find((p) => p.id === projectWin.id);

  const heroBtn =
    "flex items-center justify-center gap-2 rounded-lg px-4 sm:px-5 py-2.5 2xl:py-3 text-[13.5px] 2xl:text-[15px] font-medium active:scale-[0.98] transition-all focus:outline-none whitespace-nowrap";

  return (
    <AudienceContext.Provider value={audienceCtx}>
    <div className="relative w-full h-dvh overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes dashflow { to { stroke-dashoffset: -160; } }
        @keyframes corepulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
        }
      `}</style>

      <AnimatePresence>{!booted && <BootScreen onDone={() => setBooted(true)} />}</AnimatePresence>

      <CircuitBackground />
      <TopBar scale={uiScale} />

      {/* bounds container for draggable windows */}
      <div ref={boundsRef} className="absolute inset-0 z-10 pointer-events-none">

        {/* hero — scrolls on its own when the screen is too short (landscape phones),
            and reserves room for the top bar and the dock so nothing overlaps */}
        <AnimatePresence>
          {booted && !Object.values(windows).some((w) => w.open && !w.minimized) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 overflow-y-auto overscroll-contain pointer-events-auto"
              style={{ scrollbarWidth: "none" }}
            >
              <div
                className="min-h-full flex flex-col items-center justify-center px-5 sm:px-8 text-center"
                style={{ paddingTop: area.y + 8, paddingBottom: windowSize.height - area.y - area.h + 8 }}
              >
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] 2xl:text-[12px] mb-4 2xl:mb-6 short:mb-2"
                  style={{ borderColor: `${CORE}44`, color: CORE, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <Sparkles size={11} /> Disponible para nuevos proyectos
                </span>
                <h1
                  className="text-[28px] min-[380px]:text-[32px] sm:text-[44px] lg:text-[52px] 2xl:text-[64px] short:text-[26px] font-semibold text-white mb-3 2xl:mb-5 short:mb-2 leading-[1.1] max-w-4xl text-balance"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Maximiliano Andrés Caniullan Lefiñir
                </h1>
                <p className="text-[14px] sm:text-[16px] 2xl:text-[19px] leading-relaxed text-white/55 max-w-md sm:max-w-xl 2xl:max-w-2xl mb-6 2xl:mb-8 short:mb-4 short:text-[13.5px] text-pretty">
                  {hr ? (
                    <>Construyo la parte invisible de las aplicaciones —la que procesa cada solicitud de los usuarios— y me especializo en que <span className="text-white/85">funcione más rápido y cueste menos operar</span>. Resultados medidos en empresas como IACC, PUMA y GyG.</>
                  ) : (
                    <>Backend Developer enfocado en crear sistemas rápidos y eficientes usando <span style={{ color: LANG.java.c1 }}>Java / Spring Boot</span>, <span style={{ color: LANG.python.c2 }}>Python</span> y <span style={{ color: LANG.node.c2 }}>Node.js</span>. Especialista en optimización de rendimiento y reducción de costos en la nube.</>
                  )}
                </p>
                <div className="flex flex-col items-center gap-2 mb-6 short:mb-4">
                  <span className="text-[10.5px] uppercase tracking-wider text-white/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Ver el portafolio como
                  </span>
                  <AudienceToggle variant="long" />
                </div>
                {/* 2×2 grid of equal buttons on phones, a single row from sm up */}
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-[340px] sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 sm:w-auto sm:max-w-none">
                  {hr ? (
                    <button
                      onClick={() => openWindow("hr")}
                      className={`${heroBtn} hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60`}
                      style={{ background: `linear-gradient(90deg, ${HR_ACCENT}, ${LANG.java.c1})`, color: "#05070b" }}
                    >
                      <Users size={14} /> Ficha para RRHH
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleWindow("projects")}
                      className={`${heroBtn} hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60`}
                      style={{ background: `linear-gradient(90deg, ${CORE}, ${LANG.node.c1})`, color: "#05070b" }}
                    >
                      <FolderGit2 size={14} /> Ver proyectos
                    </button>
                  )}
                  <button
                    onClick={() => toggleWindow("about")}
                    className={`${heroBtn} border border-white/15 text-white/80 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50`}
                  >
                    <User size={14} /> Sobre mí
                  </button>
                  <a
                    href={SOCIAL_LINKS.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${heroBtn} text-white hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60`}
                    style={{ background: "#0077b5" }}
                  >
                    <Linkedin size={15} /> LinkedIn
                  </a>
                  <a
                    href={SOCIAL_LINKS.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${heroBtn} border border-white/20 bg-black/40 text-white hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white/50`}
                  >
                    <Github size={15} /> GitHub
                  </a>
                </div>
                <p className="mt-6 sm:mt-8 short:mt-4 text-[10.5px] 2xl:text-[12px] text-white/50 max-w-[300px] sm:max-w-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  abre las ventanas del dock inferior para explorar el resto del portafolio
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* portfolio windows */}
        <AnimatePresence>
          {booted && dockItems.map((it) => {
            const w = windows[it.id];
            if (!w.open) return null;

            const pos = w.maximized
              ? maximizedPos(area)
              : windowPositions[it.id] || centeredPos(area, it.width, isMobile, uiScale);

            return (
              <FloatingWindow
                key={it.id}
                id={it.id}
                title={it.label}
                IconCmp={it.IconCmp}
                accent={it.accent}
                pos={pos}
                scale={uiScale}
                z={w.z}
                isMinimized={w.minimized}
                isMaximized={w.maximized}
                isMobile={isMobile}
                boundsRef={boundsRef}
                onClose={closeWindow}
                onMinimize={minimizeWindow}
                onMaximize={maximizeWindow}
                onFocus={() => bringFront(it.id)}
              >
                {contentFor(it.id)}
              </FloatingWindow>
            );
          })}
        </AnimatePresence>

        {/* project detail floating window */}
        <AnimatePresence>
          {booted && projectWin.open && activeProject && (
            <FloatingWindow
              key={`project-detail-${projectWin.id}`}
              id="project-detail"
              title={hr ? HR_PROJECTS[activeProject.id].title : activeProject.title}
              IconCmp={FolderGit2}
              accent={CORE}
              pos={projectWin.maximized ? maximizedPos(area) : centeredPos(area, PROJECT_WIN_WIDTH, isMobile, uiScale)}
              scale={uiScale}
              z={projectWin.z}
              isMinimized={projectWin.minimized}
              isMaximized={projectWin.maximized}
              isMobile={isMobile}
              boundsRef={boundsRef}
              onClose={() => setProjectWin((p) => ({ ...p, open: false }))}
              onMinimize={() => setProjectWin((p) => ({ ...p, minimized: !p.minimized }))}
              onMaximize={() => setProjectWin((p) => ({ ...p, maximized: !p.maximized }))}
              onFocus={() => bringFront("project")}
            >
              {swap(<ProjectDetailContent project={activeProject} />, <ProjectDetailHRContent project={activeProject} />)}
            </FloatingWindow>
          )}
        </AnimatePresence>
      </div>

      {booted && <Dock items={dockItems} windows={windows} onToggle={toggleWindow} scale={uiScale} />}

      {/* Toast Notification — on phones it sits just above the dock (58px tall + 8px gap) so it never
          covers a window's title bar and its close/minimize controls; top-right card on larger screens */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-[66px] sm:bottom-auto sm:top-14 inset-x-2 sm:inset-x-auto sm:right-4 z-[999] sm:w-[400px] short:w-[330px] rounded-xl border p-3 sm:p-4 short:p-3 pointer-events-auto flex items-start gap-3 sm:gap-4 shadow-2xl select-none"
            style={{
              zoom: uiScale,
              background: "rgba(10,14,20,0.94)",
              backdropFilter: "blur(12px)",
              borderColor: `${CORE}33`,
              boxShadow: `0 10px 30px -10px rgba(0,0,0,0.5), 0 0 0 1px ${CORE}11`,
            }}
          >
            {/* Text area */}
            <div className="flex-1 min-w-0 pr-5 flex flex-col justify-center">
              <div className="text-[12.5px] font-semibold text-white/90 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {activeToast.title}
              </div>
              <p className="text-[11.5px] text-white/70 leading-5">
                {activeToast.text}
              </p>
            </div>

            {/* Image (right side, larger, no contour) */}
            <img
              src="/img/logo_max_andres.webp"
              alt=""
              onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
              className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 object-contain select-none self-center"
            />

            {/* Close button (absolute top-right) */}
            <button
              onClick={() => setActiveToast(null)}
              className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white transition-colors text-[18px] leading-none focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
              aria-label="Cerrar notificación"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </AudienceContext.Provider>
  );
}
