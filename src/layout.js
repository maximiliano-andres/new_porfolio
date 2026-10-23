/* Window layout engine and screen geometry helpers (all positions in px from the real viewport). */
import { ALL_ITEMS } from "./data/system.js";

/* screen position of the CORE hexagon: the SVG uses a 1440×900 viewBox with "slice" scaling */
export function corePosition({ width, height }) {
  const s = Math.max(width / 1440, height / 900);
  const ox = (width - 1440 * s) / 2;
  const oy = (height - 900 * s) / 2;
  return { x: 760 * s + ox, y: 210 * s + oy, r: 70 * s };
}

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
export function uiScaleFor({ width, height }) {
  const s = Math.min(width / 1440, height / 860);
  return Math.round(Math.min(2, Math.max(1, s)) * 20) / 20;
}

/* phones (portrait) and short landscape screens get a single full-width window */
export function isCompactViewport({ width, height }) {
  return width < 640 || height < 500;
}

/* dock size follows the `sm` breakpoint (viewport width), not the compact flag:
   36px buttons + padding below 640px, 44px buttons + padding above; plus its bottom offset.
   CSS `zoom` on the dock scales both its height and its `bottom` offset. */
export function dockSpaceFor({ width }, scale) {
  const wide = width >= 640;
  return ((wide ? 62 : 50) + (wide ? 16 : 8)) * scale;
}

/* extraBottom: room reserved above the dock (e.g. the guided-tour narration bar) */
export function deskArea(size, compact, scale, extraBottom = 0) {
  const { width, height } = size;
  const top = compact ? 40 : Math.round(48 * scale);
  const bottom = Math.round(dockSpaceFor(size, scale) + (compact ? 8 : TILE_GAP) + extraBottom);
  const padX = compact ? 8 : 16;
  return {
    x: padX,
    y: top,
    w: Math.max(0, width - padX * 2),
    h: Math.max(160, height - top - bottom),
  };
}

export function tileWindows(items, area, compact, scale) {
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

export function maximizedPos(area) {
  return { left: area.x, top: area.y, width: area.w, height: area.h, maxHeight: area.h };
}

export function centeredPos(area, width, compact, scale) {
  if (compact) return maximizedPos(area);
  const w = Math.min(area.w, width * scale);
  const top = area.y + Math.max(0, (area.h - 560 * scale) / 2);
  return { left: area.x + (area.w - w) / 2, top, width: w, maxHeight: area.y + area.h - top };
}

export function makeInitialWindows() {
  const w = {};
  ALL_ITEMS.forEach((it) => {
    w[it.id] = { open: false, minimized: false, maximized: false, z: 1 };
  });
  return w;
}
