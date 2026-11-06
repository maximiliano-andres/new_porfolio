/* Keyboard focus trap for modal overlays (WCAG 2.4.3): Tab / Shift+Tab cycle inside `ref`.
   - focusFirst: moves focus into the container when it activates (or when `focusKey` changes);
     an element marked `data-autofocus` wins over the first focusable one
   - restore: gives focus back to the element that had it before, when it deactivates
   Active traps form a stack: only the most recently activated one handles Tab, so two overlays open at
   once (CORE + palette, coach + palette) never fight over the focus. */
import { useEffect } from "react";

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),select,[tabindex]:not([tabindex="-1"])';

// Tab stops only: a button with tabIndex -1 (listbox options, roving radios) is focusable but not tabbable
const tabbables = (root) =>
  [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.tabIndex >= 0 && (el.offsetParent !== null || el === document.activeElement));

const stack = [];
export const isTopTrap = (ref) => stack.length > 0 && stack[stack.length - 1] === ref;

export function useFocusTrap(ref, active, { focusFirst = false, restore = false, focusKey } = {}) {
  // remember/restore the previous focus only on activation changes
  useEffect(() => {
    if (!active || !restore) return;
    const previous = document.activeElement;
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [active, restore]);

  // stack membership follows activation only (not focusKey changes)
  useEffect(() => {
    if (!active) return;
    stack.push(ref);
    return () => {
      const i = stack.lastIndexOf(ref);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [ref, active]);

  useEffect(() => {
    if (!active) return;
    // after the overlay's enter animation has mounted its controls
    const timer = focusFirst
      ? setTimeout(() => {
          const el = ref.current;
          if (el && !el.contains(document.activeElement) && isTopTrap(ref)) {
            (el.querySelector("[data-autofocus]") || tabbables(el)[0])?.focus({ preventScroll: true });
          }
        }, 30)
      : 0;
    const onKey = (e) => {
      if (e.key !== "Tab" || !ref.current || !isTopTrap(ref)) return;
      const els = tabbables(ref.current);
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      // outside the trap, or on a non-tabbable element inside it (the dialog itself, a listbox): wrap explicitly
      const inside = els.includes(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, active, focusFirst, focusKey]);
}
