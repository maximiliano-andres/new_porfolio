/* Portfolio content in technical language (TI view) plus boot log and circuit traces. */
import { CORE, LANG } from "../theme.js";

export const NOTIFICATION_MESSAGES = [
  {
    title: "Guía de Interacción",
    text: "¡Bienvenido! Haz clic en los iconos de la barra inferior (Dock) para abrir las ventanas. Puedes arrastrarlas, minimizarlas o maximizarlas a pantalla completa. ¡Prueba Terminal.exe para ejecutar comandos!"
  },
  {
    title: "Optimización IACC",
    text: "⚡ En IACC, logré reducir el tiempo de un proceso crítico de 1 hora a solo 5-10 minutos (una mejora superior al 83%)."
  },
  {
    title: "Latencia Reducida",
    text: "🚀 En PUMA, optimicé las interfaces reduciendo los tiempos de respuesta de 4 segundos a milisegundos."
  },
  {
    title: "Rendimiento SQL",
    text: "💾 En GyG, optimicé las consultas a bases de datos incrementando la velocidad en más de un 20%."
  },
  {
    title: "Eficiencia & Nube",
    text: "☁️ Mi especialidad es la optimización de código para disminuir el consumo de CPU y memoria, reduciendo costos de infraestructura."
  },
  {
    title: "Stack Políglota",
    text: "🛠️ Desarrollo sistemas backend robustos usando Java (Spring Boot con compilación GraalVM), Python (FastAPI/Django) y Node.js."
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

export const RADAR_AXES = ["Speed", "Memory", "Security", "Concurrency", "Ecosystem"];

export const RADAR = {
  java: [92, 85, 90, 88, 92],
  python: [88, 82, 80, 85, 94],
  node: [86, 78, 82, 84, 93],
};

export const SKILL_BARS = {
  java: [
    { name: "Spring Boot / Core", v: 90 },
    { name: "GraalVM Native Image", v: 85 },
    { name: "JVM Performance Tuning", v: 88 },
    { name: "Multithreading & Concurrency", v: 84 },
  ],
  python: [
    { name: "FastAPI / Django", v: 92 },
    { name: "Code Optimization (CPU/RAM)", v: 88 },
    { name: "Async / Asyncio", v: 86 },
    { name: "Data Processing Pipelines", v: 82 },
  ],
  node: [
    { name: "Node.js / Express / NestJS", v: 87 },
    { name: "TypeScript", v: 85 },
    { name: "API REST / Event-Driven", v: 84 },
  ],
};

export const DB_TOOLS = [
  { name: "PostgreSQL", icon: "Database" },
  { name: "MySQL", icon: "Database" },
  { name: "MongoDB", icon: "Database" },
  { name: "Docker", icon: "Layers" },
  { name: "AWS (EC2, S3, RDS)", icon: "Layers" },
  { name: "GraalVM", icon: "Lock" },
];

export const PROJECTS = [
  {
    id: "iacc-optimizer",
    title: "Optimizador de Procesos Críticos",
    langs: ["java", "python"],
    summary:
      "Reestructuración y optimización de un proceso pesado para IACC. Se redujo el tiempo de procesamiento de más de 1 hora a solo 5–10 minutos (más del 83% de mejora).",
    stack: ["Java", "Spring Boot", "Python", "Multithreading", "PostgreSQL"],
    diagram: "gateway",
  },
  {
    id: "puma-api",
    title: "API Gateway de Respuestas Ultra-Rápidas",
    langs: ["node", "java"],
    summary:
      "Optimización de tiempos de respuesta en interfaces de PUMA. Se disminuyó la latencia de respuestas lentas de 3–4 segundos a milisegundos usando caché distribuido y optimización de consultas.",
    stack: ["Node.js", "Express", "GraalVM", "MySQL", "Docker"],
    diagram: "auth",
  },
  {
    id: "gyg-performance",
    title: "Sistema de Eficiencia de Datos",
    langs: ["python"],
    summary:
      "Sintonía fina de base de datos y procesamiento asíncrono para GyG. Se logró una mejora de más del 20% en el rendimiento de consultas a bases de datos y reducción de consumo de CPU/RAM.",
    stack: ["Python", "FastAPI", "PostgreSQL", "Optimización de Memoria", "AWS"],
    diagram: "events",
  },
];

export const EXPERIENCE = [
  {
    role: "Backend Developer",
    company: "Proyectos y Consultorías Independientes (PUMA, GyG, IACC)",
    period: "2024 — Presente",
    location: "Chile (Remoto / Presencial)",
    bullets: [
      "Diseñé e implementé soluciones de backend de alto rendimiento resolviendo problemas de velocidad crítica y latencia.",
      "Reduje la duración de procesos críticos de procesamiento de datos de más de 1 hora a solo 5-10 minutos (mejora >83%).",
      "Optimicé tiempos de respuesta de endpoints que demoraban de 3 a 4 segundos a milisegundos usando técnicas avanzadas de optimización de código y bases de datos.",
      "Reduje en más de un 20% el tiempo de ejecución de consultas de bases de datos mediante reindexación, análisis de planes de ejecución y optimización de query builders."
    ],
  },
  {
    role: "Backend Engineer",
    company: "Desarrollo y Optimización de Software",
    period: "2022 — 2024",
    location: "Chile",
    bullets: [
      "Desarrollé APIs REST robustas y escalables utilizando Java, Python (FastAPI/Django) y Node.js (Express).",
      "Mejoré la eficiencia del consumo de memoria y CPU en servidores cloud, traduciéndose en una reducción significativa de costos de infraestructura en la nube.",
      "Autometicé y diseñé pipelines para el procesamiento masivo de datos, asegurando una alta disponibilidad y resiliencia ante picos de demanda."
    ]
  }
];

export const EDUCATION = [
  {
    title: "Ingeniería en Informática / Computación",
    place: "Institución Académica",
    period: "2019 — 2023",
    detail: "Formación centrada en ingeniería de software, bases de datos y algoritmos eficientes.",
  },
];

export const CERTS = [
  { name: "AWS Certified Developer / Cloud Practitioner", org: "Amazon Web Services", year: "2024" },
  { name: "Oracle Certified Professional — Java SE", org: "Oracle", year: "2023" },
  { name: "Especialización en Bases de Datos Relacionales", org: "Udemy / Coursera", year: "2023" },
  { name: "Desarrollo Backend de Alto Rendimiento", org: "Tech Academy", year: "2022" },
];
