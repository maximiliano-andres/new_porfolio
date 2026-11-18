/* Interactive terminal: commands, autocomplete, suggestions and easter eggs. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Users } from "lucide-react";
import { useAudience, useLang, useSystem, useT } from "../app/context.js";
import { useContent } from "../data/useContent.js";
import { norm } from "../lib/env.js";
import { HR_ACCENT, LANG } from "../styles/theme.js";

const TERMINAL_OPEN_ALIASES = {
  about: "about", sobre: "about", rrhh: "hr", hr: "hr", ficha: "hr", skills: "skills", competencias: "skills",
  proyectos: "projects", projects: "projects", logros: "projects", experiencia: "experience", experience: "experience",
  trayectoria: "experience", career: "experience", educacion: "education", education: "education", formacion: "education",
  certificaciones: "education", certs: "education", contacto: "contact", contact: "contact", insignias: "badges", badges: "badges",
  simulador: "simulator", simulator: "simulator", cv: "cv", curriculum: "cv", hobbies: "hobbies", pasatiempos: "hobbies",
  notas: "notes", notes: "notes", guia: "notes", guide: "notes", sitio: "site", site: "site", stack: "site",
};

const TERMINAL_COMMANDS = [
  "help", "about", "skills", "experience", "neofetch", "clear", "notify", "ls", "open ", "ti", "rrhh",
  "tour", "recorrido", "walkthrough", "simular", "cv", "sound on", "sound off", "whoami", "date", "exit", "hobbies", "lang en", "lang es",
];

const TERMINAL_SUGGESTIONS = {
  ti: ["help", "neofetch", "ls", "open proyectos", "open sitio", "simular", "sudo contratar"],
  rrhh: ["help", "about", "open rrhh", "hobbies", "recorrido", "simular"],
};

// same suggestions with their English spelling (both spellings always work)
const SUGGESTION_EN = { "open proyectos": "open projects", "open sitio": "open site", "open rrhh": "open hr", recorrido: "walkthrough", "sudo contratar": "sudo hire" };

// the log is bounded so a long session can't grow memory (or render cost) without limit;
// every line gets a stable id, so trimming the head doesn't re-render the 300 remaining nodes
const MAX_LINES = 300;
const MAX_CMD_HISTORY = 100;
let lineSeq = 0;
const withIds = (lines) => lines.map((l) => (l.id ? l : { ...l, id: ++lineSeq }));
const capped = (lines) => {
  const next = withIds(lines);
  return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
};
// own keys only: `open constructor` must not resolve to Object.prototype members
const aliasFor = (name) => (Object.hasOwn(TERMINAL_OPEN_ALIASES, name) ? TERMINAL_OPEN_ALIASES[name] : null);

/* about / skills / experience come from data/content*.js: the terminal never repeats the CV by hand */
const ABOUT_LINES = ({ TECH_GROUPS, EXPERIENCE }, t) => {
  const langs = TECH_GROUPS.find((g) => g.id === "lang")?.items ?? [];
  const frameworks = TECH_GROUPS.find((g) => g.id === "backend")?.items ?? [];
  return [
    { text: t("PERFIL PROFESIONAL:", "PROFESSIONAL PROFILE:"), type: "accent" },
    { text: `${EXPERIENCE[0]?.role ?? "Backend Developer"} · ${EXPERIENCE.map((e) => e.company).join(" · ")}`, type: "info" },
    { text: t(`Lenguajes: ${langs.join(", ")}. Frameworks y arquitectura: ${frameworks.join(", ")}.`, `Languages: ${langs.join(", ")}. Frameworks and architecture: ${frameworks.join(", ")}.`), type: "info" },
    { text: t("Especialidad: optimización de rendimiento (tiempos de respuesta, CPU y memoria).", "Specialty: performance optimization (response times, CPU and memory)."), type: "info" },
    { text: t("Inglés intermedio (B1–B2) · disponibilidad inmediata · remoto o presencial.", "Intermediate English (B1–B2) · available now · remote or on-site."), type: "info" },
    { text: t("Escribe 'experience' para ver resultados medidos o 'open about' para el perfil completo.", "Type 'experience' for measured results or 'open about' for the full profile."), type: "info" },
  ];
};
const SKILLS_LINES = ({ TECH_GROUPS }, t) => [
  { text: t("TECNOLOGÍAS PRINCIPALES:", "MAIN TECHNOLOGIES:"), type: "accent" },
  ...TECH_GROUPS.map((g) => ({ text: `  - ${g.label}: ${g.items.join(", ")}`, type: "info" })),
];
const EXPERIENCE_LINES = ({ EXPERIENCE }, t) => [
  { text: t("TRAYECTORIA LABORAL:", "WORK HISTORY:"), type: "accent" },
  ...EXPERIENCE.flatMap((e) => [
    { text: `  - ${e.role} · ${e.company} [${e.period}]`, type: "info" },
    ...e.bullets.slice(0, 2).map((b) => ({ text: `    * ${b}`, type: "info" })),
  ]),
];

export function TerminalContent({ onTriggerNotification, onOpenHR }) {
  const { audience, setAudience } = useAudience();
  const { lang, setLang } = useLang();
  const t = useT();
  const C = useContent();
  const sys = useSystem();
  const execCount = useRef(0);
  const [matrix, setMatrix] = useState(false);
  const matrixCols = useMemo(
    () => (matrix ? Array.from({ length: 24 }, () => ({
      chars: Array.from({ length: 28 }, () => String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96))).join(""),
      dur: 1 + Math.random() * 1.4,
      delay: Math.random() * 0.8,
    })) : []),
    [matrix]
  );
  const [history, setHistory] = useState(() => withIds([
    { text: "Max OS [Version 1.0.0]", type: "info" },
    { text: t("Escribe 'help' para ver los comandos disponibles.", "Type 'help' to see the available commands."), type: "info" },
    { text: "", type: "info" },
  ]));
  const [inputVal, setInputVal] = useState("");
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  // only grab focus on mouse devices — on touch it would pop the keyboard over the window
  const finePointer = useMemo(() => window.matchMedia("(pointer: fine)").matches, []);

  // scroll only the log itself; scrollIntoView would also scroll every ancestor (incl. the page)
  const scrollToEnd = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(scrollToEnd, [history]);

  // delayed effects (matrix rain, opening Contact) are cancelled if the terminal closes first
  const timers = useRef(new Set());
  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.current.delete(t); fn(); }, ms);
    timers.current.add(t);
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // the matrix rain has its own timer: running it again restarts the 2.6 s instead of ending early
  const matrixTimer = useRef(0);
  useEffect(() => () => clearTimeout(matrixTimer.current), []);

  // commands that reach the rest of the app (windows, tours, audience) and the easter eggs
  const extraCommand = (cmd, arg) => {
    const egg = (lines) => { sys.unlock("curious"); return lines; };
    switch (cmd) {
      case "open":
      case "abrir": {
        const id = aliasFor(arg.split(" ")[0]);
        if (!id) return [{ text: t("Uso: open <sección> · ej: open proyectos, open rrhh, open hobbies (escribe 'ls' para verlas)", "Usage: open <section> · e.g. open projects, open hr, open hobbies (type 'ls' to list them)"), type: "error" }];
        sys.openWindow(id);
        return [{ text: `${t("Abriendo", "Opening")} ${arg}…`, type: "info" }];
      }
      case "ls":
        return lang === "en" ? [
          { text: "about/  hr/  skills/  projects/  experience/  education/  hobbies/", type: "accent" },
          { text: "contact/  simulator/  badges/  cv/  notes/  site/", type: "accent" },
          { text: "Tip: 'open <name>' opens any of them.", type: "info" },
        ] : [
          { text: "about/  rrhh/  skills/  proyectos/  experiencia/  formacion/  hobbies/", type: "accent" },
          { text: "contacto/  simulador/  insignias/  cv/  notas/  sitio/", type: "accent" },
          { text: "Tip: 'open <nombre>' abre cualquiera.", type: "info" },
        ];
      case "hobbies":
        sys.openWindow("hobbies");
        return [{ text: t("Abriendo hobbies: natación, mountain bike y estudio constante…", "Opening hobbies: swimming, mountain biking and constant learning…"), type: "info" }];
      case "lang":
      case "idioma":
        if (arg !== "es" && arg !== "en") return [{ text: t("Uso: lang es | lang en", "Usage: lang es | lang en"), type: "error" }];
        setLang(arg);
        return "handled";
      case "ti":
      case "rrhh":
        setAudience(cmd);
        return [{ text: t(`Perfil cambiado a ${cmd.toUpperCase()}.`, `Profile switched to ${cmd === "ti" ? "TECH" : "HR"}.`), type: "info" }];
      case "tour":
        sys.startCoachTour();
        return [{ text: t("Iniciando tour guiado…", "Starting the guided tour…"), type: "info" }];
      case "recorrido":
      case "walkthrough":
        sys.startAutoTour();
        return [{ text: t("Iniciando recorrido de 60 segundos…", "Starting the 60-second walkthrough…"), type: "info" }];
      case "cv":
      case "curriculum":
        sys.openWindow("cv");
        return [{ text: t("Abriendo el CV (también puedes descargarlo en PDF)…", "Opening the CV (you can also download the PDF)…"), type: "info" }];
      case "simular":
      case "simulate":
        sys.openWindow("simulator");
        return [{ text: t("Abriendo el simulador de optimización…", "Opening the optimization simulator…"), type: "info" }];
      case "sound":
      case "sonido":
        if (arg !== "on" && arg !== "off") return [{ text: t("Uso: sound on | sound off", "Usage: sound on | sound off"), type: "error" }];
        sys.setSoundOn(arg === "on");
        return [{ text: arg === "on" ? t("Sonidos activados.", "Sounds on.") : t("Sonidos desactivados.", "Sounds off."), type: "info" }];
      case "whoami":
        return [{ text: audience === "rrhh" ? t("visitante@rrhh — explorando el perfil en lenguaje de negocio", "visitor@hr — exploring the profile in business language") : t("visitante@ti — explorando el stack técnico", "visitor@tech — exploring the technical stack"), type: "info" }];
      case "date":
        return [{ text: new Date().toLocaleString(t("es-CL", "en-US")), type: "info" }];
      case "exit":
        sys.closeWindow("terminal");
        return "handled";
      case "sudo":
        if (arg.startsWith("contratar") || arg.startsWith("hire")) {
          later(() => sys.openWindow("contact"), 1100);
          return egg([
            { text: t("[sudo] verificando candidato…", "[sudo] checking candidate…"), type: "info" },
            { text: t("  ✔ disponibilidad: inmediata", "  ✔ availability: immediate"), type: "accent" },
            { text: t("  ✔ rendimiento: optimizado", "  ✔ performance: optimized"), type: "accent" },
            { text: t("  🎉 ¡Excelente decisión! Abriendo Contacto…", "  🎉 Great call! Opening Contact…"), type: "accent" },
          ]);
        }
        return [{ text: t("sudo: permiso concedido solo para 'sudo contratar' 😉", "sudo: permission granted only for 'sudo hire' 😉"), type: "error" }];
      case "matrix":
        setMatrix(true);
        clearTimeout(matrixTimer.current);
        matrixTimer.current = setTimeout(() => setMatrix(false), 2600);
        return egg([{ text: "Wake up, Neo…", type: "accent" }]);
      case "coffee":
      case "cafe":
        return egg([
          { text: "    ( (", type: "accent", art: true },
          { text: "     ) )", type: "accent", art: true },
          { text: "  ........", type: "accent", art: true },
          { text: "  |      |]", type: "accent", art: true },
          { text: "  \\      /", type: "accent", art: true },
          { text: "   `----'", type: "accent", art: true },
          { text: t("Café listo en 0.3 s — hasta el café está optimizado.", "Coffee ready in 0.3 s — even the coffee is optimized."), type: "info" },
        ]);
      case "rm":
        if (arg.includes("-rf")) return egg([{ text: t("rm: operación bloqueada. Este sistema está optimizado, no destruido 😉", "rm: operation blocked. This system is optimized, not destroyed 😉"), type: "error" }]);
        return null;
      default:
        return null;
    }
  };

  const handleCommand = (e) => {
    e.preventDefault();
    runCommand(inputVal);
  };

  const runCommand = (raw) => {
    const inputVal = raw;
    const cmdClean = inputVal.trim().toLowerCase();
    const newHistory = [...history, { text: `mc-portfolio$ ${inputVal}`, type: "command" }];

    if (inputVal.trim()) {
      setCmdHistory((prev) => [...prev, inputVal.trim()].slice(-MAX_CMD_HISTORY));
    }
    setHistoryIndex(-1);

    if (!cmdClean) {
      setHistory(capped(newHistory));
      setInputVal("");
      return;
    }

    execCount.current += 1;
    if (execCount.current >= 3) sys.unlock("hacker");
    const [cmd, ...args] = norm(cmdClean).split(/\s+/);
    const extra = extraCommand(cmd, args.join(" "));
    if (extra === "handled") return;
    if (extra) {
      setHistory(capped([...newHistory, ...extra]));
      setInputVal("");
      return;
    }

    let reply = [];
    // switch on the normalized command: arguments ("skills --all") or accents don't break it
    switch (cmd) {
      case "help":
        reply = (lang === "en" ? [
          "Available commands:",
          "  ls / open <section> - List and open sections (e.g. open projects)",
          "  ti | rrhh    - Switch the reading profile (Tech / HR)",
          "  lang es|en   - Switch the language",
          "  tour         - Guided tour of the interface",
          "  walkthrough  - Automatic 60-second walkthrough",
          "  simular      - Open the optimization simulator",
          "  hobbies      - Swimming, mountain biking and constant learning",
          "  sound on|off - Turn sounds on or off",
          "  cv           - Open my CV (view and download the PDF)",
          "  whoami / date / exit",
          "  neofetch     - System info, ASCII style",
          "  about        - Professional profile",
          "  skills       - Tech stack",
          "  experience   - Work history",
          "  clear        - Clear the screen",
          "  notify       - Send a test notification",
        ] : [
          "Comandos disponibles:",
          "  ls / open <sección> - Lista y abre secciones (ej: open proyectos)",
          "  ti | rrhh    - Cambia el perfil de lectura",
          "  lang es|en   - Cambia el idioma",
          "  tour         - Tour guiado por la interfaz",
          "  recorrido    - Recorrido automático de 60 segundos",
          "  simular      - Abre el simulador de optimización",
          "  hobbies      - Natación, mountain bike y estudio constante",
          "  sound on|off - Activa o desactiva los sonidos",
          "  cv           - Abre mi CV (ver y descargar en PDF)",
          "  whoami / date / exit",
          "  neofetch     - Muestra info del sistema en estilo ASCII",
          "  about        - Muestra el perfil profesional",
          "  skills       - Muestra el stack tecnológico",
          "  experience   - Muestra la trayectoria laboral",
          "  clear        - Limpia la pantalla",
          "  notify       - Envía una notificación de prueba",
        ]).map((text) => ({ text, type: "info" }));
        break;
      case "notify":
        if (onTriggerNotification) {
          onTriggerNotification();
          reply = [{ text: t("Notificación manual enviada.", "Test notification sent."), type: "info" }];
        } else {
          reply = [{ text: t("Error: Sistema de notificación no enlazado.", "Error: notification system not connected."), type: "error" }];
        }
        break;
      case "clear":
        setHistory([]);
        setInputVal("");
        return;
      case "neofetch":
        reply = [
          { text: "      ███╗   ███╗ ██████╗", type: "accent", art: true },
          { text: "      ████╗ ████║██╔════╝", type: "accent", art: true },
          { text: "      ██╔████╔██║██║     ", type: "accent", art: true },
          { text: "      ██║╚██╔╝██║██║     ", type: "accent", art: true },
          { text: "      ██║ ╚═╝ ██║╚██████╗", type: "accent", art: true },
          { text: "      ╚═╝     ╚═╝ ╚══════╝", type: "accent", art: true },
          { text: "--------------------------", type: "info" },
          { text: "OS: Maximiliano Portfolio OS v1.0", type: "info" },
          { text: "Host: MacBook Air M5", type: "info" },
          { text: "Kernel: React / FastAPI Hybrid", type: "info" },
          { text: "Uptime: 2+ years (Experience)", type: "info" },
          { text: "Shell: zsh (optimization-mode)", type: "info" },
          { text: "Languages: ES (native) · EN (B1–B2)", type: "info" },
          { text: "CPU: High Performance Backend Dev", type: "info" },
          { text: "Primary Stacks: Java, Python, Node.js", type: "info" },
        ];
        break;
      case "about":
        reply = ABOUT_LINES(C, t);
        break;
      case "skills":
        reply = SKILLS_LINES(C, t);
        break;
      case "experience":
        reply = EXPERIENCE_LINES(C, t);
        break;
      default:
        reply = [{ text: t(`Comando no reconocido: '${cmdClean}'. Escribe 'help' para ver opciones.`, `Unknown command: '${cmdClean}'. Type 'help' to see the options.`), type: "error" }];
    }

    setHistory(capped([...newHistory, ...reply]));
    setInputVal("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.currentTarget.blur(); // a second Escape then closes the window (global shortcut)
      return;
    }
    if (e.key === "Tab") {
      const typed = norm(inputVal);
      if (!typed || e.shiftKey) return; // empty input or Shift+Tab: normal focus navigation
      const pool = [...TERMINAL_COMMANDS, ...Object.keys(TERMINAL_OPEN_ALIASES).map((k) => `open ${k}`)];
      const hits = [...new Set(pool.filter((c) => c.startsWith(typed) && c !== typed))];
      if (!hits.length) return; // nothing to complete: Tab moves the focus as usual
      e.preventDefault();
      if (hits.length === 1) setInputVal(hits[0]);
      else if (hits.length > 1) setHistory((h) => capped([...h, { text: hits.join("   "), type: "info" }]));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(cmdHistory[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex === cmdHistory.length - 1) {
        setHistoryIndex(-1);
        setInputVal("");
      } else {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    }
  };

  return (
    <>
    {audience === "rrhh" && (
      <div className="mb-3 shrink-0 rounded-lg border px-3 py-2.5 flex flex-wrap items-center justify-between gap-2" style={{ borderColor: `${HR_ACCENT}33`, background: `${HR_ACCENT}0b` }}>
        <p className="text-[11.5px] text-white/70 leading-5 min-w-0 flex-1 basis-[220px]">
          {t("Consola interactiva pensada para perfiles técnicos. Para un resumen en lenguaje simple:", "An interactive console meant for technical readers. For a plain-language summary:")}
        </p>
        <button
          onClick={onOpenHR}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
          style={{ background: HR_ACCENT, color: "#05070b" }}
        >
          <Users size={12} /> {t("Abrir ficha RRHH", "Open recruiter summary")}
        </button>
      </div>
    )}
    <div
      className="relative w-full flex-1 min-h-[240px] flex flex-col font-mono text-[11px] sm:text-[12px] bg-black/90 p-2.5 rounded-md overflow-hidden border"
      style={{ color: LANG.node.c2, borderColor: `${LANG.node.c1}33` }}
      onClick={() => {
        // selecting text to copy it must not jump to the end or move the focus
        if (window.getSelection?.()?.toString()) return;
        scrollToEnd();
        inputRef.current?.focus();
      }}
    >
      <div ref={scrollRef} role="log" aria-live="polite" aria-label={t("Salida de la terminal", "Terminal output")} className="flex-1 min-h-0 overflow-y-auto pr-1 select-text space-y-1" style={{ scrollbarWidth: "thin" }}>
        {history.map((line) => (
          <div
            key={line.id}
            aria-hidden={line.art || undefined}
            className={`whitespace-pre-wrap break-words ${line.type === "command"
                ? "text-white"
                : line.type === "accent"
                  ? "text-cyan-400 font-bold"
                  : line.type === "error"
                    ? "text-red-400"
                    : ""
              }`}
            style={line.type === "info" ? { color: `${LANG.node.c2}e6` } : undefined}
          >
            {line.text}
          </div>
        ))}
      </div>
      {matrix && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden bg-black/80" aria-hidden="true">
          {matrixCols.map((col, i) => (
            <span
              key={i}
              className="absolute top-0 text-[11px] leading-[13px] text-[#7CC576]"
              style={{ left: `${(i / matrixCols.length) * 100}%`, writingMode: "vertical-rl", animation: `matrixfall ${col.dur}s linear ${col.delay}s infinite`, textShadow: "0 0 6px #3C8C40" }}
            >
              {col.chars}
            </span>
          ))}
        </div>
      )}
      {/* one-tap commands so nobody needs to know what to type */}
      <div className="flex flex-wrap gap-1.5 mt-2 shrink-0" aria-label={t("Comandos sugeridos", "Suggested commands")}>
        {TERMINAL_SUGGESTIONS[audience].map((c) => (lang === "en" ? SUGGESTION_EN[c] ?? c : c)).map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => { e.stopPropagation(); runCommand(c); }}
            className="rounded-sm border px-1.5 py-1 text-[10.5px] text-white/70 hover:text-white hover:border-white/30 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
            style={{ borderColor: `${LANG.node.c1}44` }}
          >
            {c}
          </button>
        ))}
      </div>
      <form onSubmit={handleCommand} className="flex items-center mt-2 border-t pt-1.5 shrink-0" style={{ borderColor: `${LANG.node.c1}33` }}>
        <span className="text-white mr-1.5 shrink-0">mc-portfolio$</span>
        <input
          ref={inputRef}
          type="text"
          aria-label={t("Comando de terminal", "Terminal command")}
          maxLength={200}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="send"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 py-1 bg-transparent border-none outline-hidden text-white font-mono text-[16px] sm:text-[12px]"
          autoFocus={finePointer}
        />
      </form>
    </div>
    </>
  );
}
