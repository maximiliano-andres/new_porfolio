/* Small shared UI pieces used by the window contents: badges, diagrams, simulator entry and micro-interactions.
   Only the lazy window chunks import this module, so none of it ships in the initial chunk. */
import { useEffect, useMemo, useRef, useState } from "react";
import { m, useSpring } from "framer-motion";
import { ArrowRight, ChevronRight, Zap } from "lucide-react";
import { useAudience, useSystem } from "../app/context.js";
import { hasFinePointer, prefersReducedMotion } from "../lib/env.js";
import { CORE, HR_ACCENT, LANG } from "../styles/theme.js";

/* ============================================================
   SMALL UI PRIMITIVES
   ============================================================ */
export function LangBadge({ id, size = "sm" }) {
  const l = LANG[id];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 ${size === "sm" ? "py-0.5 text-[10px]" : "py-1 text-[11px]"
        } font-medium`}
      style={{
        borderColor: `${l.c1}55`,
        background: `${l.c1}14`,
        color: l.c2,
        fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.c1 }} />
      {l.name}
    </span>
  );
}

/* what each diagram shows, read by screen readers instead of its loose box labels */
const DIAGRAM_LABELS = {
  migration: "Diagrama de arquitectura: los documentos pasan a workers asíncronos, que los envían a la API de BUK y generan un reporte.",
  finance: "Diagrama de arquitectura: servicios FastAPI y Spring Boot procesan datos con Polars y orjson y los guardan en PostgreSQL.",
  native: "Diagrama de arquitectura: un servicio Spring Boot compilado con GraalVM Native Image, desplegado en AWS y conectado a MySQL.",
  validation: "Diagrama de flujo: datos de origen, normalización, validación con 98% de coincidencia y reporte final.",
  hexagonal: "Diagrama de arquitectura: una SPA en React llama a una API hexagonal conectada a PostgreSQL y a la API de BUK.",
  workbook: "Diagrama de arquitectura: una interfaz tipo planilla consulta en solo lectura 6 motores SQL y exporta a Excel.",
  batch: "Diagrama de flujo: 9 archivos XLSX se leen en streaming, se agrupan en lotes de 10 mil filas y se cargan en SQLite.",
  consolidator: "Diagrama de flujo: archivos XLSX y XLS se unen con Polars en un consolidado y un reporte de auditoría.",
  webperf: "Diagrama de arquitectura: el build de Vite se prerenderiza y comprime con Brotli, y se sirve con Granian y Caddy.",
};

/* project mini-infographics: abstract architecture diagrams (SVG) */
export function ProjectDiagram({ kind }) {
  const box = (x, y, w, h, label, color) => (
    <g key={label}>
      <rect x={x} y={y} width={w} height={h} rx="6" fill={`${color}18`} stroke={color} strokeWidth="1.3" />
      <text x={x + w / 2} y={y + h / 2 + 3.5} textAnchor="middle" fontSize="8.5"
        fill="rgba(255,255,255,0.85)" fontFamily="'JetBrains Mono', 'JetBrains Mono Fallback', monospace">
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
    migration: (
      <>
        {box(10, 55, 80, 40, "Documentos", LANG.python.c2)}
        {arrow(90, 75, 140, 75, LANG.python.c1)}
        {box(140, 35, 110, 80, "Workers async", CORE)}
        {arrow(250, 55, 300, 37, LANG.python.c1)}
        {arrow(250, 95, 300, 113, LANG.node.c1)}
        {box(300, 18, 90, 38, "API BUK", LANG.python.c1)}
        {box(300, 94, 90, 38, "Reporte", LANG.node.c1)}
      </>
    ),
    finance: (
      <>
        {box(10, 20, 90, 34, "FastAPI", LANG.python.c1)}
        {box(10, 96, 90, 34, "Spring Boot", LANG.java.c1)}
        {arrow(100, 37, 150, 62, LANG.python.c1)}
        {arrow(100, 113, 150, 88, LANG.java.c1)}
        {box(150, 45, 110, 60, "Polars · orjson", CORE)}
        {arrow(260, 75, 310, 75, LANG.python.c2)}
        {box(310, 55, 90, 40, "PostgreSQL", LANG.python.c2)}
      </>
    ),
    native: (
      <>
        {box(10, 55, 90, 40, "Spring Boot", LANG.java.c1)}
        {arrow(100, 75, 150, 75, LANG.java.c1)}
        {box(150, 40, 100, 70, "GraalVM native", CORE)}
        {arrow(250, 55, 300, 37, LANG.java.c2)}
        {arrow(250, 95, 300, 113, LANG.java.c1)}
        {box(300, 18, 90, 38, "AWS", LANG.java.c2)}
        {box(300, 94, 90, 38, "MySQL", LANG.java.c1)}
      </>
    ),
    validation: (
      <>
        {box(10, 55, 75, 40, "Origen", LANG.node.c2)}
        {arrow(85, 75, 120, 75, LANG.node.c1)}
        {box(120, 55, 85, 40, "Normalizar", LANG.python.c1)}
        {arrow(205, 75, 240, 75, LANG.python.c1)}
        {box(240, 45, 75, 60, "Match 98%", CORE)}
        {arrow(315, 75, 335, 75, LANG.node.c1)}
        {box(335, 55, 65, 40, "Reporte", LANG.node.c1)}
      </>
    ),
    hexagonal: (
      <>
        {box(10, 55, 80, 40, "React SPA", LANG.node.c2)}
        {arrow(90, 75, 140, 75, LANG.java.c1)}
        {box(140, 35, 110, 80, "API hexagonal", CORE)}
        {arrow(250, 55, 300, 37, LANG.java.c2)}
        {arrow(250, 95, 300, 113, LANG.java.c1)}
        {box(300, 18, 90, 38, "PostgreSQL", LANG.python.c2)}
        {box(300, 94, 90, 38, "API BUK", LANG.java.c1)}
      </>
    ),
    workbook: (
      <>
        {box(10, 55, 80, 40, "Planilla UI", LANG.node.c2)}
        {arrow(90, 75, 140, 75, LANG.java.c1)}
        {box(140, 40, 110, 70, "Solo lectura", CORE)}
        {arrow(250, 55, 300, 37, LANG.java.c2)}
        {arrow(250, 95, 300, 113, LANG.java.c1)}
        {box(300, 18, 90, 38, "6 motores SQL", LANG.java.c2)}
        {box(300, 94, 90, 38, "Excel", LANG.python.c1)}
      </>
    ),
    batch: (
      <>
        {box(10, 55, 75, 40, "9 × XLSX", LANG.python.c2)}
        {arrow(85, 75, 120, 75, LANG.python.c1)}
        {box(120, 55, 85, 40, "Streaming", LANG.python.c1)}
        {arrow(205, 75, 240, 75, LANG.python.c1)}
        {box(240, 45, 75, 60, "Lotes 10k", CORE)}
        {arrow(315, 75, 335, 75, LANG.python.c2)}
        {box(335, 55, 65, 40, "SQLite", LANG.python.c2)}
      </>
    ),
    consolidator: (
      <>
        {box(10, 55, 80, 40, "XLSX / XLS", LANG.python.c2)}
        {arrow(90, 75, 140, 75, LANG.python.c1)}
        {box(140, 40, 110, 70, "Polars concat", CORE)}
        {arrow(250, 55, 300, 37, LANG.python.c1)}
        {arrow(250, 95, 300, 113, LANG.python.c2)}
        {box(300, 18, 90, 38, "Consolidado", LANG.python.c1)}
        {box(300, 94, 90, 38, "Auditoría", LANG.python.c2)}
      </>
    ),
    webperf: (
      <>
        {box(10, 55, 80, 40, "Vite build", LANG.node.c2)}
        {arrow(90, 75, 140, 75, LANG.node.c1)}
        {box(140, 40, 110, 70, "Prerender + Brotli", CORE)}
        {arrow(250, 55, 300, 37, LANG.python.c1)}
        {arrow(250, 95, 300, 113, LANG.node.c1)}
        {box(300, 18, 90, 38, "Granian", LANG.python.c1)}
        {box(300, 94, 90, 38, "Caddy", LANG.node.c1)}
      </>
    ),
  };
  return (
    <svg viewBox="0 0 410 150" className="w-full min-w-[340px] h-auto" role="img" aria-label={DIAGRAM_LABELS[kind] || "Diagrama de arquitectura del proyecto"}>
      <defs aria-hidden="true">
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,0.5)" />
        </marker>
      </defs>
      <g aria-hidden="true">{layouts[kind]}</g>
    </svg>
  );
}

/* entry point to the optimization simulator, shown in both project views */
export function SimulatorBanner({ compact = false }) {
  const { openWindow } = useSystem();
  const { audience } = useAudience();
  const hr = audience === "rrhh";
  return (
    <button
      onClick={() => openWindow("simulator")}
      className={`w-full flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left hover:brightness-125 transition-all focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden ${compact ? "mt-4" : "mb-3"}`}
      style={{ borderColor: `${CORE}44`, background: `linear-gradient(90deg, ${CORE}14, transparent)` }}
    >
      <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${CORE}1f`, color: CORE }}>
        <Zap size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-medium text-white/90">
          {compact ? (hr ? "Pruébalo tú en el simulador" : "Reprodúcelo en el simulador") : hr ? "Pruébalo tú: optimiza un proceso" : "Simulador: optimiza un batch de 62 min"}
        </span>
        <span className="block text-[11px] text-white/60">
          {hr ? "Un mini-juego basado en el caso real de la migración a BUK." : "Paralelismo, caché e índices — inspirado en la migración a BUK."}
        </span>
      </span>
      <ChevronRight size={14} className="text-white/55 shrink-0" />
    </button>
  );
}

/* ---------- audience (TI / RRHH) helpers: they live in audience.jsx (shell chunk); re-exported here ---------- */
export { AudienceSwap, AudienceToggle } from "./audience.jsx";

export function SectionTitle({ children, color = HR_ACCENT, className = "" }) {
  return (
    <h4
      className={`text-[10.5px] uppercase tracking-wider font-semibold mb-3 ${className}`}
      style={{ color, fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}
    >
      {children}
    </h4>
  );
}

export function Chip({ children, color }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] text-white/75"
      style={{ borderColor: color ? `${color}40` : "rgba(255,255,255,0.1)", background: color ? `${color}0d` : "transparent" }}
    >
      {children}
    </span>
  );
}

export function BeforeAfter({ hr, color = HR_ACCENT, size = "text-[13px]" }) {
  return (
    <div className={`flex items-center gap-2 ${size} font-semibold`} style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>
      {hr.before && (
        <>
          <span className="text-white/60 line-through decoration-white/35">{hr.before}</span>
          <ArrowRight size={13} className="text-white/50 shrink-0" />
        </>
      )}
      <span style={{ color }}>{hr.after}</span>
    </div>
  );
}

/* ---------- micro-interactions ---------- */

/* counts the first number of a label up from 0 when it scrolls into view ("−83%" → 0…83).
   Values ≤ 1 are shown as they are ("< 1 s" would read "< 0 s" mid-animation), and so is everything
   when motion is reduced or IntersectionObserver is missing (the count would never start). */
const canCount = (target) =>
  target > 1 && !prefersReducedMotion() && typeof window !== "undefined" && "IntersectionObserver" in window;

export function CountUp({ value, duration = 900 }) {
  const ref = useRef(null);
  const match = value.match(/\d+/);
  const target = match ? Number(match[0]) : 0;
  const [n, setN] = useState(() => (match && canCount(target) ? 0 : target));
  useEffect(() => {
    if (!match || !canCount(target)) {
      setN(target);
      return;
    }
    let frame = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, Math.max(0, (t - t0) / duration));
        setN(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(frame); };
  }, [target, duration]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref}>{match ? value.replace(match[0], String(n)) : value}</span>;
}

/* subtle 3D tilt that follows the cursor — mouse only, disabled with reduced motion */
export function Tilt({ children, className = "", max = 4 }) {
  const enabled = useMemo(() => hasFinePointer() && !prefersReducedMotion(), []);
  const rx = useSpring(0, { stiffness: 260, damping: 22 });
  const ry = useSpring(0, { stiffness: 260, damping: 22 });
  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <m.div
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 800 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        ry.set(((e.clientX - r.left) / r.width - 0.5) * max * 2);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * max * 2);
      }}
      onPointerLeave={() => { rx.set(0); ry.set(0); }}
    >
      {children}
    </m.div>
  );
}
