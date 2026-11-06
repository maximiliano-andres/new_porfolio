/* Environment helpers: motion/pointer preferences and accent-insensitive text normalization. */
import { useSyncExternalStore } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia(REDUCED_QUERY).matches;

/* live version for components that must react when the setting changes mid-session */
const subscribeReduced = (cb) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener?.("change", cb);
  return () => mq.removeEventListener?.("change", cb);
};
export const usePrefersReducedMotion = () => useSyncExternalStore(subscribeReduced, prefersReducedMotion, () => false);

export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

/* accent-insensitive text normalization for search and terminal commands */
export const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
