/* Data the initial shell needs (boot screen, toasts, circuit background, audience toggle). Kept apart from
   content.js / hr.js so the CV, project catalogue and RRHH texts load only with the windows that use them.
   Every text has an English twin (`…En` fields, or a parallel `_EN` list). */
import { Code2, Users } from "lucide-react";
import { CORE, HR_ACCENT, LANG } from "../styles/theme.js";

export const NOTIFICATION_MESSAGES = [
  {
    title: "Guía de Interacción",
    titleEn: "How to use this site",
    text: "¡Bienvenido! Haz clic en los iconos de la barra inferior (Dock) para abrir las ventanas. Puedes arrastrarlas, minimizarlas o maximizarlas a pantalla completa. ¡Prueba Terminal.exe para ejecutar comandos!",
    textEn: "Welcome! Click the icons in the bottom bar (the Dock) to open windows. You can drag, minimize or maximize them. Try Terminal.exe to run commands!",
  },
  {
    title: "Migración a BUK",
    titleEn: "Migration to BUK",
    text: "⚡ En Push HR rediseñé la migración masiva de documentos hacia BUK: de más de 1 hora a 5–10 minutos, con procesamiento concurrente y asincrónico.",
    textEn: "⚡ At Push HR I redesigned the bulk document migration to BUK: from over 1 hour to 5–10 minutes, with concurrent and asynchronous processing.",
  },
  {
    title: "Latencia Reducida",
    titleEn: "Lower latency",
    text: "🚀 En BiceVida bajé los tiempos de respuesta de microservicios Java de 3–4 segundos a milisegundos y migré 4 servicios a GraalVM Native Image.",
    textEn: "🚀 At BiceVida I cut Java microservice response times from 3–4 seconds to milliseconds and migrated 4 services to GraalVM Native Image.",
  },
  {
    title: "Menos CPU y RAM",
    titleEn: "Less CPU and RAM",
    text: "☁️ Optimicé plataformas internas reduciendo el uso de CPU en 30–40% y el consumo de memoria RAM en 15–30%.",
    textEn: "☁️ I optimized internal platforms, cutting CPU usage by 30–40% and RAM usage by 15–30%.",
  },
  {
    title: "Datos confiables",
    titleEn: "Reliable data",
    text: "💾 Migraciones masivas con trazabilidad completa para PUMA, GyG e IACC: motor de validación con 98% de coincidencia y reportes 100% exactos.",
    textEn: "💾 Fully traceable bulk migrations for PUMA, GyG and IACC: a validation engine with a 98% match rate and 100% accurate reports.",
  },
  {
    title: "Stack Políglota",
    titleEn: "Polyglot stack",
    text: "🛠️ Desarrollo backend con Java (Spring Boot + GraalVM), Python (FastAPI, Polars, Pydantic v2) y Node.js, sobre PostgreSQL, MySQL y MongoDB.",
    textEn: "🛠️ Backend development with Java (Spring Boot + GraalVM), Python (FastAPI, Polars, Pydantic v2) and Node.js, on PostgreSQL, MySQL and MongoDB.",
  },
  {
    title: "Más allá del código",
    titleEn: "Beyond the code",
    text: "🏊 Natación, mountain bike y estudio constante: abre Hobbies en el dock para conocer el lado personal.",
    textEn: "🏊 Swimming, mountain biking and constant learning: open Hobbies in the dock to meet the person behind the code.",
  },
];

/* decorative compile log; every line states something true about this site's own stack */
export const BOOT_LINES = [
  { t: "$ init polyglot_core --runtime=python,java,node", kind: "cmd" },
  { t: "  ├─ mounting CPython 3.14 ................. OK", kind: "ok" },
  { t: "  ├─ mounting OpenJDK 21 LTS ................ OK", kind: "ok" },
  { t: "  └─ mounting Node 24 LTS ................... OK", kind: "ok" },
  { t: "$ verify --tests --security-headers", kind: "cmd" },
  { t: "  └─ backend tests passing · CSP + HSTS ..... OK", kind: "ok" },
  { t: "$ compile ui --target=web --mode=release", kind: "cmd" },
  { t: "  └─ prerendered · brotli · lazy windows .. OK", kind: "ok" },
  { t: "$ boot complete — welcome", kind: "cmd" },
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
  { id: "ti", label: "TI", labelEn: "TECH", long: "Perfil TI", longEn: "Tech profile", hint: "Ver en lenguaje técnico", hintEn: "Read it in technical language", Icon: Code2, color: CORE },
  { id: "rrhh", label: "RRHH", labelEn: "HR", long: "Perfil RRHH", longEn: "HR profile", hint: "Ver en lenguaje para RRHH y reclutadores", hintEn: "Read it in plain language for recruiters", Icon: Users, color: HR_ACCENT },
];

export const LANGUAGES = [
  { id: "es", label: "ES", name: "Español" },
  { id: "en", label: "EN", name: "English" },
];

/* second intro toast: explains both reading profiles and lets the visitor pick one */
export const PROFILE_NOTIFICATION = {
  title: "Dos formas de leer este portafolio",
  titleEn: "Two ways to read this portfolio",
  accent: HR_ACCENT,
  duration: 20000,
  profiles: [
    { id: "ti", name: "Perfil TI", nameEn: "Tech profile", text: "Lenguaje técnico: tecnologías, arquitectura y métricas de rendimiento.", textEn: "Technical language: technologies, architecture and performance metrics." },
    { id: "rrhh", name: "Perfil RRHH", nameEn: "HR profile", text: "Lenguaje de negocio: qué aporto, resultados medibles y competencias sin tecnicismos.", textEn: "Business language: what I bring, measurable results and skills without the jargon." },
  ],
};
