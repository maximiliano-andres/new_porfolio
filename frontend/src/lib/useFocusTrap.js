/* Keyboard focus trap for modal overlays (WCAG 2.4.3): Tab / Shift+Tab cycle inside `ref`.
   - focusFirst: moves focus into the container when it activates (or when `focusKey` changes)
   - restore: gives focus back to the element that had it before, when it deactivates */
import { useEffect } from "react";

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),select,[tabindex]:not([tabindex="-1"])';

export function useFocusTrap(ref, active, { focusFirst = false, restore = false, focusKey } = {}) {
  // remember/restore the previous focus only on activation changes
  useEffect(() => {
    if (!active || !restore) return;
    const previous = document.activeElement;
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [active, restore]);

  useEffect(() => {
    if (!active) return;
    // after the overlay's enter animation has mounted its controls
    const timer = focusFirst
      ? setTimeout(() => {
          const el = ref.current;
          if (el && !el.contains(document.activeElement)) el.querySelector(FOCUSABLE)?.focus({ preventScroll: true });
        }, 30)
      : 0;
    const onKey = (e) => {
      if (e.key !== "Tab" || !ref.current) return;
      const els = [...ref.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      const inside = ref.current.contains(document.activeElement);
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
