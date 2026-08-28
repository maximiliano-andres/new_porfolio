import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Code2, FolderGit2, Briefcase, GraduationCap, Award, Mail,
  Github, Linkedin, Send,
  Cpu, MemoryStick, ShieldCheck, Gauge, ChevronRight,
  MapPin, Calendar, CheckCircle2, AlertCircle, Loader2, Sparkles,
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

/* ---------- boot sequence: the hero, staged as a compile log ---------- */
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
    window.localStorage.setItem("boot_seen", "1");
    setTimeout(onDone, 250);
  }, [onDone]);

  useEffect(() => {
    if (window.localStorage.getItem("boot_seen")) {
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
        className="w-full max-w-xl rounded-lg border px-5 py-5 sm:px-6 sm:py-6"
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
        <div className="text-[12px] sm:text-[13px] leading-6 min-h-[210px]">
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
  python: [82, 70, 78, 68, 96],
  java: [88, 80, 90, 94, 92],
  node: [85, 75, 80, 88, 94],
};

const SKILL_BARS = {
  python: [
    { name: "FastAPI / Django", v: 92 },
    { name: "asyncio & concurrency", v: 85 },
    { name: "Data pipelines (Polars/Pandas)", v: 80 },
    { name: "Rust-accelerated extensions (PyO3)", v: 70 },
  ],
  java: [
    { name: "Spring Boot 3 / Loom", v: 90 },
    { name: "JVM performance tuning", v: 82 },
    { name: "GraalVM native image", v: 74 },
    { name: "Bouncy Castle / crypto", v: 76 },
  ],
  node: [
    { name: "Node.js / NestJS", v: 88 },
    { name: "TypeScript strict mode", v: 91 },
    { name: "pnpm monorepos", v: 84 },
    { name: "SWC / Rspack tooling", v: 78 },
  ],
};

const DB_TOOLS = [
  { name: "PostgreSQL", icon: "Database" },
  { name: "Redis", icon: "Layers" },
  { name: "MongoDB", icon: "Database" },
  { name: "Kafka", icon: "Network" },
  { name: "Docker / K8s", icon: "Layers" },
  { name: "TLS / OAuth2", icon: "Lock" },
];

const PROJECTS = [
  {
    id: "gateway",
    title: "API Gateway de baja latencia",
    langs: ["node", "python"],
    summary:
      "Gateway asincrónico con rate-limiting, auth JWT y cacheo en Redis. p99 de 12ms bajo 8k req/s.",
    stack: ["Node.js", "NestJS", "Redis", "Docker"],
    diagram: "gateway",
  },
  {
    id: "events",
    title: "Pipeline de eventos en tiempo real",
    langs: ["java", "python"],
    summary:
      "Procesamiento de streams con Kafka + Spring Boot (virtual threads) y consumidores Python para ML.",
    stack: ["Java 21", "Kafka", "Spring Boot", "PostgreSQL"],
    diagram: "events",
  },
  {
    id: "dashboard",
    title: "Dashboard operativo en vivo",
    langs: ["node"],
    summary:
      "Panel React con websockets, métricas de infraestructura y alertas configurables por equipo.",
    stack: ["React", "WebSocket", "Node.js", "Grafana"],
    diagram: "dashboard",
  },
  {
    id: "auth",
    title: "Servicio de autenticación empresarial",
    langs: ["java"],
    summary:
      "OAuth2 / OIDC propio con rotación de claves, MFA y auditoría, certificado en pruebas de penetración.",
    stack: ["Java 21", "Spring Security", "Bouncy Castle", "PostgreSQL"],
    diagram: "auth",
  },
];

const EXPERIENCE = [
  {
    role: "Senior Backend Engineer",
    company: "NimbusScale",
    period: "2023 \u2014 Presente",
    location: "Remoto",
    bullets: [
      "Lideré la migración de servicios Python monolíticos a una arquitectura de microservicios Java/Node.",
      "Reduje el consumo de memoria en un 34% adoptando virtual threads y extensiones nativas.",
      "Diseñé el pipeline de eventos que hoy procesa 40M de mensajes/día con Kafka.",
    ],
  },
  {
    role: "Backend Engineer",
    company: "Vertex Systems",
    period: "2021 \u2014 2023",
    location: "Santiago, Chile",
    bullets: [
      "Construí APIs REST/GraphQL en Node.js para el core de pagos, con 99.98% de uptime.",
      "Implementé cifrado en reposo y en tránsito, cerrando el gap de cumplimiento PCI-DSS.",
    ],
  },
  {
    role: "Software Developer",
    company: "DataForge Labs",
    period: "2019 \u2014 2021",
    location: "Santiago, Chile",
    bullets: [
      "Desarrollé pipelines de datos en Python para modelos de scoring crediticio.",
      "Automaticé despliegues con Docker y CI/CD, bajando el tiempo de release de 2h a 12min.",
    ],
  },
];

const EDUCATION = [
  {
    title: "Ingeniería Civil en Computación",
    place: "Universidad de Chile",
    period: "2014 \u2014 2019",
    detail: "Especialización en sistemas distribuidos y estructuras de datos de alto rendimiento.",
  },
  {
    title: "Diplomado en Arquitectura de Software",
    place: "Pontificia Universidad Católica",
    period: "2020",
    detail: "Patrones de microservicios, resiliencia y observabilidad.",
  },
];

const CERTS = [
  { name: "AWS Certified Solutions Architect", org: "Amazon Web Services", year: "2024" },
  { name: "Oracle Certified Professional \u2014 Java SE 21", org: "Oracle", year: "2024" },
  { name: "Certified Kubernetes Administrator", org: "CNCF", year: "2023" },
  { name: "Professional Scrum Master I", org: "Scrum.org", year: "2022" },
];

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
      <div className="flex justify-between mb-1">
        <span className="text-[12.5px] text-white/80">{name}</span>
        <span
          className="text-[11px]"
          style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
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
  return (
    <svg width={size} height={size} className="mx-auto">
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
    <svg viewBox="0 0 410 150" className="w-full h-auto">
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
  id, title, IconCmp, accent, defaultPos, width = 420,
  z, isMinimized, isMaximized, isMobile, boundsRef,
  onClose, onMinimize, onMaximize, onFocus, children,
}) {
  const collapsedHeight = 44;
  return (
    <motion.div
      drag={!isMobile && !isMaximized}
      dragMomentum={false}
      dragConstraints={boundsRef}
      dragElastic={0}
      onPointerDown={onFocus}
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        height: isMinimized ? collapsedHeight : "auto",
      }}
      exit={{ opacity: 0, scale: 0.92, y: 10, transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className="pointer-events-auto absolute rounded-xl border shadow-2xl overflow-hidden flex flex-col"
      style={{
        left: isMobile ? "3%" : isMaximized ? "3%" : defaultPos.x,
        top: isMobile ? "9%" : isMaximized ? "6%" : defaultPos.y,
        width: isMobile ? "94%" : isMaximized ? "94%" : width,
        maxHeight: isMobile ? "82vh" : isMaximized ? "88vh" : "72vh",
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
        style={{ borderColor: "rgba(255,255,255,0.06)", cursor: isMobile || isMaximized ? "default" : "grab" }}
      >
        <div className="flex items-center gap-1.5 mr-1" onPointerDown={(e) => e.stopPropagation()}>
          <button
            aria-label={`Cerrar ${title}`}
            onClick={() => onClose(id)}
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none"
          />
          <button
            aria-label={`Minimizar ${title}`}
            onClick={() => onMinimize(id)}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none"
          />
          <button
            aria-label={`Maximizar ${title}`}
            onClick={() => onMaximize(id)}
            className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none"
          />
        </div>
        <IconCmp size={13} style={{ color: accent }} />
        <span
          className="text-[12.5px] font-medium text-white/85 truncate"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {title}
        </span>
      </div>
      {!isMinimized && (
        <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5" style={{ scrollbarWidth: "thin" }}>
          {children}
        </div>
      )}
    </motion.div>
  );
}

/* ============================================================
   DOCK
   ============================================================ */
function Dock({ items, windows, onToggle }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 sm:gap-1.5 px-2 py-2 rounded-2xl border pointer-events-auto"
      style={{
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
            className="group relative flex flex-col items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none hover:-translate-y-1"
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
              className="absolute -top-1.5 w-1 h-1 rounded-full"
              style={{ background: w?.open ? it.accent : "transparent" }}
            />
            <span
              className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
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
function TopBar() {
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
      style={{ background: "linear-gradient(to bottom, rgba(5,7,11,0.75), transparent)" }}
    >
      <div className="flex items-center gap-1.5 pointer-events-auto">
        <span className="w-2 h-2 rounded-full" style={{ background: CORE, boxShadow: `0 0 8px ${CORE}` }} />
        <span className="text-[11px] tracking-wide text-white/70" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          polyglot_core <span className="text-white/30">v1.0</span>
        </span>
      </div>
      <div className="hidden md:flex items-center gap-4 pointer-events-auto">
        {item(ICONS_.Cpu, "CPU", stats.cpu, "%", LANG.python.c2)}
        {item(ICONS_.MemoryStick, "MEM", stats.mem, "%", LANG.node.c2)}
        {item(ICONS_.Gauge, "LAT", stats.lat, "ms", LANG.java.c1)}
        {item(ICONS_.ShieldCheck, "TLS", "OK", "", CORE)}
      </div>
      <div className="pointer-events-auto text-[10.5px] text-white/45" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {time.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
const ICONS_ = { Cpu, MemoryStick, Gauge, ShieldCheck };

/* ============================================================
   WINDOW CONTENTS
   ============================================================ */
function AboutContent() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold shrink-0"
          style={{
            background: `conic-gradient(${LANG.python.c1}, ${LANG.java.c1}, ${LANG.node.c1}, ${LANG.python.c1})`,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          <span className="w-[52px] h-[52px] rounded-full bg-[#0d1117] flex items-center justify-center">MC</span>
        </div>
        <div>
          <h3 className="text-white text-[15px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Maximiliano Andrés Caniullan Lefiñir
          </h3>
          <p className="text-white/50 text-[12px]">Senior Backend Engineer &middot; Sistemas poliglota</p>
        </div>
      </div>
      <p className="text-[13px] leading-6 text-white/70 mb-4">
        Construyo sistemas backend de alto rendimiento combinando Python, Java y Node.js
        según lo que cada problema exige: prototipado rápido, concurrencia robusta a nivel
        de JVM, o I/O asincrónico a escala. Cuando el rendimiento lo pide, bajo a extensiones
        nativas para eliminar cuellos de botella sin sacrificar seguridad de memoria.
      </p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.entries(LANG).map(([id, l]) => (
          <div key={id} className="rounded-lg border px-2.5 py-2 text-center" style={{ borderColor: `${l.c1}33`, background: `${l.c1}0d` }}>
            <div className="text-[11px] font-medium" style={{ color: l.c2 }}>{l.name}</div>
            <div className="text-[9.5px] text-white/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{l.label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[12px] text-white/50 mb-1">
        <ICONS_.ShieldCheck size={13} style={{ color: CORE }} />
        <span>Enfocado en seguridad probada, bajo consumo de recursos y compatibilidad multiplataforma.</span>
      </div>
    </div>
  );
}

function SkillsContent() {
  return (
    <div className="w-full sm:w-[560px] max-w-full">
      <p className="text-[12px] text-white/60 mb-4">
        Métricas relativas de cada runtime en mi stack &mdash; velocidad, memoria, seguridad,
        concurrencia y ecosistema disponible hoy.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {Object.entries(LANG).map(([id, l]) => (
          <div key={id} className="rounded-lg border p-3" style={{ borderColor: `${l.c1}2a`, background: "rgba(255,255,255,0.02)" }}>
            <div className="text-center text-[11.5px] font-medium mb-1" style={{ color: l.c2, fontFamily: "'Space Grotesk', sans-serif" }}>
              {l.name}
            </div>
            <RadarChart values={RADAR[id]} color={l.c1} size={150} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {Object.entries(SKILL_BARS).map(([id, bars]) => (
          <div key={id}>
            <div className="text-[10.5px] uppercase tracking-wider mb-2" style={{ color: LANG[id].c2, fontFamily: "'JetBrains Mono', monospace" }}>
              {LANG[id].name}
            </div>
            {bars.map((b, i) => (
              <SkillBar key={b.name} name={b.name} value={b.v} color={LANG[id].c1} delay={i * 90} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-white/8">
        <div className="text-[10.5px] uppercase tracking-wider mb-2 text-white/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Datos &amp; infraestructura
        </div>
        <div className="flex flex-wrap gap-2">
          {DB_TOOLS.map((t) => (
            <span key={t.name} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/70">
              {t.icon === "Database" && <ICONS_.Cpu size={11} style={{ color: CORE }} />}
              {t.icon === "Layers" && <ICONS_.MemoryStick size={11} style={{ color: CORE }} />}
              {t.icon === "Network" && <ICONS_.Gauge size={11} style={{ color: CORE }} />}
              {t.icon === "Lock" && <ICONS_.ShieldCheck size={11} style={{ color: CORE }} />}
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
    <div className="w-full sm:w-[520px] max-w-full">
      <p className="text-[12px] text-white/60 mb-3">
        Selecciona un proyecto para abrir su infografía de arquitectura en una nueva ventana.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              Ver infografía <ICONS_.Gauge className="hidden" />
              <ChevronRightIcon />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
function ChevronRightIcon() {
  return <ChevronRight size={12} />;
}

function ProjectDetailContent({ project }) {
  return (
    <div className="w-full sm:w-[440px] max-w-full">
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {project.langs.map((l) => <LangBadge key={l} id={l} size="md" />)}
      </div>
      <p className="text-[12.5px] text-white/65 leading-6 mb-3">{project.summary}</p>
      <div className="rounded-lg border border-white/10 bg-black/30 p-3 mb-3">
        <ProjectDiagram kind={project.diagram} />
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
    <div className="w-full sm:w-[440px] max-w-full">
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
            <div className="flex items-center gap-3 text-[10.5px] text-white/40 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span className="inline-flex items-center gap-1"><ICONS_.Cpu className="hidden" /><CalendarIcon /> {e.period}</span>
              <span className="inline-flex items-center gap-1"><MapPinIcon /> {e.location}</span>
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
function CalendarIcon() { return <Calendar size={11} />; }
function MapPinIcon() { return <MapPin size={11} />; }

function EducationContent() {
  return (
    <div className="w-full sm:w-[400px] max-w-full space-y-3">
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
    <div className="w-full sm:w-[400px] max-w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
      {CERTS.map((c, i) => {
        const color = [LANG.python.c1, LANG.java.c1, LANG.node.c1, CORE][i % 4];
        return (
          <div key={c.name} className="rounded-lg border p-3 flex items-start gap-2.5" style={{ borderColor: `${color}33`, background: `${color}0d` }}>
            <Award size={16} style={{ color }} className="shrink-0 mt-0.5" />
            <div>
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
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errors, setErrors] = useState({});

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

  const inputCls =
    "w-full rounded-md bg-black/30 border px-3 py-2 text-[12.5px] text-white/90 placeholder:text-white/30 outline-none transition-colors focus:border-[#22D3EE] disabled:opacity-50";

  if (status === "success") {
    return (
      <div className="w-full sm:w-[360px] max-w-full flex flex-col items-center text-center py-6">
        <CheckCircle2 size={30} style={{ color: LANG.node.c2 }} className="mb-3" />
        <div className="text-[13.5px] font-medium text-white/90 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Mensaje enviado
        </div>
        <p className="text-[12px] text-white/65 mb-4">Responderé dentro de 24&ndash;48 horas hábiles.</p>
        <button
          onClick={() => { setStatus("idle"); setForm({ name: "", email: "", message: "" }); }}
          className="text-[11.5px] px-3 py-1.5 rounded-md border border-white/15 text-white/70 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <div className="w-full sm:w-[360px] max-w-full">
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
          className="w-full flex items-center justify-center gap-2 rounded-md py-2 text-[12.5px] font-medium transition-all disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none hover:brightness-110 active:scale-[0.98]"
          style={{ background: `linear-gradient(90deg, ${CORE}, ${LANG.node.c1})`, color: "#05070b" }}
        >
          {status === "loading" ? (<><Loader2 size={14} className="animate-spin" /> Enviando...</>) : (<><Send size={13} /> Enviar mensaje</>)}
        </button>
      </form>
      <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/8">
        <a href="#" aria-label="GitHub" className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">
          <Github size={15} />
        </a>
        <a href="#" aria-label="LinkedIn" className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">
          <Linkedin size={15} />
        </a>
        <a href="#" aria-label="Email" className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">
          <Mail size={15} />
        </a>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
const DOCK_ITEMS = [
  {
    id: "about", label: "Sobre mí", IconCmp: User, accent: CORE, width: 380,
    pos: { x: "6%", y: "18%" }
  },
  {
    id: "skills", label: "Skills", IconCmp: Code2, accent: LANG.python.c1, width: 600,
    pos: { x: "10%", y: "14%" }
  },
  {
    id: "projects", label: "Proyectos", IconCmp: FolderGit2, accent: LANG.node.c1, width: 540,
    pos: { x: "8%", y: "16%" }
  },
  {
    id: "experience", label: "Experiencia", IconCmp: Briefcase, accent: LANG.java.c1, width: 460,
    pos: { x: "30%", y: "12%" }
  },
  {
    id: "education", label: "Educación", IconCmp: GraduationCap, accent: LANG.python.c2, width: 420,
    pos: { x: "34%", y: "20%" }
  },
  {
    id: "certifications", label: "Certificaciones", IconCmp: Award, accent: LANG.java.c2, width: 420,
    pos: { x: "26%", y: "24%" }
  },
  {
    id: "contact", label: "Contacto", IconCmp: Mail, accent: LANG.node.c2, width: 380,
    pos: { x: "38%", y: "16%" }
  },
];

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
  const [isMobile, setIsMobile] = useState(false);
  const zRef = useRef(10);
  const boundsRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
      zRef.current += 1;
      return { ...w, [id]: { ...cur, z: zRef.current } };
    });
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

  const contentFor = (id) => {
    switch (id) {
      case "about": return <AboutContent />;
      case "skills": return <SkillsContent />;
      case "projects": return <ProjectsContent onOpenProject={openProject} />;
      case "experience": return <ExperienceContent />;
      case "education": return <EducationContent />;
      case "certifications": return <CertificationsContent />;
      case "contact": return <ContactContent />;
      default: return null;
    }
  };

  const activeProject = PROJECTS.find((p) => p.id === projectWin.id);

  return (
    <div className="relative w-full h-screen min-h-[640px] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
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
      <TopBar />

      {/* bounds container for draggable windows */}
      <div ref={boundsRef} className="absolute inset-0 z-10 pointer-events-none">
        {/* hero */}
        <AnimatePresence>
          {booted && !Object.values(windows).some((w) => w.open && !w.minimized) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center pointer-events-auto"
            >
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] mb-4"
                style={{ borderColor: `${CORE}44`, color: CORE, fontFamily: "'JetBrains Mono', monospace" }}
              >
                <Sparkles size={11} /> Disponible para nuevos proyectos
              </span>
              <h1
                className="text-[32px] sm:text-[44px] font-semibold text-white mb-3 leading-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Maximiliano Andrés Caniullan Lefiñir
              </h1>
              <p className="text-[14px] sm:text-[16px] text-white/55 max-w-md mb-6">
                Backend Developer: <span style={{ color: LANG.python.c2 }}>Python</span>,{" "}
                y{" "}
                <span style={{ color: LANG.node.c2 }}>Node.js</span> &mdash; actualmente mejorando en {" "}
                <span style={{ color: LANG.java.c1 }}>Java</span>, construyendo sistemas
                rápidos, seguros y compilados para durar.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={() => toggleWindow("projects")}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium hover:brightness-110 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none"
                  style={{ background: `linear-gradient(90deg, ${CORE}, ${LANG.node.c1})`, color: "#05070b" }}
                >
                  <FolderGit2 size={14} /> Ver proyectos
                </button>
                <button
                  onClick={() => toggleWindow("about")}
                  className="flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-[13px] font-medium text-white/80 hover:bg-white/5 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
                >
                  <User size={14} /> Sobre mí
                </button>
              </div>
              <p className="mt-8 text-[10.5px] text-white/50" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                abre las ventanas del dock inferior para explorar el resto del portafolio
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* portfolio windows */}
        <AnimatePresence>
          {booted && DOCK_ITEMS.map((it) => {
            const w = windows[it.id];
            if (!w.open) return null;
            return (
              <FloatingWindow
                key={it.id}
                id={it.id}
                title={it.label}
                IconCmp={it.IconCmp}
                accent={it.accent}
                defaultPos={it.pos}
                width={it.width}
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
              key="project-detail"
              id="project-detail"
              title={activeProject.title}
              IconCmp={FolderGit2}
              accent={CORE}
              defaultPos={{ x: "22%", y: "22%" }}
              width={460}
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
              <ProjectDetailContent project={activeProject} />
            </FloatingWindow>
          )}
        </AnimatePresence>
      </div>

      {booted && <Dock items={DOCK_ITEMS} windows={windows} onToggle={toggleWindow} />}
    </div>
  );
}
