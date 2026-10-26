/* Bottom dock: one button per section, numbered shortcuts, hover feeds the circuit. */
import { memo } from "react";
import { circuit } from "../lib/circuitStore.js";
import { prefetchWindow } from "../windows/lazy.js";

// hovering/focusing an icon lights its circuit trace and preloads the window's code
const hoverOn = (id) => { circuit.hover(id); prefetchWindow(id); };
const hoverOff = () => circuit.hover(null);
export const Dock = memo(function Dock({ items, windows, onToggle, scale = 1 }) {
  return (
    <nav
      data-tour="dock"
      aria-label="Navegación principal"
      className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-0 min-[380px]:gap-0.5 sm:gap-1.5 p-1 min-[360px]:p-1.5 sm:p-2 rounded-2xl border pointer-events-auto max-w-[calc(100vw-12px)]"
      style={{
        zoom: scale,
        background: "rgba(10,14,20,0.85)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 12px 40px -10px rgba(0,0,0,0.6)",
      }}
    >
      {items.map((it, i) => {
        const w = windows[it.id];
        const active = w?.open && !w?.minimized;
        return (
          <button
            key={it.id}
            data-dock-id={it.id}
            onClick={() => onToggle(it.id)}
            onPointerEnter={() => hoverOn(it.id)}
            onPointerLeave={hoverOff}
            onFocus={() => hoverOn(it.id)}
            onBlur={hoverOff}
            aria-label={it.label}
            aria-keyshortcuts={String(i + 1)}
            aria-pressed={active}
            className="group relative flex flex-col items-center justify-center w-8 h-8 min-[360px]:w-9 min-[360px]:h-9 sm:w-11 sm:h-11 shrink-0 rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none hover:-translate-y-1"
            style={{
              background: active ? `${it.accent}22` : "transparent",
            }}
            title={`${it.label} (${i + 1})`}
          >
            <it.IconCmp
              size={18}
              style={{ color: active ? it.accent : "rgba(255,255,255,0.65)" }}
            />
            <span
              className="absolute -top-1 sm:-top-1.5 w-1 h-1 rounded-full"
              style={{ background: w?.open ? it.accent : "transparent" }}
            />
            <span
              className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
              style={{
                background: "rgba(10,14,20,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.85)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {it.label} <span className="text-white/40">{i + 1}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
});
