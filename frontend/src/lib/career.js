/* Career timeline helpers: period parsing and the rows (jobs + studies) shown by <CareerTimeline>. */
import { useT } from "../app/context.js";
import { useContent } from "../data/useContent.js";
import { HR_ACCENT, LANG } from "../styles/theme.js";

const MONTHS = { ene: 0, jan: 0, feb: 1, mar: 2, abr: 3, apr: 3, may: 4, jun: 5, jul: 6, ago: 7, aug: 7, sep: 8, oct: 9, nov: 10, dic: 11, dec: 11 };
/* "Mar 2024 — Ago 2024" → [2024.17, 2024.67]; "2023 — 2024" → [2023, 2025) clamped to today */
export function parsePeriod(period) {
  const parts = [...String(period).matchAll(/(?:([a-zñ]{3})[a-zñ]*\.?\s+)?(\d{4})/gi)].map(([, mon, year]) => ({
    year: Number(year), month: mon ? MONTHS[mon.toLowerCase()] : undefined,
  }));
  if (!parts.length) return null;
  const [a, b = parts[0]] = parts;
  const now = new Date();
  const nowY = now.getFullYear() + now.getMonth() / 12;
  const start = a.year + (a.month ?? 0) / 12;
  const end = Math.min(nowY, b.year + (b.month !== undefined ? (b.month + 1) / 12 : 1));
  return [start, Math.max(end, start + 1 / 12)];
}


/* timeline rows: jobs and studies on one axis */
export function useCareerRows(accent) {
  const t = useT();
  const { EXPERIENCE, EDUCATION } = useContent();
  return [
    ...EXPERIENCE.map((e, i) => ({ id: `job-${i}`, label: e.company, sub: e.role, period: e.period, color: [accent, LANG.node.c2, LANG.python.c1][i % 3] })),
    ...EDUCATION.map((ed, i) => ({ id: `edu-${i}`, label: ed.place.split(" — ")[0], sub: t("Estudios", "Studies"), period: ed.period, color: HR_ACCENT })),
  ];
}

