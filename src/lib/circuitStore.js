/* External store for the circuit background's transient state (dock hover, one-shot pulses).
   Kept outside React state on purpose: hovering the dock re-renders only the background,
   never the app shell and its open windows. */
import { useSyncExternalStore } from "react";
import { WINDOW_CIRCUIT } from "../data/system.js";
import { prefersReducedMotion } from "./env.js";

let state = { highlighted: null, pulses: [] };
let nextKey = 0;
const listeners = new Set();

const emit = (next) => {
  state = next;
  listeners.forEach((l) => l());
};

export const circuit = {
  hover(id) {
    const idx = id ? WINDOW_CIRCUIT[id] ?? null : null;
    if (idx !== state.highlighted) emit({ ...state, highlighted: idx });
  },
  pulse(ids) {
    if (prefersReducedMotion()) return;
    const fresh = ids
      .filter((id) => WINDOW_CIRCUIT[id] !== undefined)
      .map((id) => ({ key: ++nextKey, idx: WINDOW_CIRCUIT[id] }));
    if (!fresh.length) return;
    emit({ ...state, pulses: [...state.pulses, ...fresh] });
    setTimeout(() => emit({ ...state, pulses: state.pulses.filter((p) => !fresh.includes(p)) }), 1300);
  },
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;
// third argument: snapshot used when the background is prerendered at build time
export const useCircuit = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
