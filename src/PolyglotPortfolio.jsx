/* App shell: owns window state, layout, audience, achievements, tours and keyboard shortcuts,
   and composes the components, windows and overlays from the modules below. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Code2, Compass, FolderGit2, Github, Hexagon, Linkedin, Mail, Play, Route, Sparkles, Trophy, User, Users, Volume2, VolumeX, Zap } from "lucide-react";
import { BootScreen } from "./components/BootScreen.jsx";
import { CircuitBackground } from "./components/CircuitBackground.jsx";
import { Dock } from "./components/Dock.jsx";
import { FloatingWindow } from "./components/FloatingWindow.jsx";
import { TopBar } from "./components/TopBar.jsx";
import { AudienceSwap, AudienceToggle } from "./components/ui.jsx";
import { AudienceContext, SystemContext } from "./context.js";
import { NOTIFICATION_MESSAGES, PROJECTS } from "./data/content.js";
import { AUDIENCES, HR_PROJECTS, PROFILE_NOTIFICATION } from "./data/hr.js";
import { ALL_ITEMS, DOCK_ITEMS, EXTRA_ITEMS, PROJECT_WIN_WIDTH, WINDOW_CIRCUIT } from "./data/system.js";
import { centeredPos, corePosition, deskArea, dockSpaceFor, isCompactViewport, makeInitialWindows, maximizedPos, tileWindows, uiScaleFor } from "./layout.js";
import { prefersReducedMotion } from "./lib/env.js";
import { sound } from "./lib/sound.js";
import { storage } from "./lib/storage.js";
import { AchievementToast } from "./overlays/AchievementToast.jsx";
import { AUTO_TOUR, AutoTourBar } from "./overlays/AutoTourBar.jsx";
import { CoachTour } from "./overlays/CoachTour.jsx";
import { CommandPalette } from "./overlays/CommandPalette.jsx";
import { CoreMenu } from "./overlays/CoreMenu.jsx";
import { CORE, HR_ACCENT, LANG, SOCIAL_LINKS } from "./theme.js";
import { BadgesContent } from "./windows/BadgesContent.jsx";
import { ContactContent } from "./windows/ContactContent.jsx";
import { SimulatorContent } from "./windows/SimulatorContent.jsx";
import { TerminalContent } from "./windows/TerminalContent.jsx";
import { AboutHRContent, CertificationsHRContent, ExperienceHRContent, HRSummaryContent, ProjectDetailHRContent, ProjectsHRContent, SkillsHRContent } from "./windows/hr.jsx";
import { AboutContent, CertificationsContent, EducationContent, ExperienceContent, ProjectDetailContent, ProjectsContent, SkillsContent } from "./windows/tech.jsx";

export default function PolyglotPortfolio() {
  const [booted, setBooted] = useState(false);
  const [windows, setWindows] = useState(makeInitialWindows());
  const [projectWin, setProjectWin] = useState({ open: false, id: null, z: 1, minimized: false, maximized: false });
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });
  const isMobile = isCompactViewport(windowSize);
  const uiScale = isMobile ? 1 : uiScaleFor(windowSize);
  const [autoTour, setAutoTour] = useState(null); // { steps, i, playing } while the 60 s walkthrough runs
  // narration bar height: up to 3 lines of text on phones, 1–2 on wider screens
  const tourBarSpace = autoTour ? (windowSize.width < 640 ? 100 : 74) : 0;
  const area = useMemo(() => deskArea(windowSize, isMobile, uiScale, tourBarSpace), [windowSize, isMobile, uiScale, tourBarSpace]);
  const zRef = useRef(10);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [coreOpen, setCoreOpen] = useState(false);
  const [hoveredDock, setHoveredDock] = useState(null);
  const [pulses, setPulses] = useState([]);
  const pulseKey = useRef(0);

  // sound (opt-in, persisted)
  const [soundOn, setSoundOnState] = useState(() => storage.get("sound") === "on");
  useEffect(() => { sound.setEnabled(soundOn); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const setSoundOn = useCallback((v) => {
    setSoundOnState(v);
    storage.set("sound", v ? "on" : "off");
    sound.setEnabled(v);
    sound.play("toggle");
  }, []);

  // achievements + exploration progress (persisted). Refs make unlock() idempotent and side-effect safe.
  const readSet = (key) => { try { return new Set(JSON.parse(storage.get(key) || "[]")); } catch { return new Set(); } };
  const [unlocked, setUnlocked] = useState(() => readSet("achievements"));
  const [visited, setVisited] = useState(() => readSet("visited"));
  const unlockedRef = useRef(unlocked);
  const visitedRef = useRef(visited);
  const [achQueue, setAchQueue] = useState([]);
  const unlock = useCallback((id) => {
    if (unlockedRef.current.has(id)) return;
    const next = new Set(unlockedRef.current).add(id);
    unlockedRef.current = next;
    setUnlocked(next);
    storage.set("achievements", JSON.stringify([...next]));
    setAchQueue((q) => [...q, id]);
    sound.play("achieve");
  }, []);
  const popAchievement = useCallback(() => setAchQueue((q) => q.slice(1)), []);
  const resetProgress = useCallback(() => {
    unlockedRef.current = new Set();
    visitedRef.current = new Set();
    setUnlocked(new Set());
    setVisited(new Set());
    storage.set("achievements", "[]");
    storage.set("visited", "[]");
  }, []);
  const progress = Math.round((visited.size / DOCK_ITEMS.length) * 100);
  const boundsRef = useRef(null);

  const [activeToast, setActiveToast] = useState(null);
  const profileToastPending = useRef(false);

  // audience: ?vista=rrhh (shareable link for recruiters) > last choice > technical view
  const [audience, setAudienceState] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("vista");
    if (fromUrl === "rrhh" || fromUrl === "ti") return fromUrl;
    return storage.get("audience") === "rrhh" ? "rrhh" : "ti";
  });
  const audienceRef = useRef(audience);
  // opts.silent: the boot screen's first pick is a choice, not a "switch" worth a badge
  const setAudience = useCallback((next, opts = {}) => {
    if (next !== audienceRef.current && !opts.silent) unlockRef.current("polyglot");
    audienceRef.current = next;
    setAudienceState(next);
    storage.set("audience", next);
    storage.set("audience_chosen", "1");
    const url = new URL(window.location.href);
    if (next === "rrhh") url.searchParams.set("vista", "rrhh");
    else url.searchParams.delete("vista");
    window.history.replaceState(null, "", url);
  }, []);
  const audienceCtx = useMemo(() => ({ audience, setAudience }), [audience, setAudience]);
  const unlockRef = useRef(unlock);

  useEffect(() => {
    if (!booted) return;

    let msgIndex = 0;
    const firstVisit = !storage.get("tour_seen");
    const firstTimeout = setTimeout(() => {
      if (firstVisit) {
        setCoachOpen(true);
        return;
      }
      setActiveToast(NOTIFICATION_MESSAGES[0]);
      profileToastPending.current = !storage.get("audience_chosen");
      msgIndex = 1;
    }, firstVisit ? 900 : 3000);

    const interval = setInterval(() => {
      setActiveToast(NOTIFICATION_MESSAGES[msgIndex]);
      msgIndex = (msgIndex + 1) % NOTIFICATION_MESSAGES.length;
    }, 300000); // 5 minutes

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, [booted]);

  useEffect(() => {
    if (!activeToast) {
      // the welcome guide just closed (auto or manually) → introduce the TI / RRHH profiles
      if (!profileToastPending.current) return;
      profileToastPending.current = false;
      const t = setTimeout(() => setActiveToast(PROFILE_NOTIFICATION), 700);
      return () => clearTimeout(t);
    }
    sound.play("notify");
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, activeToast.duration ?? 12000); // 12 seconds auto-dismiss by default
    return () => clearTimeout(timer);
  }, [activeToast]);

  const triggerNotification = useCallback(() => {
    const randomMsg = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
    setActiveToast(randomMsg);
  }, []);

  useEffect(() => {
    let frame = 0;
    const handleResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    // mobile browsers resize the visual viewport when the URL bar collapses
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  const windowPositions = useMemo(() => {
    const active = ALL_ITEMS.filter((it) => {
      const w = windows[it.id];
      return w && w.open && !w.minimized && !w.maximized;
    });
    return tileWindows(active, area, isMobile, uiScale);
  }, [windows, area, isMobile, uiScale]);

  const bringFront = useCallback((key) => {
    zRef.current += 1;
    if (key === "project") {
      setProjectWin((p) => ({ ...p, z: zRef.current }));
    } else {
      setWindows((w) => ({ ...w, [key]: { ...w[key], z: zRef.current } }));
    }
  }, []);

  const toggleWindow = useCallback((id) => {
    setWindows((w) => {
      const cur = w[id];
      if (!cur.open) {
        zRef.current += 1;
        return { ...w, [id]: { open: true, minimized: false, maximized: false, z: zRef.current } };
      }
      if (cur.minimized) {
        zRef.current += 1;
        return { ...w, [id]: { ...cur, minimized: false, z: zRef.current } };
      }
      
      const activeWindows = Object.entries(w).filter(([_, win]) => win.open && !win.minimized);
      const isFrontmost = activeWindows.length === 0 || cur.z === Math.max(...activeWindows.map(([_, win]) => win.z));

      if (isFrontmost) {
        return { ...w, [id]: { ...cur, minimized: true } };
      } else {
        zRef.current += 1;
        return { ...w, [id]: { ...cur, minimized: false, z: zRef.current } };
      }
    });
  }, []);

  // open (or restore and raise) without the dock's toggle-to-minimize behaviour
  const openWindow = useCallback((id) => {
    zRef.current += 1;
    setWindows((w) => ({ ...w, [id]: { ...w[id], open: true, minimized: false, z: zRef.current } }));
  }, []);

  const closeWindow = useCallback((id) => {
    setWindows((w) => ({ ...w, [id]: { ...w[id], open: false, minimized: false, maximized: false } }));
  }, []);
  const minimizeWindow = useCallback((id) => {
    setWindows((w) => ({ ...w, [id]: { ...w[id], minimized: !w[id].minimized } }));
  }, []);
  const maximizeWindow = useCallback((id) => {
    setWindows((w) => ({ ...w, [id]: { ...w[id], maximized: !w[id].maximized } }));
    bringFront(id);
  }, [bringFront]);

  const openProject = useCallback((id) => {
    zRef.current += 1;
    setProjectWin({ open: true, id, z: zRef.current, minimized: false, maximized: false });
    unlock("architect");
  }, [unlock]);

  /* ---- reactions to windows opening/closing: sound, circuit pulses, exploration, badges ---- */
  const firePulses = useCallback((ids) => {
    if (prefersReducedMotion()) return;
    const fresh = ids.filter((id) => WINDOW_CIRCUIT[id] !== undefined).map((id) => ({ key: ++pulseKey.current, idx: WINDOW_CIRCUIT[id] }));
    if (!fresh.length) return;
    setPulses((p) => [...p, ...fresh]);
    setTimeout(() => setPulses((p) => p.filter((x) => !fresh.includes(x))), 1300);
  }, []);
  const prevWindowsRef = useRef(windows);
  useEffect(() => {
    const prev = prevWindowsRef.current;
    prevWindowsRef.current = windows;
    const opened = [];
    let closed = false;
    for (const [id, w] of Object.entries(windows)) {
      const was = prev[id]?.open && !prev[id]?.minimized;
      const is = w.open && !w.minimized;
      if (is && !was) opened.push(id);
      if (was && !is) closed = true;
    }
    if (opened.length) {
      sound.play("open");
      firePulses(opened);
      unlock("first");
      if (opened.includes("hr")) unlock("recruiter");
    } else if (closed) {
      sound.play("close");
    }
    const newlyVisited = opened.filter((id) => DOCK_ITEMS.some((it) => it.id === id) && !visitedRef.current.has(id));
    if (newlyVisited.length) {
      const next = new Set(visitedRef.current);
      newlyVisited.forEach((id) => next.add(id));
      visitedRef.current = next;
      setVisited(next);
      storage.set("visited", JSON.stringify([...next]));
      if (next.size === DOCK_ITEMS.length) unlock("explorer");
    }
  }, [windows, unlock, firePulses]);
  useEffect(() => {
    if (projectWin.open && !projectWin.minimized) firePulses(["project-detail"]);
  }, [projectWin.open, projectWin.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- CORE hub, tours ---- */
  const openCore = useCallback(() => {
    setCoreOpen(true);
    unlock("core");
    sound.play("toggle");
  }, [unlock]);
  const closeCoach = useCallback(() => {
    setCoachOpen(false);
    storage.set("tour_seen", "1");
  }, []);
  const finishCoach = useCallback(() => {
    closeCoach();
    unlock("tourist");
  }, [closeCoach, unlock]);
  const startCoachTour = useCallback(() => {
    setPaletteOpen(false);
    setCoreOpen(false);
    setAutoTour(null);
    setCoachOpen(true);
  }, []);
  const startAutoTour = useCallback(() => {
    setActiveToast(null);
    profileToastPending.current = false;
    setCoachOpen(false);
    setPaletteOpen(false);
    setCoreOpen(false);
    setAutoTour({ steps: AUTO_TOUR[audienceRef.current], i: 0, playing: true });
  }, []);
  const stopAutoTour = useCallback(() => setAutoTour(null), []);
  const nextAutoStep = useCallback(() => setAutoTour((t) => (t ? { ...t, i: t.i + 1 } : t)), []);
  const toggleAutoPlay = useCallback(() => setAutoTour((t) => (t ? { ...t, playing: !t.playing } : t)), []);
  // each step: clear the desk, open its window (and the IACC case where relevant); past the last step → done
  useEffect(() => {
    if (!autoTour) return;
    if (autoTour.i >= autoTour.steps.length) {
      setAutoTour(null);
      unlock("tourist");
      return;
    }
    const st = autoTour.steps[autoTour.i];
    setWindows((w) => Object.fromEntries(Object.entries(w).map(([id, win]) => [id, { ...win, open: false, minimized: false, maximized: false }])));
    setProjectWin((p) => ({ ...p, open: false }));
    const t1 = setTimeout(() => openWindow(st.open), 280);
    const t2 = st.project ? setTimeout(() => openProject(st.project), 1700) : null;
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [autoTour?.i, autoTour?.steps]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- keyboard: Ctrl/⌘+K palette · 1–9 dock · Esc closes the front window · ? tour ---- */
  useEffect(() => {
    const onKey = (e) => {
      if (!booted) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        unlock("shortcut");
        return;
      }
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if (typing || paletteOpen || coachOpen || coreOpen || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "Escape") {
        if (autoTour) return stopAutoTour();
        const open = Object.entries(windows).filter(([, w]) => w.open && !w.minimized).map(([id, w]) => ({ id, z: w.z }));
        if (projectWin.open && !projectWin.minimized) open.push({ id: "project", z: projectWin.z });
        if (!open.length) return;
        const top = open.reduce((a, b) => (b.z > a.z ? b : a));
        if (top.id === "project") setProjectWin((p) => ({ ...p, open: false }));
        else closeWindow(top.id);
        unlock("shortcut");
      } else if (/^[1-9]$/.test(e.key)) {
        const it = DOCK_ITEMS[Number(e.key) - 1];
        if (it) { toggleWindow(it.id); unlock("shortcut"); }
      } else if (e.key === "?") {
        startCoachTour();
        unlock("shortcut");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [booted, paletteOpen, coachOpen, coreOpen, autoTour, windows, projectWin, unlock, toggleWindow, closeWindow, stopAutoTour, startCoachTour]);

  const hr = audience === "rrhh";
  // windows with two vocabularies cross-fade between them; contact/terminal keep their state (form input, history)
  const swap = (ti, rrhh) => <AudienceSwap key={audience}>{hr ? rrhh : ti}</AudienceSwap>;
  const contentFor = (id) => {
    switch (id) {
      case "about": return swap(<AboutContent />, <AboutHRContent />);
      case "hr": return <HRSummaryContent onOpen={openWindow} />;
      case "skills": return swap(<SkillsContent />, <SkillsHRContent />);
      case "projects": return swap(<ProjectsContent onOpenProject={openProject} />, <ProjectsHRContent onOpenProject={openProject} />);
      case "experience": return swap(<ExperienceContent />, <ExperienceHRContent />);
      case "education": return <EducationContent />;
      case "certifications": return swap(<CertificationsContent />, <CertificationsHRContent />);
      case "contact": return <ContactContent />;
      case "terminal": return <TerminalContent onTriggerNotification={triggerNotification} onOpenHR={() => openWindow("hr")} />;
      case "simulator": return <SimulatorContent />;
      case "badges": return <BadgesContent unlocked={unlocked} progress={progress} visitedCount={visited.size} totalSections={DOCK_ITEMS.length} onReset={resetProgress} />;
      default: return null;
    }
  };
  const dockItems = useMemo(
    () => DOCK_ITEMS.map((it) => ({ ...it, label: hr ? it.hrLabel || it.label : it.label })),
    [hr]
  );
  const allItems = useMemo(() => [...dockItems, ...EXTRA_ITEMS], [dockItems]);

  // phones: prev/next neighbours for the window switcher (only when 2+ windows are open)
  const openList = allItems.filter((it) => windows[it.id].open && !windows[it.id].minimized);
  const switcherFor = (id) => {
    if (!isMobile || openList.length < 2) return null;
    const i = openList.findIndex((it) => it.id === id);
    if (i < 0) return null;
    const at = (k) => openList[(k + openList.length) % openList.length];
    return { index: i, total: openList.length, prev: at(i - 1), next: at(i + 1) };
  };
  const switchTo = useCallback((id) => { bringFront(id); sound.play("click"); }, [bringFront]);

  const openCount = openList.length + (projectWin.open && !projectWin.minimized ? 1 : 0);
  const energized = [
    ...openList.map((it) => WINDOW_CIRCUIT[it.id]),
    ...(projectWin.open && !projectWin.minimized ? [WINDOW_CIRCUIT["project-detail"]] : []),
  ];

  const commands = useMemo(() => [
    ...dockItems.map((it, i) => ({
      id: `open-${it.id}`, group: "Secciones", label: it.label, Icon: it.IconCmp, color: it.accent, hint: String(i + 1),
      keywords: `${it.id} ${it.hrLabel || ""} abrir ver`, action: () => openWindow(it.id),
    })),
    { id: "simulator", group: "Experiencias", label: "Simulador de optimización", Icon: Zap, keywords: "juego optimizar proceso iacc simular", action: () => openWindow("simulator") },
    { id: "badges", group: "Experiencias", label: "Insignias y progreso", Icon: Trophy, color: HR_ACCENT, keywords: "logros progreso achievements explorar", action: () => openWindow("badges") },
    { id: "autotour", group: "Experiencias", label: "Recorrido guiado de 60 segundos", Icon: Route, color: HR_ACCENT, keywords: "tour presentacion resumen rapido", action: startAutoTour },
    { id: "coach", group: "Experiencias", label: "Tour por la interfaz", Icon: Compass, hint: "?", keywords: "ayuda guia tutorial como funciona", action: startCoachTour },
    { id: "core", group: "Experiencias", label: "Centro de control CORE", Icon: Hexagon, keywords: "nucleo menu modulos", action: openCore },
    {
      id: "mode", group: "Preferencias", label: hr ? "Cambiar a perfil TI (técnico)" : "Cambiar a perfil RRHH (negocio)",
      Icon: hr ? Code2 : Users, color: hr ? CORE : HR_ACCENT, keywords: "modo perfil lenguaje rrhh ti reclutador",
      action: () => setAudience(hr ? "ti" : "rrhh"),
    },
    { id: "sound", group: "Preferencias", label: soundOn ? "Desactivar sonidos" : "Activar sonidos", Icon: soundOn ? VolumeX : Volume2, keywords: "audio sonido silencio", action: () => setSoundOn(!soundOn) },
    { id: "linkedin", group: "Enlaces", label: "Abrir LinkedIn", Icon: Linkedin, color: "#0077b5", keywords: "perfil red", action: () => window.open(SOCIAL_LINKS.linkedin, "_blank", "noopener") },
    { id: "github", group: "Enlaces", label: "Abrir GitHub", Icon: Github, keywords: "codigo repositorios", action: () => window.open(SOCIAL_LINKS.github, "_blank", "noopener") },
    { id: "email", group: "Enlaces", label: "Enviar un email", Icon: Mail, keywords: "correo", action: () => { window.location.href = SOCIAL_LINKS.email; } },
  ].map((c) => ({ ...c, action: () => { unlock("navigator"); c.action(); } })),
  [dockItems, hr, soundOn, openWindow, startAutoTour, startCoachTour, openCore, setAudience, setSoundOn, unlock]);

  const systemCtx = useMemo(() => ({
    unlock, openWindow, openProject, startCoachTour, startAutoTour, closeWindow, soundOn, setSoundOn,
    openPalette: () => setPaletteOpen(true),
  }), [unlock, openWindow, openProject, startCoachTour, startAutoTour, closeWindow, soundOn, setSoundOn]);
  const core = corePosition(windowSize);

  const activeProject = PROJECTS.find((p) => p.id === projectWin.id);

  const heroBtn =
    "flex items-center justify-center gap-2 rounded-lg px-4 sm:px-5 py-2.5 2xl:py-3 text-[13.5px] 2xl:text-[15px] font-medium active:scale-[0.98] transition-all focus:outline-none whitespace-nowrap";

  return (
    <MotionConfig reducedMotion="user">
    <AudienceContext.Provider value={audienceCtx}>
    <SystemContext.Provider value={systemCtx}>
    <div className="relative w-full h-dvh overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes dashflow { to { stroke-dashoffset: -160; } }
        @keyframes matrixfall { from { transform: translateY(-100%); } to { transform: translateY(110%); } }
        @keyframes comet { from { stroke-dashoffset: 12; opacity: 1; } 85% { opacity: 1; } to { stroke-dashoffset: -100; opacity: 0; } }
        @keyframes corepulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
        }
      `}</style>

      <AnimatePresence>
        {!booted && <BootScreen onDone={() => setBooted(true)} onChoose={(id) => setAudience(id, { silent: true })} current={audience} />}
      </AnimatePresence>

      <CircuitBackground
        energized={energized}
        highlighted={hoveredDock ? WINDOW_CIRCUIT[hoveredDock] : null}
        pulses={pulses}
      />
      <TopBar
        scale={uiScale}
        openCount={openCount}
        progress={progress}
        onPalette={() => setPaletteOpen(true)}
        onBadges={() => openWindow("badges")}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn(!soundOn)}
      />

      {/* bounds container for draggable windows */}
      <div ref={boundsRef} className="absolute inset-0 z-10 pointer-events-none">

        {/* CORE: the hexagon of the background becomes a button (control hub). It sits under the hero,
            whose text is click-through, so the hexagon stays clickable wherever nothing interactive covers it */}
        {booted && (
          <button
            data-tour="core"
            onClick={openCore}
            aria-label="Abrir el centro de control CORE"
            title="Centro de control CORE"
            className="absolute pointer-events-auto rounded-full group focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus:outline-none short:hidden"
            style={{ left: core.x - core.r, top: core.y - core.r, width: core.r * 2, height: core.r * 2 }}
          >
            <span
              className="absolute inset-[14%] rounded-full opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: `0 0 40px ${CORE}55, inset 0 0 30px ${CORE}33` }}
            />
          </button>
        )}

        {/* hero — scrolls on its own when the screen is too short (landscape phones),
            and reserves room for the top bar and the dock so nothing overlaps */}
        <AnimatePresence>
          {booted && !Object.values(windows).some((w) => w.open && !w.minimized) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 overflow-y-auto overscroll-contain pointer-events-none short:pointer-events-auto"
              style={{ scrollbarWidth: "none" }}
            >
              <div
                className="min-h-full flex flex-col items-center justify-center px-5 sm:px-8 text-center"
                style={{ paddingTop: area.y + 8, paddingBottom: windowSize.height - area.y - area.h + 8 }}
              >
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] 2xl:text-[12px] mb-4 2xl:mb-6 short:mb-2"
                  style={{ borderColor: `${CORE}44`, color: CORE, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <Sparkles size={11} /> Disponible para nuevos proyectos
                </span>
                <h1
                  className="text-[28px] min-[380px]:text-[32px] sm:text-[44px] lg:text-[52px] 2xl:text-[64px] short:text-[26px] font-semibold text-white mb-3 2xl:mb-5 short:mb-2 leading-[1.1] max-w-4xl text-balance"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Maximiliano Andrés Caniullan Lefiñir
                </h1>
                <p className="text-[14px] sm:text-[16px] 2xl:text-[19px] leading-relaxed text-white/55 max-w-md sm:max-w-xl 2xl:max-w-2xl mb-6 2xl:mb-8 short:mb-4 short:text-[13.5px] text-pretty">
                  {hr ? (
                    <>Construyo la parte invisible de las aplicaciones —la que procesa cada solicitud de los usuarios— y me especializo en que <span className="text-white/85">funcione más rápido y cueste menos operar</span>. Resultados medidos en empresas como IACC, PUMA y GyG.</>
                  ) : (
                    <>Backend Developer enfocado en crear sistemas rápidos y eficientes usando <span style={{ color: LANG.java.c1 }}>Java / Spring Boot</span>, <span style={{ color: LANG.python.c2 }}>Python</span> y <span style={{ color: LANG.node.c2 }}>Node.js</span>. Especialista en optimización de rendimiento y reducción de costos en la nube.</>
                  )}
                </p>
                <div className="flex flex-col items-center gap-2 mb-6 short:mb-4 pointer-events-auto">
                  <span className="text-[10.5px] uppercase tracking-wider text-white/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Ver el portafolio como
                  </span>
                  <AudienceToggle variant="long" />
                </div>
                {/* 2×2 grid of equal buttons on phones, a single row from sm up */}
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-[340px] sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 sm:w-auto sm:max-w-none pointer-events-auto">
                  {hr ? (
                    <button
                      onClick={() => openWindow("hr")}
                      className={`${heroBtn} hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60`}
                      style={{ background: `linear-gradient(90deg, ${HR_ACCENT}, ${LANG.java.c1})`, color: "#05070b" }}
                    >
                      <Users size={14} /> Ficha para RRHH
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleWindow("projects")}
                      className={`${heroBtn} hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60`}
                      style={{ background: `linear-gradient(90deg, ${CORE}, ${LANG.node.c1})`, color: "#05070b" }}
                    >
                      <FolderGit2 size={14} /> Ver proyectos
                    </button>
                  )}
                  <button
                    onClick={() => toggleWindow("about")}
                    className={`${heroBtn} border border-white/15 text-white/80 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50`}
                  >
                    <User size={14} /> Sobre mí
                  </button>
                  <a
                    href={SOCIAL_LINKS.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${heroBtn} text-white hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60`}
                    style={{ background: "#0077b5" }}
                  >
                    <Linkedin size={15} /> LinkedIn
                  </a>
                  <a
                    href={SOCIAL_LINKS.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${heroBtn} border border-white/20 bg-black/40 text-white hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white/50`}
                  >
                    <Github size={15} /> GitHub
                  </a>
                  <button
                    onClick={startAutoTour}
                    className={`${heroBtn} col-span-2 sm:col-span-1 border hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50`}
                    style={{ borderColor: `${HR_ACCENT}66`, color: HR_ACCENT }}
                  >
                    <Play size={14} /> Recorrido de 60 s
                  </button>
                </div>
                <p className="mt-6 sm:mt-8 short:mt-4 text-[10.5px] 2xl:text-[12px] text-white/50 max-w-[300px] sm:max-w-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  explora desde el dock inferior o toca el núcleo <span style={{ color: CORE }}>CORE</span>
                  <span className="hidden sm:inline"> · pulsa <kbd className="text-white/70">Ctrl K</kbd> para buscar</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* portfolio windows */}
        <AnimatePresence>
          {booted && allItems.map((it) => {
            const w = windows[it.id];
            if (!w.open) return null;

            const pos = w.maximized
              ? maximizedPos(area)
              : windowPositions[it.id] || centeredPos(area, it.width, isMobile, uiScale);

            return (
              <FloatingWindow
                key={it.id}
                id={it.id}
                title={it.label}
                IconCmp={it.IconCmp}
                accent={it.accent}
                pos={pos}
                scale={uiScale}
                z={w.z}
                isMinimized={w.minimized}
                isMaximized={w.maximized}
                isMobile={isMobile}
                boundsRef={boundsRef}
                onClose={closeWindow}
                onMinimize={minimizeWindow}
                onMaximize={maximizeWindow}
                onFocus={() => bringFront(it.id)}
                switcher={switcherFor(it.id)}
                onSwitch={switchTo}
              >
                {contentFor(it.id)}
              </FloatingWindow>
            );
          })}
        </AnimatePresence>

        {/* project detail floating window */}
        <AnimatePresence>
          {booted && projectWin.open && activeProject && (
            <FloatingWindow
              key={`project-detail-${projectWin.id}`}
              id="project-detail"
              title={hr ? HR_PROJECTS[activeProject.id].title : activeProject.title}
              IconCmp={FolderGit2}
              accent={CORE}
              pos={projectWin.maximized ? maximizedPos(area) : centeredPos(area, PROJECT_WIN_WIDTH, isMobile, uiScale)}
              scale={uiScale}
              z={projectWin.z}
              isMinimized={projectWin.minimized}
              isMaximized={projectWin.maximized}
              isMobile={isMobile}
              boundsRef={boundsRef}
              onClose={() => setProjectWin((p) => ({ ...p, open: false }))}
              onMinimize={() => setProjectWin((p) => ({ ...p, minimized: !p.minimized }))}
              onMaximize={() => setProjectWin((p) => ({ ...p, maximized: !p.maximized }))}
              onFocus={() => bringFront("project")}
            >
              {swap(<ProjectDetailContent project={activeProject} />, <ProjectDetailHRContent project={activeProject} />)}
            </FloatingWindow>
          )}
        </AnimatePresence>
      </div>

      {booted && <Dock items={dockItems} windows={windows} onToggle={toggleWindow} onHover={setHoveredDock} scale={uiScale} />}

      <AnimatePresence>
        {coreOpen && (
          <CoreMenu
            open={coreOpen}
            onClose={() => setCoreOpen(false)}
            origin={core}
            area={area}
            items={allItems}
            onPick={(id) => { setCoreOpen(false); openWindow(id); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {autoTour && autoTour.i < autoTour.steps.length && (
          <AutoTourBar
            tour={autoTour}
            bottom={Math.round(dockSpaceFor(windowSize, uiScale)) + 6}
            onNext={nextAutoStep}
            onTogglePlay={toggleAutoPlay}
            onStop={stopAutoTour}
          />
        )}
      </AnimatePresence>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      <CoachTour open={coachOpen} onClose={closeCoach} onFinish={finishCoach} />

      <AnimatePresence>
        {achQueue[0] && <AchievementToast key={achQueue[0]} id={achQueue[0]} onDone={popAchievement} />}
      </AnimatePresence>

      {/* Toast Notification — on phones it sits just above the dock (58px tall + 8px gap) so it never
          covers a window's title bar and its close/minimize controls; top-right card on larger screens */}
      <AnimatePresence>
        {activeToast && !autoTour && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-[66px] sm:bottom-auto sm:top-14 inset-x-2 sm:inset-x-auto sm:right-4 z-[999] sm:w-[400px] short:w-[330px] short:max-h-[calc(100dvh-150px)] short:overflow-y-auto rounded-xl border p-3 sm:p-4 short:p-3 pointer-events-auto flex items-start gap-3 sm:gap-4 shadow-2xl select-none"
            style={{
              zoom: uiScale,
              background: "rgba(10,14,20,0.94)",
              backdropFilter: "blur(12px)",
              borderColor: `${activeToast.accent ?? CORE}33`,
              boxShadow: `0 10px 30px -10px rgba(0,0,0,0.5), 0 0 0 1px ${activeToast.accent ?? CORE}11`,
            }}
          >
            {/* Text area */}
            <div className="flex-1 min-w-0 pr-5 flex flex-col justify-center">
              <div className="text-[12.5px] font-semibold text-white/90 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {activeToast.title}
              </div>
              {activeToast.text && (
                <p className="text-[11.5px] text-white/70 leading-5">
                  {activeToast.text}
                </p>
              )}
              {activeToast.profiles && (
                <>
                  <ul className="space-y-1.5 mt-0.5">
                    {activeToast.profiles.map((pr) => {
                      const a = AUDIENCES.find((x) => x.id === pr.id);
                      return (
                        <li key={pr.id} className="flex gap-2 text-[11.5px] leading-5 text-white/70">
                          <a.Icon size={13} className="shrink-0 mt-[3px]" style={{ color: a.color }} />
                          <span><span className="font-medium" style={{ color: a.color }}>{pr.name}:</span> {pr.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {activeToast.profiles.map((pr) => {
                      const a = AUDIENCES.find((x) => x.id === pr.id);
                      const current = audience === pr.id;
                      return (
                        <button
                          key={pr.id}
                          onClick={() => { setAudience(pr.id); setActiveToast(null); }}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
                          style={current
                            ? { background: a.color, color: "#05070b" }
                            : { border: `1px solid ${a.color}55`, color: a.color }}
                        >
                          <a.Icon size={12} /> Ver como {a.label}{current && " ✓"}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-white/40 mt-2 short:hidden" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Puedes cambiarlo cuando quieras desde la barra superior.
                  </p>
                </>
              )}
            </div>

            {/* Image (right side, larger, no contour) */}
            <img
              src="/img/logo_max_andres.webp"
              alt=""
              onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
              className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 object-contain select-none self-center short:hidden"
            />

            {/* Close button (absolute top-right) */}
            <button
              onClick={() => setActiveToast(null)}
              className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white transition-colors text-[18px] leading-none focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
              aria-label="Cerrar notificación"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </SystemContext.Provider>
    </AudienceContext.Provider>
    </MotionConfig>
  );
}
