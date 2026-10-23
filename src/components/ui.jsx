/* Small shared UI pieces: badges, charts, diagrams, audience toggle and micro-interactions. */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";
import { ArrowRight, ChevronRight, Zap } from "lucide-react";
import { useAudience, useSystem } from "../context.js";
import { RADAR_AXES } from "../data/content.js";
import { AUDIENCES } from "../data/hr.js";
import { hasFinePointer, prefersReducedMotion } from "../lib/env.js";
import { CORE, HR_ACCENT, LANG } from "../theme.js";

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
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.c1 }} />
      {l.name}
    </span>
  );
}

export function SkillBar({ name, value, color, delay = 0 }) {
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

export function RadarChart({ values, color, size = 168 }) {
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
export function ProjectDiagram({ kind }) {
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

/* entry point to the optimization simulator, shown in both project views */
export function SimulatorBanner({ compact = false }) {
  const { openWindow } = useSystem();
  const { audience } = useAudience();
  const hr = audience === "rrhh";
  return (
    <button
      onClick={() => openWindow("simulator")}
      className={`w-full flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left hover:brightness-125 transition-all focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none ${compact ? "mt-4" : "mb-3"}`}
      style={{ borderColor: `${CORE}44`, background: `linear-gradient(90deg, ${CORE}14, transparent)` }}
    >
      <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${CORE}1f`, color: CORE }}>
        <Zap size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-medium text-white/90">
          {compact ? (hr ? "Pruébalo tú en el simulador" : "Reprodúcelo en el simulador") : hr ? "Pruébalo tú: optimiza un proceso" : "Simulador: optimiza un batch de 62 min"}
        </span>
        <span className="block text-[11px] text-white/55">
          {hr ? "Un mini-juego basado en el caso real de IACC." : "Paralelismo, caché e índices — inspirado en el caso IACC."}
        </span>
      </span>
      <ChevronRight size={14} className="text-white/40 shrink-0" />
    </button>
  );
}

/* ---------- audience (TI / RRHH) helpers ---------- */
export function AudienceToggle({ variant = "compact" }) {
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
export function AudienceSwap({ children }) {
  return (
    <motion.div className="w-full" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  );
}

export function SectionTitle({ children, color = HR_ACCENT, className = "" }) {
  return (
    <h4
      className={`text-[10.5px] uppercase tracking-wider font-semibold mb-3 ${className}`}
      style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
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

/* ---------- micro-interactions ---------- */

/* counts the first number of a label up from 0 when it scrolls into view ("−83%" → 0…83) */
export function CountUp({ value, duration = 900 }) {
  const ref = useRef(null);
  const match = value.match(/\d+/);
  const target = match ? Number(match[0]) : 0;
  const [n, setN] = useState(() => (match && !prefersReducedMotion() ? 0 : target));
  useEffect(() => {
    if (!match || prefersReducedMotion()) return;
    let frame = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / duration);
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
    <motion.div
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
    </motion.div>
  );
}
