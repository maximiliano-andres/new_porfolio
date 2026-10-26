/* CORE control hub: radial menu around the background hexagon. */
import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { Hexagon } from "lucide-react";
import { CORE } from "../theme.js";

export function CoreMenu({ open, onClose, origin, area, items, onPick }) {
  const [hover, setHover] = useState(null);
  useEffect(() => {
    if (!open) return;
    setHover(null);
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;

  const btn = 48;
  const topReserve = 56; // keeps the top modules clear of the "badge unlocked" toast
  // radius and centre are clamped so every module (and its label) stays inside the desk area
  const R = Math.max(70, Math.min(190, (area.h - btn - 36 - topReserve) / 2, (area.w - 84 - 8) / 2));
  const showLabels = (2 * Math.PI * R) / items.length >= 80; // only when neighbouring labels can't collide
  const half = showLabels ? 42 : btn / 2; // half the width of a module (icon, or icon + label)
  const cx = Math.min(Math.max(origin.x, area.x + R + half + 4), area.x + area.w - R - half - 4);
  const cy = Math.min(Math.max(origin.y, area.y + topReserve + R + btn / 2), area.y + area.h - R - btn / 2 - 22);
  const label = hover ? items.find((it) => it.id === hover)?.label : null;

  return (
    <m.div
      className="fixed inset-0 z-[95]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: `radial-gradient(circle at ${cx}px ${cy}px, rgba(34,211,238,0.12), transparent 45%), rgba(3,5,9,0.93)`, backdropFilter: "blur(6px)" }}
      onClick={onClose}
      role="dialog"
      aria-label="Centro de control CORE"
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        {items.map((it, i) => {
          const a = (-90 + (360 / items.length) * i) * (Math.PI / 180);
          return (
            <m.line
              key={it.id}
              x1={cx} y1={cy} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)}
              stroke={it.accent} strokeOpacity={hover === it.id ? 0.9 : 0.35} strokeWidth={hover === it.id ? 2 : 1.2}
              strokeDasharray="4 5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: i * 0.025 }}
            />
          );
        })}
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center text-center pointer-events-none"
        style={{ left: cx - 70, top: cy - 70, width: 140, height: 140 }}
      >
        <Hexagon size={64} strokeWidth={1} style={{ color: CORE, filter: `drop-shadow(0 0 12px ${CORE})` }} />
        <span className="mt-1 text-[10.5px] text-white/80 max-w-[130px] leading-4" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
          {label || "CORE · elige un módulo"}
        </span>
      </div>
      {items.map((it, i) => {
        const a = (-90 + (360 / items.length) * i) * (Math.PI / 180);
        return (
          <m.button
            key={it.id}
            onClick={(e) => { e.stopPropagation(); onPick(it.id); }}
            onPointerEnter={() => setHover(it.id)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(it.id)}
            aria-label={it.label}
            initial={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
            animate={{ x: R * Math.cos(a), y: R * Math.sin(a), scale: 1, opacity: 1 }}
            exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22, delay: i * 0.025 }}
            className="absolute flex flex-col items-center focus:outline-hidden group"
            style={{ left: cx - half, top: cy - btn / 2, width: half * 2 }}
          >
            <span
              className="w-12 h-12 rounded-full border flex items-center justify-center transition-all group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-white/60"
              style={{ borderColor: `${it.accent}88`, background: "rgba(10,14,20,0.95)", color: it.accent, boxShadow: hover === it.id ? `0 0 18px ${it.accent}88` : "none" }}
            >
              <it.IconCmp size={18} />
            </span>
            {showLabels && (
              <span className="mt-1.5 max-w-[84px] truncate text-[10px] text-white/75" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>{it.label}</span>
            )}
          </m.button>
        );
      })}
    </m.div>
  );
}
