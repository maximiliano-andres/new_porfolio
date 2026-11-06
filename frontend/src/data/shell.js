/* Data the initial shell needs (boot screen, toasts, circuit background, audience toggle). Kept apart from
   content.js / hr.js so the CV, project catalogue and RRHH texts load only with the windows that use them. */
import { Code2, Users } from "lucide-react";
import { CORE, HR_ACCENT, LANG } from "../styles/theme.js";

export const NOTIFICATION_MESSAGES = [
  {
    title: "Guía de Interacción",
    text: "¡Bienvenido! Haz clic en los iconos de la barra inferior (Dock) para abrir las ventanas. Puedes arrastrarlas, minimizarlas o maximizarlas a pantalla completa. ¡Prueba Terminal.exe para ejecutar comandos!"
  },
  {
    title: "Migración a BUK",
    text: "⚡ En Push HR rediseñé la migración masiva de documentos hacia BUK: de más de 1 hora a 5–10 minutos, con procesamiento concurrente y asincrónico."
  },
  {
    title: "Latencia Reducida",
    text: "🚀 En BiceVida bajé los tiempos de respuesta de microservicios Java de 3–4 segundos a milisegundos y migré 4 servicios a GraalVM Native Image."
  },
  {
    title: "Menos CPU y RAM",
    text: "☁️ Optimicé plataformas internas reduciendo el uso de CPU en 30–40% y el consumo de memoria RAM en 15–30%."
  },
  {
    title: "Datos confiables",
    text: "💾 Migraciones masivas con trazabilidad completa para PUMA, GyG e IACC: motor de validación con 98% de coincidencia y reportes 100% exactos."
  },
  {
    title: "Stack Políglota",
    text: "🛠️ Desarrollo backend con Java (Spring Boot + GraalVM), Python (FastAPI, Polars, Pydantic v2) y Node.js, sobre PostgreSQL, MySQL y MongoDB."
  }
];

export const BOOT_LINES = [
  { t: "$ init polyglot_core --runtime=python,java,node", kind: "cmd" },
  { t: "  \u251c\u2500 mounting CPython 3.13 ................. OK", kind: "ok" },
  { t: "  \u251c\u2500 mounting OpenJDK 21 (virtual threads) .. OK", kind: "ok" },
  { t: "  \u2514\u2500 mounting Node 22 LTS ................... OK", kind: "ok" },
  { t: "$ verify --memory-safety --tls --no-known-cves", kind: "cmd" },
  { t: "  \u2514\u2500 0 vulnerabilities \u00b7 0 GC pauses > 4ms .. OK", kind: "ok" },
  { t: "$ compile ui --target=web --mode=release", kind: "cmd" },
  { t: "  \u2514\u2500 build ready in 84ms", kind: "ok" },
  { t: "$ boot complete \u2014 welcome", kind: "cmd" },
];

/* circuit traces drawn by CircuitBackground (1440×900 viewBox) */
export const CIRCUIT_PATHS = [
  { d: "M0,120 H260 V260 H520 V180 H760", color: LANG.python.c1, dur: 5.5, delay: 0 },
  { d: "M0,420 H180 V520 H460 V420 H720", color: LANG.java.c1, dur: 6.2, delay: 0.6 },
  { d: "M0,680 H320 V600 H580 V680 H760", color: LANG.node.c1, dur: 5.8, delay: 1.1 },
  { d: "M1440,140 H1180 V280 H920 V180 H760", color: LANG.python.c2, dur: 6.6, delay: 0.3 },
  { d: "M1440,400 H1260 V500 H980 V400 H760", color: LANG.java.c2, dur: 5.4, delay: 0.9 },
  { d: "M1440,660 H1120 V580 H860 V660 H760", color: LANG.node.c2, dur: 6.1, delay: 1.4 },
  { d: "M760,0 V180", color: CORE, dur: 4.4, delay: 0.2 },
  { d: "M760,900 V680", color: CORE, dur: 4.4, delay: 0.7 },
];

export const AUDIENCES = [
  { id: "ti", label: "TI", long: "Perfil TI", hint: "Ver en lenguaje técnico", Icon: Code2, color: CORE },
  { id: "rrhh", label: "RRHH", long: "Perfil RRHH", hint: "Ver en lenguaje para RRHH y reclutadores", Icon: Users, color: HR_ACCENT },
];

/* second intro toast: explains both reading profiles and lets the visitor pick one */
export const PROFILE_NOTIFICATION = {
  title: "Dos formas de leer este portafolio",
  accent: HR_ACCENT,
  duration: 20000,
  profiles: [
    { id: "ti", name: "Perfil TI", text: "Lenguaje técnico: tecnologías, arquitectura y métricas de rendimiento." },
    { id: "rrhh", name: "Perfil RRHH", text: "Lenguaje de negocio: qué aporto, resultados medibles y competencias sin tecnicismos." },
  ],
};
