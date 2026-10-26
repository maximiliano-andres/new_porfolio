/* Window catalogue (dock + extra windows), achievements and window → circuit-trace mapping. */
import { Award, Briefcase, Code2, Compass, Egg, FolderGit2, Gauge, GraduationCap, Hexagon, Keyboard, Languages, Mail, Route, Search, Send, Sparkles, Terminal, Trophy, User, Users, Zap } from "lucide-react";
import { CORE, HR_ACCENT, LANG } from "../theme.js";

export const ACHIEVEMENTS = [
  { id: "first", title: "Primer contacto", desc: "Abriste tu primera ventana.", Icon: Sparkles },
  { id: "explorer", title: "Explorador", desc: "Abriste todas las secciones del dock.", Icon: Compass },
  { id: "recruiter", title: "Reclutador", desc: "Revisaste la ficha para RRHH.", Icon: Users },
  { id: "polyglot", title: "Bilingüe", desc: "Cambiaste entre el perfil TI y el perfil RRHH.", Icon: Languages },
  { id: "architect", title: "Arquitecto", desc: "Abriste el detalle de un proyecto.", Icon: FolderGit2 },
  { id: "optimizer", title: "Optimizador", desc: "Bajaste el proceso del simulador a 10 minutos o menos.", Icon: Gauge },
  { id: "core", title: "Centro de control", desc: "Activaste el núcleo CORE.", Icon: Hexagon },
  { id: "navigator", title: "Navegante", desc: "Usaste la paleta de comandos.", Icon: Search },
  { id: "hacker", title: "Hacker", desc: "Ejecutaste 3 comandos en la terminal.", Icon: Terminal },
  { id: "curious", title: "Curioso", desc: "Encontraste un easter egg en la terminal.", Icon: Egg },
  { id: "shortcut", title: "Atajos", desc: "Usaste un atajo de teclado.", Icon: Keyboard },
  { id: "tourist", title: "Bien guiado", desc: "Completaste el tour o el recorrido de 60 s.", Icon: Route },
  { id: "contact", title: "Conexión", desc: "Enviaste un mensaje de contacto.", Icon: Send },
];

/* each window energizes one trace of the circuit background (index into CIRCUIT_PATHS) */
export const WINDOW_CIRCUIT = {
  about: 6, hr: 3, skills: 0, projects: 2, experience: 1, education: 3,
  certifications: 4, contact: 5, terminal: 7, badges: 6, simulator: 1, "project-detail": 2,
};

/* `hrLabel`: window/dock name shown in RRHH mode (falls back to `label`) */
export const DOCK_ITEMS = [
  { id: "about", label: "Sobre mí", IconCmp: User, accent: CORE, width: 520 },
  { id: "hr", label: "Para RRHH", IconCmp: Users, accent: HR_ACCENT, width: 680 },
  { id: "skills", label: "Skills", hrLabel: "Competencias", IconCmp: Code2, accent: LANG.python.c1, width: 720 },
  { id: "projects", label: "Proyectos", hrLabel: "Logros", IconCmp: FolderGit2, accent: LANG.node.c1, width: 680 },
  { id: "experience", label: "Experiencia", hrLabel: "Trayectoria", IconCmp: Briefcase, accent: LANG.java.c1, width: 580 },
  { id: "education", label: "Educación", IconCmp: GraduationCap, accent: LANG.python.c2, width: 520 },
  { id: "certifications", label: "Certificaciones", IconCmp: Award, accent: LANG.java.c2, width: 520 },
  { id: "contact", label: "Contacto", IconCmp: Mail, accent: LANG.node.c2, width: 480 },
  { id: "terminal", label: "Terminal.exe", IconCmp: Terminal, accent: LANG.node.c1, width: 580 },
];

/* windows reachable from the CORE hub, palette and terminal but not from the dock (it must fit 320px) */
export const EXTRA_ITEMS = [
  { id: "simulator", label: "Simulador", IconCmp: Zap, accent: CORE, width: 560 },
  { id: "badges", label: "Insignias", IconCmp: Trophy, accent: HR_ACCENT, width: 600 },
];

export const ALL_ITEMS = [...DOCK_ITEMS, ...EXTRA_ITEMS];

export const PROJECT_WIN_WIDTH = 520;

/* 60-second guided walkthrough: one window per step, narrated */
export const AUTO_TOUR = {
  ti: [
    { open: "about", text: "Quién soy: Backend Developer especializado en optimización de rendimiento." },
    { open: "skills", text: "Stack políglota: Java, Python y Node.js, con métricas por runtime." },
    { open: "projects", project: "iacc-optimizer", text: "Caso IACC: un proceso de más de 1 hora reducido a 5–10 minutos." },
    { open: "experience", text: "Trayectoria: latencia de segundos a milisegundos, SQL +20% y costos cloud." },
    { open: "simulator", text: "Pruébalo tú: el simulador recrea cómo se optimiza un proceso así." },
    { open: "contact", text: "¿Conversamos? Escríbeme desde aquí." },
  ],
  rrhh: [
    { open: "hr", text: "Ficha para RRHH: datos clave, resultados medibles y cargos donde encajo." },
    { open: "skills", text: "Competencias explicadas en lenguaje de negocio, con los términos que piden los avisos." },
    { open: "projects", project: "iacc-optimizer", text: "Un logro concreto: un proceso de 1 hora que hoy toma 10 minutos." },
    { open: "experience", text: "Trayectoria: 2 años resolviendo problemas de rendimiento para empresas." },
    { open: "contact", text: "¿Te interesa el perfil? Coordinemos una entrevista." },
  ],
};

export const AUTO_TOUR_MS = 60000;
