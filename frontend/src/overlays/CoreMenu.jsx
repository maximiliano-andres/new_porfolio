/* CORE control hub: radial menu around the background hexagon. */
import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { Hexagon } from "lucide-react";
import { isTopTrap, useFocusTrap } from "../lib/useFocusTrap.js";
import { CORE } from "../styles/theme.js";

const BTN = 48; // module diameter
const MIN_GAP = 56; // closest two module centres may get (48 px + a little air)
const LABEL_GAP = 84; // room needed for the label under every module
const TOAST_BOTTOM = 120; // the "badge unlocked" toast (opening CORE unlocks one) ends ~120 px from the top

/* n points on a "stadium" (a circle when rx === ry; otherwise two half circles joined by straight sides),
   spaced by equal arc length. An ellipse would have sharp tips where modules bunch up; the stadium's ends keep
   the radius of the short axis. offset: 0 puts the first module at the top, as the circular menu always did */
function stadiumPoints(n, rx, ry, offset) {
  const horizontal = rx >= ry;
  const r = Math.min(rx, ry);
  const L = Math.abs(rx - ry); // half length of the straight sides
  const S = 720;
  const pts = [];
  const cum = [0];
  // walk the outline clockwise from the top centre: in "horizontal" coordinates, then swap axes if needed
  const perim = 4 * L + 2 * Math.PI * r;
  const at = (d) => {
    const segs = [L, Math.PI * r, 2 * L, Math.PI * r, L];
    let p;
    if (d < segs[0]) p = { x: d, y: -r };
    else if ((d -= segs[0]) < segs[1]) { const t = -Math.PI / 2 + d / r; p = { x: L + r * Math.cos(t), y: r * Math.sin(t) }; }
    else if ((d -= segs[1]) < segs[2]) p = { x: L - d, y: r };
    else if ((d -= segs[2]) < segs[3]) { const t = Math.PI / 2 + d / r; p = { x: -L + r * Math.cos(t), y: r * Math.sin(t) }; }
    else p = { x: -L + (d - segs[3]), y: -r };
    return horizontal ? p : { x: -p.y, y: p.x }; // a quarter turn for tall layouts
  };
  for (let k = 0; k <= S; k++) {
    pts.push(at((perim * k) / S));
    if (k) cum.push(cum[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
  }
  const total = cum[S];
  const out = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    const target = ((i + offset) / n) * total;
    while (k < S - 1 && cum[k + 1] < target) k++;
    const f = cum[k + 1] === cum[k] ? 0 : (target - cum[k]) / (cum[k + 1] - cum[k]);
    out.push({ x: pts[k].x + (pts[k + 1].x - pts[k].x) * f, y: pts[k].y + (pts[k + 1].y - pts[k].y) * f });
  }
  return out;
}
const minDistance = (pts) => {
  let min = Infinity;
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) min = Math.min(min, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
  return min;
};

/* A circle when the modules fit around it; otherwise the circle is stretched into a stadium along the axis
   with room to spare (a landscape phone has width, not height) until no two modules touch — 12 modules on a
   circle of 70 px were 36 px apart and overlapped. */
function coreLayout(n, area, topReserve) {
  const maxRx = Math.max(BTN, (area.w - LABEL_GAP - 8) / 2);
  const maxRy = Math.max(BTN / 2, (area.h - BTN - 22 - topReserve) / 2);
  const r0 = Math.max(BTN / 2, Math.min(190, maxRx, maxRy));
  let rx = r0;
  let ry = r0;
  let pts = stadiumPoints(n, rx, ry, 0);
  let gap = minDistance(pts);
  const growX = maxRx - rx >= maxRy - ry;
  for (let guard = 0; gap < LABEL_GAP && guard < 200; guard++) {
    if (growX ? rx >= maxRx : ry >= maxRy) break;
    if (growX) rx = Math.min(maxRx, rx + 4);
    else ry = Math.min(maxRy, ry + 4);
    // off the circle, half a step of rotation keeps a module from sitting right on top of the hexagon
    pts = stadiumPoints(n, rx, ry, 0.5);
    gap = minDistance(pts);
  }
  // labels only when they fit; stretching stops at MIN_GAP otherwise would be enough for the icons alone
  return { rx, ry, pts, showLabels: gap >= LABEL_GAP, tight: gap < MIN_GAP };
}

export function CoreMenu({ open, onClose, origin, area, items, onPick }) {
  const [hover, setHover] = useState(null);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open, { focusFirst: true, restore: true });
  useEffect(() => {
    if (!open) return;
    setHover(null);
    const onKey = (e) => e.key === "Escape" && isTopTrap(dialogRef) && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;

  // keeps the top modules clear of the "badge unlocked" toast
  const topReserve = Math.max(16, TOAST_BOTTOM - area.y);
  const { rx, ry, pts, showLabels } = coreLayout(items.length, area, topReserve);
  const half = showLabels ? LABEL_GAP / 2 : BTN / 2; // half the width of a module (icon, or icon + label)
  // centre clamped so every module (and its label) stays inside the desk area
  const cx = Math.min(Math.max(origin.x, area.x + rx + half + 4), area.x + area.w - rx - half - 4);
  const cy = Math.min(Math.max(origin.y, area.y + topReserve + ry + BTN / 2), area.y + area.h - ry - BTN / 2 - 22);
  const label = hover ? items.find((it) => it.id === hover)?.label : null;
  // a flat (or narrow) stadium leaves less room for the hexagon in the middle
  const hexSize = Math.round(Math.max(28, Math.min(64, 2 * Math.min(rx, ry) - BTN - 8)));
  const compactCenter = hexSize < 64;

  return (
    <m.div
      ref={dialogRef}
      className="fixed inset-0 z-[95]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: `radial-gradient(circle at ${cx}px ${cy}px, rgba(34,211,238,0.12), transparent 45%), rgba(3,5,9,0.93)`, backdropFilter: "blur(6px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Centro de control CORE"
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        {items.map((it, i) => (
          <m.line
            key={it.id}
            x1={cx} y1={cy} x2={cx + pts[i].x} y2={cy + pts[i].y}
            stroke={it.accent} strokeOpacity={hover === it.id ? 0.9 : 0.35} strokeWidth={hover === it.id ? 2 : 1.2}
            strokeDasharray="4 5"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: i * 0.025 }}
          />
        ))}
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center text-center pointer-events-none"
        style={{ left: cx - 70, top: cy - 70, width: 140, height: 140 }}
      >
        <Hexagon size={hexSize} strokeWidth={1} style={{ color: CORE, filter: `drop-shadow(0 0 12px ${CORE})` }} aria-hidden="true" />
        <span
          className={`mt-1 text-[10.5px] text-white/80 max-w-[130px] leading-4 ${compactCenter && showLabels ? "sr-only" : ""}`}
          style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}
        >
          {label || "CORE · elige un módulo"}
        </span>
      </div>
      {items.map((it, i) => (
        <m.button
          key={it.id}
          onClick={(e) => { e.stopPropagation(); onPick(it.id); }}
          onPointerEnter={() => setHover(it.id)}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(it.id)}
          aria-label={it.label}
          data-core-module={it.id}
          initial={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
          animate={{ x: pts[i].x, y: pts[i].y, scale: 1, opacity: 1 }}
          exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22, delay: i * 0.025 }}
          className="absolute flex flex-col items-center focus:outline-hidden group"
          style={{ left: cx - half, top: cy - BTN / 2, width: half * 2 }}
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
      ))}
    </m.div>
  );
}
