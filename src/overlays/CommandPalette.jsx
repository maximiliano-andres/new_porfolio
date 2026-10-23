/* Command palette (Ctrl/⌘ + K). */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";
import { norm } from "../lib/env.js";
import { CORE } from "../theme.js";

export function CommandPalette({ open, onClose, commands }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setSel(0);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  const results = useMemo(() => {
    const nq = norm(q);
    return commands.filter((c) => !nq || norm(`${c.label} ${c.keywords || ""} ${c.group}`).includes(nq));
  }, [q, commands]);

  useEffect(() => setSel(0), [q]);

  // keep the highlighted row visible without scrolling anything outside the list
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector(`[data-idx="${sel}"]`);
    if (!el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop - 8;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight + 8;
  }, [sel]);

  const run = (c) => {
    if (!c) return;
    onClose();
    c.action();
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((i) => (i + 1) % Math.max(1, results.length)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((i) => (i - 1 + results.length) % Math.max(1, results.length)); }
    else if (e.key === "Enter") { e.preventDefault(); run(results[sel]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  let lastGroup = null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[300] flex justify-center px-3 pt-[10dvh] short:pt-3"
          style={{ background: "rgba(3,5,9,0.6)", backdropFilter: "blur(4px)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Paleta de comandos"
            initial={{ y: -10, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: -10, scale: 0.98 }}
            className="w-full max-w-[560px] h-fit max-h-[min(520px,calc(100dvh-24px))] flex flex-col rounded-xl border overflow-hidden shadow-2xl"
            style={{ background: "rgba(10,14,20,0.97)", borderColor: `${CORE}33` }}
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10">
              <Search size={15} className="text-white/40 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="¿Qué quieres ver? Ej: contacto, logros, modo RRHH…"
                aria-label="Buscar comando"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={results[sel] ? `cmd-${results[sel].id}` : undefined}
                className="flex-1 min-w-0 bg-transparent outline-none text-[16px] sm:text-[14px] text-white placeholder:text-white/30"
              />
              <button onClick={onClose} className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40 hover:text-white focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                esc
              </button>
            </div>
            <div ref={listRef} id="palette-list" role="listbox" className="relative overflow-y-auto overscroll-contain py-1.5 min-h-0" style={{ scrollbarWidth: "thin" }}>
              {results.length === 0 && (
                <p className="px-4 py-6 text-center text-[12.5px] text-white/45">Sin resultados para «{q}»</p>
              )}
              {results.map((c, i) => {
                const header = c.group !== lastGroup ? c.group : null;
                lastGroup = c.group;
                const active = i === sel;
                return (
                  <React.Fragment key={c.id}>
                    {header && (
                      <div className="px-4 pt-2.5 pb-1 text-[10px] uppercase tracking-wider text-white/35" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{header}</div>
                    )}
                    <button
                      id={`cmd-${c.id}`}
                      data-idx={i}
                      role="option"
                      aria-selected={active}
                      onMouseMove={() => setSel(i)}
                      onClick={() => run(c)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left focus:outline-none"
                      style={{ background: active ? "rgba(255,255,255,0.06)" : "transparent" }}
                    >
                      <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: `${c.color || CORE}17`, color: c.color || CORE }}>
                        <c.Icon size={14} />
                      </span>
                      <span className="flex-1 min-w-0 text-[13px] text-white/85 truncate">{c.label}</span>
                      {c.hint && <span className="shrink-0 text-[10.5px] text-white/35" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.hint}</span>}
                      {active && <CornerDownLeft size={12} className="shrink-0 text-white/35 hidden sm:block" />}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="hidden sm:flex items-center gap-4 px-4 py-2 border-t border-white/10 text-[10px] text-white/35" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span>↑↓ navegar</span><span>↵ abrir</span><span>esc cerrar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
