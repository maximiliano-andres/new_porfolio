/* Draggable, minimizable, maximizable window that grows out of its dock icon. */
import { Suspense, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionBoundary, WindowSkeleton } from "./SectionBoundary.jsx";
import { AudienceToggle } from "./ui.jsx";

export function FloatingWindow({
  id, title, IconCmp, accent, pos, scale = 1,
  z, isMinimized, isMaximized, isMobile, boundsRef,
  onClose, onMinimize, onMaximize, onFocus, children,
  switcher = null, onSwitch,
}) {
  const collapsedHeight = 44;

  // vector from the window to its dock icon: windows grow out of the dock and shrink back into it
  const iconEl = typeof document !== "undefined" ? document.querySelector(`[data-dock-id="${id}"]`) : null;
  const toDock = (() => {
    if (!iconEl || typeof pos.left !== "number") return { x: 0, y: 40 };
    const r = iconEl.getBoundingClientRect();
    return { x: r.left + r.width / 2 - (pos.left + pos.width / 2), y: r.top + r.height / 2 - (pos.top + 80) };
  })();

  // phones: swipe the title bar sideways to move between open windows
  const onPanEnd = (_, info) => {
    if (!switcher || Math.abs(info.offset.x) < 60 || Math.abs(info.offset.y) > 40) return;
    onSwitch(info.offset.x < 0 ? switcher.next.id : switcher.prev.id);
  };
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // a new layout slot discards any manual drag offset
  useEffect(() => {
    x.set(0);
    y.set(0);
  }, [pos.left, pos.top, x, y]);

  // 12px traffic lights get an invisible 28px hit area for touch
  const dotCls =
    "relative w-3 h-3 rounded-full hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none after:absolute after:-inset-2 after:content-['']";

  return (
    <motion.div
      data-win={id}
      layout="position"
      drag={!isMobile && !isMaximized}
      dragMomentum={false}
      dragConstraints={boundsRef}
      dragElastic={0}
      onPointerDown={onFocus}
      initial={{ opacity: 0, scale: 0.15, x: toDock.x, y: toDock.y }}
      animate={{
        opacity: isMinimized ? 0 : 1,
        scale: isMinimized ? 0.1 : 1,
        x: isMinimized ? toDock.x : 0,
        y: isMinimized ? toDock.y : 0,
        height: isMinimized ? collapsedHeight : pos.height ?? "auto",
      }}
      exit={{ opacity: 0, scale: 0.12, x: toDock.x, y: toDock.y, transition: { duration: 0.28, ease: [0.4, 0, 0.6, 1] } }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className="pointer-events-auto absolute rounded-xl border shadow-2xl overflow-hidden flex flex-col"
      style={{
        x,
        y,
        left: pos.left,
        top: pos.top,
        width: pos.width,
        maxHeight: pos.maxHeight,
        pointerEvents: isMinimized ? "none" : "auto",
        zIndex: z,
        background: "rgba(13,17,23,0.92)",
        backdropFilter: "blur(14px)",
        borderColor: `${accent}33`,
        boxShadow: `0 20px 60px -15px rgba(0,0,0,0.6), 0 0 0 1px ${accent}14`,
      }}
    >
      {/* title bar */}
      <motion.div
        onPanEnd={isMobile && switcher ? onPanEnd : undefined}
        className="flex items-center gap-2 px-3 py-2.5 border-b select-none shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)", cursor: isMobile || isMaximized ? "default" : "grab", zoom: scale, touchAction: isMobile ? "pan-y" : undefined }}
      >
        <div className="flex items-center gap-2.5 sm:gap-1.5 mr-1" onPointerDown={(e) => e.stopPropagation()}>
          <button aria-label={`Cerrar ${title}`} onClick={() => onClose(id)} className={`${dotCls} bg-[#ff5f56]`} />
          <button aria-label={`Minimizar ${title}`} onClick={() => onMinimize(id)} className={`${dotCls} bg-[#ffbd2e]`} />
          <button aria-label={`Maximizar ${title}`} onClick={() => onMaximize(id)} className={`${dotCls} bg-[#27c93f]`} />
        </div>
        <IconCmp size={13} style={{ color: accent }} />
        <span
          className="text-[12.5px] font-medium text-white/85 truncate min-w-0"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {title}
        </span>
        <div className="ml-auto pl-2 shrink-0">
          <AudienceToggle />
        </div>
      </motion.div>
      {isMobile && switcher && !isMinimized && (
        <div className="flex items-center justify-between gap-2 px-2 py-1 border-b border-white/[0.06] shrink-0 text-[10.5px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <button onClick={() => onSwitch(switcher.prev.id)} className="inline-flex items-center gap-1 min-w-0 rounded-md px-1.5 py-1.5 text-white/55 active:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none" aria-label={`Ir a ${switcher.prev.label}`}>
            <ChevronLeft size={13} className="shrink-0" /><span className="truncate">{switcher.prev.label}</span>
          </button>
          <span className="shrink-0 text-white/35">{switcher.index + 1} / {switcher.total} · desliza</span>
          <button onClick={() => onSwitch(switcher.next.id)} className="inline-flex items-center gap-1 min-w-0 rounded-md px-1.5 py-1.5 text-white/55 active:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none" aria-label={`Ir a ${switcher.next.label}`}>
            <span className="truncate">{switcher.next.label}</span><ChevronRight size={13} className="shrink-0" />
          </button>
        </div>
      )}
      {!isMinimized && (
        // @container: window contents respond to the window's width, not the viewport's
        <div
          className="@container flex flex-col overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5 flex-1 min-h-0"
          style={{ scrollbarWidth: "thin", zoom: scale }}
        >
          {/* cap line length when a window is maximized on wide screens */}
          <div className="w-full max-w-[1080px] mx-auto flex flex-col flex-1">
            <SectionBoundary name={title}>
              <Suspense fallback={<WindowSkeleton />}>{children}</Suspense>
            </SectionBoundary>
          </div>
        </div>
      )}
    </motion.div>
  );
}
