/* Window catalogue (dock + extra windows), achievements and window → circuit-trace mapping.
   Every visible text has a Spanish field and an English `…En` twin (see `loc` below). */
import { BookOpen, Briefcase, Code2, Compass, Cpu, Egg, FileText, FolderGit2, Gauge, GraduationCap, Hexagon, Keyboard, Languages, Mail, Mountain, Route, Search, Send, Sparkles, Terminal, Trophy, User, Users, Zap } from "lucide-react";
import { CORE, HR_ACCENT, LANG } from "../styles/theme.js";

/* picks `obj[key]` or its English twin `obj[key + "En"]` */
export const loc = (obj, key, lang) => (lang === "en" && obj[`${key}En`] !== undefined ? obj[`${key}En`] : obj[key]);

export const ACHIEVEMENTS = [
  { id: "first", title: "Primer contacto", titleEn: "First contact", desc: "Abriste tu primera ventana.", descEn: "You opened your first window.", Icon: Sparkles },
  { id: "explorer", title: "Explorador", titleEn: "Explorer", desc: "Abriste todas las secciones del dock.", descEn: "You opened every section in the dock.", Icon: Compass },
  { id: "recruiter", title: "Reclutador", titleEn: "Recruiter", desc: "Revisaste la ficha para RRHH.", descEn: "You checked the recruiter summary.", Icon: Users },
  { id: "polyglot", title: "Bilingüe", titleEn: "Bilingual", desc: "Cambiaste entre el perfil TI y el perfil RRHH.", descEn: "You switched between the Tech and the HR profile.", Icon: Languages },
  { id: "architect", title: "Arquitecto", titleEn: "Architect", desc: "Abriste el detalle de un proyecto.", descEn: "You opened a project's details.", Icon: FolderGit2 },
  { id: "optimizer", title: "Optimizador", titleEn: "Optimizer", desc: "Bajaste el proceso del simulador a 10 minutos o menos.", descEn: "You got the simulator's process down to 10 minutes or less.", Icon: Gauge },
  { id: "core", title: "Centro de control", titleEn: "Control center", desc: "Activaste el núcleo CORE.", descEn: "You activated the CORE hub.", Icon: Hexagon },
  { id: "navigator", title: "Navegante", titleEn: "Navigator", desc: "Usaste la paleta de comandos.", descEn: "You used the command palette.", Icon: Search },
  { id: "hacker", title: "Hacker", titleEn: "Hacker", desc: "Ejecutaste 3 comandos en la terminal.", descEn: "You ran 3 commands in the terminal.", Icon: Terminal },
  { id: "curious", title: "Curioso", titleEn: "Curious", desc: "Encontraste un easter egg en la terminal.", descEn: "You found an easter egg in the terminal.", Icon: Egg },
  { id: "shortcut", title: "Atajos", titleEn: "Shortcuts", desc: "Usaste un atajo de teclado.", descEn: "You used a keyboard shortcut.", Icon: Keyboard },
  { id: "tourist", title: "Bien guiado", titleEn: "Well guided", desc: "Completaste el tour o el recorrido de 60 s.", descEn: "You finished the tour or the 60-second walkthrough.", Icon: Route },
  { id: "contact", title: "Conexión", titleEn: "Connection", desc: "Abriste tu correo para escribirme.", descEn: "You opened your email app to write to me.", Icon: Send },
  { id: "human", title: "Más allá del código", titleEn: "Beyond the code", desc: "Conociste mis hobbies.", descEn: "You discovered my hobbies.", Icon: Mountain },
  { id: "reader", title: "Lector técnico", titleEn: "Tech reader", desc: "Leíste mis notas técnicas o cómo está hecho este sitio.", descEn: "You read my tech notes or how this site is built.", Icon: BookOpen },
];

/* each window energizes one trace of the circuit background (index into CIRCUIT_PATHS) */
export const WINDOW_CIRCUIT = {
  about: 6, hr: 3, skills: 0, projects: 2, experience: 1, education: 3, hobbies: 5,
  contact: 5, terminal: 7, badges: 6, simulator: 1, cv: 4, notes: 0, site: 4, "project-detail": 2,
};

/* `hrLabel`: window/dock name shown in RRHH mode (falls back to `label`).
   Nine items at most: the dock must fit a 320 px screen and the 1–9 shortcuts. */
export const DOCK_ITEMS = [
  { id: "about", label: "Sobre mí", labelEn: "About me", IconCmp: User, accent: CORE, width: 560 },
  { id: "hr", label: "Para RRHH", labelEn: "For recruiters", IconCmp: Users, accent: HR_ACCENT, width: 700 },
  { id: "skills", label: "Skills", labelEn: "Skills", hrLabel: "Competencias", hrLabelEn: "Strengths", IconCmp: Code2, accent: LANG.python.c1, width: 720 },
  { id: "projects", label: "Proyectos", labelEn: "Projects", hrLabel: "Logros", hrLabelEn: "Achievements", IconCmp: FolderGit2, accent: LANG.node.c1, width: 680 },
  { id: "experience", label: "Experiencia", labelEn: "Experience", hrLabel: "Trayectoria", hrLabelEn: "Career", IconCmp: Briefcase, accent: LANG.java.c1, width: 620 },
  { id: "education", label: "Formación", labelEn: "Education", IconCmp: GraduationCap, accent: LANG.python.c2, width: 600 },
  { id: "hobbies", label: "Hobbies", labelEn: "Hobbies", IconCmp: Mountain, accent: "#38bdf8", width: 680 },
  { id: "contact", label: "Contacto", labelEn: "Contact", IconCmp: Mail, accent: LANG.node.c2, width: 480 },
  { id: "terminal", label: "Terminal.exe", labelEn: "Terminal.exe", IconCmp: Terminal, accent: LANG.node.c1, width: 580 },
];

/* windows reachable from the CORE hub, palette, terminal and links, but not from the dock */
export const EXTRA_ITEMS = [
  { id: "cv", label: "Mi CV", labelEn: "My CV", IconCmp: FileText, accent: CORE, width: 700 },
  { id: "simulator", label: "Simulador", labelEn: "Simulator", IconCmp: Zap, accent: CORE, width: 560 },
  { id: "notes", label: "Notas técnicas", labelEn: "Tech notes", IconCmp: BookOpen, accent: LANG.python.c1, width: 640 },
  { id: "site", label: "Cómo está hecho", labelEn: "How it's built", IconCmp: Cpu, accent: CORE, width: 640 },
  { id: "badges", label: "Insignias", labelEn: "Badges", IconCmp: Trophy, accent: HR_ACCENT, width: 600 },
];

/* old window ids (shared links, saved progress) that now live inside another window */
export const WINDOW_ALIASES = { certifications: "education" };

export const ALL_ITEMS = [...DOCK_ITEMS, ...EXTRA_ITEMS];

/* window title / dock label for the current profile and language */
export const itemLabel = (it, hr, lang) => (hr && it.hrLabel ? loc(it, "hrLabel", lang) : loc(it, "label", lang));

export const PROJECT_WIN_WIDTH = 560;

/* 60-second guided walkthrough: one window per step, narrated */
export const AUTO_TOUR = {
  ti: [
    { open: "about", text: "Quién soy: Backend Developer especializado en optimización de rendimiento.", textEn: "Who I am: a Backend Developer focused on performance optimization." },
    { open: "skills", text: "Stack políglota: Java (Spring Boot), Python (FastAPI) y Node.js, medido por proyecto.", textEn: "Polyglot stack: Java (Spring Boot), Python (FastAPI) and Node.js, counted per project." },
    { open: "projects", project: "buk-migration", text: "Caso Push HR: migración masiva de documentos a BUK, de más de 1 hora a 5–10 minutos.", textEn: "Push HR case: bulk document migration to BUK, from over 1 hour to 5–10 minutes." },
    { open: "experience", text: "Trayectoria: Push HR, BiceVida (de segundos a milisegundos, GraalVM) y freelance.", textEn: "Career: Push HR, BiceVida (from seconds to milliseconds, GraalVM) and freelance work." },
    { open: "simulator", text: "Pruébalo tú: el simulador recrea cómo se optimiza un proceso así.", textEn: "Try it yourself: the simulator recreates how a process like that gets optimized." },
    { open: "contact", text: "¿Conversamos? Escríbeme desde aquí.", textEn: "Shall we talk? Write to me from here." },
  ],
  rrhh: [
    { open: "hr", text: "Ficha para RRHH: datos del proceso, resultados medibles y lo que busco.", textEn: "Recruiter summary: hiring details, measurable results and what I'm looking for." },
    { open: "skills", text: "Competencias explicadas en lenguaje de negocio, con los términos que piden los avisos.", textEn: "Strengths explained in business terms, with the keywords job posts ask for." },
    { open: "projects", project: "buk-migration", text: "Un logro concreto: una migración de 1 hora que hoy toma 10 minutos.", textEn: "One concrete result: a 1-hour migration that now takes 10 minutes." },
    { open: "experience", text: "Trayectoria: más de 2 años en Push HR, BiceVida y proyectos para PUMA, GyG e IACC.", textEn: "Career: over 2 years at Push HR, BiceVida and projects for PUMA, GyG and IACC." },
    { open: "hobbies", text: "Más allá del código: natación, mountain bike y estudio constante.", textEn: "Beyond the code: swimming, mountain biking and constant learning." },
    { open: "contact", text: "¿Te interesa el perfil? Coordinemos una entrevista.", textEn: "Interested in the profile? Let's schedule an interview." },
  ],
};

export const AUTO_TOUR_MS = 60000;
