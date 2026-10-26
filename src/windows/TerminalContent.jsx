/* Interactive terminal: commands, autocomplete, suggestions and easter eggs. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Users } from "lucide-react";
import { useAudience, useSystem } from "../context.js";
import { norm } from "../lib/env.js";
import { HR_ACCENT, LANG } from "../theme.js";

const TERMINAL_OPEN_ALIASES = {
  about: "about", sobre: "about", rrhh: "hr", hr: "hr", ficha: "hr", skills: "skills", competencias: "skills",
  proyectos: "projects", projects: "projects", logros: "projects", experiencia: "experience", experience: "experience",
  trayectoria: "experience", educacion: "education", education: "education", certificaciones: "certifications",
  certs: "certifications", contacto: "contact", contact: "contact", insignias: "badges", badges: "badges",
  simulador: "simulator", simulator: "simulator",
};

const TERMINAL_COMMANDS = [
  "help", "about", "skills", "experience", "neofetch", "clear", "notify", "ls", "open ", "ti", "rrhh",
  "tour", "recorrido", "simular", "sound on", "sound off", "whoami", "date", "exit",
];

const TERMINAL_SUGGESTIONS = {
  ti: ["help", "neofetch", "ls", "open proyectos", "simular", "sudo contratar"],
  rrhh: ["help", "about", "open rrhh", "recorrido", "simular"],
};

// the log is bounded so a long session can't grow memory (or render cost) without limit
const MAX_LINES = 300;
const capped = (lines) => (lines.length > MAX_LINES ? lines.slice(-MAX_LINES) : lines);

export function TerminalContent({ onTriggerNotification, onOpenHR }) {
  const { audience, setAudience } = useAudience();
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
  const [history, setHistory] = useState([
    { text: "Max OS [Version 1.0.0]", type: "info" },
    { text: "Escribe 'help' para ver los comandos disponibles.", type: "info" },
    { text: "", type: "info" },
  ]);
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

  // commands that reach the rest of the app (windows, tours, audience) and the easter eggs
  const extraCommand = (cmd, arg) => {
    const egg = (lines) => { sys.unlock("curious"); return lines; };
    switch (cmd) {
      case "open":
      case "abrir": {
        const id = TERMINAL_OPEN_ALIASES[arg.split(" ")[0]];
        if (!id) return [{ text: "Uso: open <sección> · ej: open proyectos, open rrhh, open contacto (escribe 'ls' para verlas)", type: "error" }];
        sys.openWindow(id);
        return [{ text: `Abriendo ${arg}…`, type: "info" }];
      }
      case "ls":
        return [
          { text: "about/  rrhh/  skills/  proyectos/  experiencia/  educacion/", type: "accent" },
          { text: "certificaciones/  contacto/  simulador/  insignias/", type: "accent" },
          { text: "Tip: 'open <nombre>' abre cualquiera.", type: "info" },
        ];
      case "ti":
      case "rrhh":
        setAudience(cmd);
        return [{ text: `Perfil cambiado a ${cmd.toUpperCase()}.`, type: "info" }];
      case "tour":
        sys.startCoachTour();
        return [{ text: "Iniciando tour guiado…", type: "info" }];
      case "recorrido":
        sys.startAutoTour();
        return [{ text: "Iniciando recorrido de 60 segundos…", type: "info" }];
      case "simular":
      case "simulate":
        sys.openWindow("simulator");
        return [{ text: "Abriendo el simulador de optimización…", type: "info" }];
      case "sound":
      case "sonido":
        if (arg !== "on" && arg !== "off") return [{ text: "Uso: sound on | sound off", type: "error" }];
        sys.setSoundOn(arg === "on");
        return [{ text: `Sonidos ${arg === "on" ? "activados" : "desactivados"}.`, type: "info" }];
      case "whoami":
        return [{ text: audience === "rrhh" ? "visitante@rrhh — explorando el perfil en lenguaje de negocio" : "visitante@ti — explorando el stack técnico", type: "info" }];
      case "date":
        return [{ text: new Date().toLocaleString("es-CL"), type: "info" }];
      case "exit":
        sys.closeWindow("terminal");
        return "handled";
      case "sudo":
        if (arg.startsWith("contratar") || arg.startsWith("hire")) {
          later(() => sys.openWindow("contact"), 1100);
          return egg([
            { text: "[sudo] verificando candidato…", type: "info" },
            { text: "  ✔ compilado sin errores · 0 vulnerabilidades", type: "accent" },
            { text: "  ✔ rendimiento: optimizado", type: "accent" },
            { text: "  🎉 ¡Excelente decisión! Abriendo Contacto…", type: "accent" },
          ]);
        }
        return [{ text: "sudo: permiso concedido solo para 'sudo contratar' 😉", type: "error" }];
      case "matrix":
        setMatrix(true);
        later(() => setMatrix(false), 2600);
        return egg([{ text: "Wake up, Neo…", type: "accent" }]);
      case "coffee":
      case "cafe":
        return egg([
          { text: "    ( (", type: "accent" },
          { text: "     ) )", type: "accent" },
          { text: "  ........", type: "accent" },
          { text: "  |      |]", type: "accent" },
          { text: "  \\      /", type: "accent" },
          { text: "   `----'", type: "accent" },
          { text: "Café listo en 0.3 s — hasta el café está optimizado.", type: "info" },
        ]);
      case "rm":
        if (arg.includes("-rf")) return egg([{ text: "rm: operación bloqueada. Este sistema está optimizado, no destruido 😉", type: "error" }]);
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
      setCmdHistory((prev) => [...prev, inputVal.trim()]);
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
    switch (cmdClean) {
      case "help":
        reply = [
          { text: "Comandos disponibles:", type: "info" },
          { text: "  ls / open <sección> - Lista y abre secciones (ej: open proyectos)", type: "info" },
          { text: "  ti | rrhh   - Cambia el perfil de lectura", type: "info" },
          { text: "  tour        - Tour guiado por la interfaz", type: "info" },
          { text: "  recorrido   - Recorrido automático de 60 segundos", type: "info" },
          { text: "  simular     - Abre el simulador de optimización", type: "info" },
          { text: "  sound on|off - Activa o desactiva los sonidos", type: "info" },
          { text: "  whoami / date / exit", type: "info" },
          { text: "  neofetch    - Muestra info del sistema en estilo ASCII", type: "info" },
          { text: "  about       - Muestra el perfil profesional", type: "info" },
          { text: "  skills      - Muestra el stack tecnológico", type: "info" },
          { text: "  experience  - Muestra la trayectoria laboral", type: "info" },
          { text: "  clear       - Limpia la pantalla", type: "info" },
          { text: "  notify      - Envía una notificación de prueba", type: "info" },
        ];
        break;
      case "notify":
        if (onTriggerNotification) {
          onTriggerNotification();
          reply = [{ text: "Notificación manual enviada.", type: "info" }];
        } else {
          reply = [{ text: "Error: Sistema de notificación no enlazado.", type: "error" }];
        }
        break;
      case "clear":
        setHistory([]);
        setInputVal("");
        return;
      case "neofetch":
        reply = [
          { text: "      ███╗   ███╗ ██████╗", type: "accent" },
          { text: "      ████╗ ████║██╔════╝", type: "accent" },
          { text: "      ██╔████╔██║██║     ", type: "accent" },
          { text: "      ██║╚██╔╝██║██║     ", type: "accent" },
          { text: "      ██║ ╚═╝ ██║╚██████╗", type: "accent" },
          { text: "      ╚═╝     ╚═╝ ╚══════╝", type: "accent" },
          { text: "--------------------------", type: "info" },
          { text: "OS: Maximiliano Portfolio OS v1.0", type: "info" },
          { text: "Host: MacBook Air M5", type: "info" },
          { text: "Kernel: React / FastAPI Hybrid", type: "info" },
          { text: "Uptime: 2 years (Experience)", type: "info" },
          { text: "Shell: zsh (optimización-mode)", type: "info" },
          { text: "CPU: High Performance Backend Dev", type: "info" },
          { text: "Primary Stacks: Java, Python, Node.js", type: "info" },
        ];
        break;
      case "about":
        reply = [
          { text: "PERFIL PROFESIONAL:", type: "accent" },
          { text: "Backend Developer enfocado en crear sistemas rápidos, eficientes y preparados para soportar miles de usuarios en simultáneo.", type: "info" },
          { text: "Especialidad en optimización de CPU y memoria, reducción de costos en la nube y alta escalabilidad.", type: "info" },
        ];
        break;
      case "skills":
        reply = [
          { text: "TECNOLOGÍAS PRINCIPALES:", type: "accent" },
          { text: "  - Java / Spring Boot / GraalVM", type: "info" },
          { text: "  - Python / FastAPI / Django", type: "info" },
          { text: "  - Node.js / Express / NestJS", type: "info" },
          { text: "  - Databases: PostgreSQL, MySQL, MongoDB", type: "info" },
          { text: "  - Cloud & DevOps: AWS, Docker", type: "info" },
        ];
        break;
      case "experience":
        reply = [
          { text: "TRAYECTORIA LABORAL:", type: "accent" },
          { text: "  - Proyectos Independientes (PUMA, GyG, IACC) [2024 - Presente]", type: "info" },
          { text: "    * Optimización crítica de 1 hora a 5-10 min en IACC (83% mejora).", type: "info" },
          { text: "    * Tiempos de respuesta de 4s a milisegundos en PUMA.", type: "info" },
          { text: "    * Más de 20% de mejora en consultas DB en GyG.", type: "info" },
          { text: "  - Backend Engineer (Desarrollo y Optimización) [2022 - 2024]", type: "info" },
        ];
        break;
      default:
        reply = [{ text: `Comando no reconocido: '${cmdClean}'. Escribe 'help' para ver opciones.`, type: "error" }];
    }

    setHistory(capped([...newHistory, ...reply]));
    setInputVal("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const typed = norm(inputVal);
      if (!typed) return;
      const pool = [...TERMINAL_COMMANDS, ...Object.keys(TERMINAL_OPEN_ALIASES).map((k) => `open ${k}`)];
      const hits = [...new Set(pool.filter((c) => c.startsWith(typed) && c !== typed))];
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
          Consola interactiva pensada para perfiles técnicos. Para un resumen en lenguaje simple:
        </p>
        <button
          onClick={onOpenHR}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
          style={{ background: HR_ACCENT, color: "#05070b" }}
        >
          <Users size={12} /> Abrir ficha RRHH
        </button>
      </div>
    )}
    <div
      className="relative w-full flex-1 min-h-[240px] flex flex-col font-mono text-[11px] sm:text-[12px] bg-black/90 p-2.5 rounded-md overflow-hidden border"
      style={{ color: LANG.node.c2, borderColor: `${LANG.node.c1}33` }}
      onClick={() => {
        scrollToEnd();
        inputRef.current?.focus();
      }}
    >
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto pr-1 select-text space-y-1" style={{ scrollbarWidth: "thin" }}>
        {history.map((line, idx) => (
          <div
            key={idx}
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
      <div className="flex flex-wrap gap-1.5 mt-2 shrink-0" aria-label="Comandos sugeridos">
        {TERMINAL_SUGGESTIONS[audience].map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => { e.stopPropagation(); runCommand(c); }}
            className="rounded border px-1.5 py-1 text-[10.5px] text-white/60 hover:text-white hover:border-white/30 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
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
          aria-label="Comando de terminal"
          maxLength={200}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="send"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 py-1 bg-transparent border-none outline-none text-white font-mono text-[16px] sm:text-[12px]"
          autoFocus={finePointer}
        />
      </form>
    </div>
    </>
  );
}
