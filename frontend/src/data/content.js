/* Portfolio content in technical language (TI view). Loaded only by window chunks; shell data lives in shell.js. */

/* Project history behind the Skills chart. Every `tech` entry comes from the CV, LinkedIn or the
   project's own repository; usage counts are computed from this list, never typed by hand. */
export const PROJECT_HISTORY = [
  {
    id: "document-migrations", name: "Migraciones masivas de documentos", org: "Freelance · PUMA, GyG, IACC", period: "2023–2024",
    tech: ["Python", "Node.js", "SQL", "PostgreSQL", "MongoDB"],
  },
  {
    id: "graalvm-microservices", name: "Optimización de microservicios", org: "BiceVida", period: "2024",
    tech: ["Java", "Spring Boot", "Microservicios", "GraalVM Native Image", "SQL", "MySQL", "AWS", "Terraform"],
  },
  {
    id: "buk-migration", name: "Migración masiva de documentos a BUK", org: "Push HR", period: "2024–2026",
    tech: ["Concurrencia", "Procesamiento asincrónico", "APIs REST"],
  },
  {
    id: "finance-platforms", name: "Aplicaciones internas de finanzas", org: "Push HR", period: "2024–2026",
    tech: ["Python", "FastAPI", "Java", "Spring Boot", "SQL", "PostgreSQL", "SQLAlchemy", "Polars", "Pydantic v2", "orjson", "Procesamiento asincrónico", "Docker", "uv"],
  },
  {
    id: "pushhr-apis", name: "APIs REST y flujos de datos", org: "Push HR", period: "2024–2026",
    tech: ["Node.js", "APIs REST", "SQL", "MySQL", "MongoDB", "Docker"],
  },
  {
    id: "excel-consolidator", name: "Consolidador de planillas Excel", org: "Automatización RRHH", period: "2026",
    tech: ["Python", "Polars"],
  },
  {
    id: "payroll-history", name: "Histórico de nómina consultable", org: "Automatización RRHH", period: "2026",
    tech: ["Python", "SQL", "SQLite"],
  },
  {
    id: "multi-db-workbook", name: "Multi-DB Workbook", org: "Herramienta interna", period: "2026",
    tech: ["Java", "Spring Boot", "APIs REST", "React", "SQL", "PostgreSQL", "MySQL", "SQL Server", "Oracle", "MariaDB", "SQLite", "Docker"],
  },
  {
    id: "hr-bpo-platform", name: "Plataforma BPO de Recursos Humanos", org: "Proyecto empresarial", period: "2026",
    tech: ["Java", "Spring Boot", "GraalVM Native Image", "APIs REST", "Arquitectura hexagonal", "React", "SQL", "PostgreSQL", "Docker"],
  },
  {
    id: "portfolio", name: "Polyglot Core · este portafolio", org: "Proyecto personal", period: "2026",
    tech: ["Python", "FastAPI", "Node.js", "APIs REST", "Arquitectura hexagonal", "React", "Docker", "GitHub Actions"],
  },
];

/* display order of the chart; technologies used in no project are skipped (list those under `TECH_KNOWN`) */
export const TECH_GROUPS = [
  { id: "lang", label: "Lenguajes", items: ["Java", "Python", "Node.js", "SQL"] },
  { id: "backend", label: "Frameworks y arquitectura", items: ["Spring Boot", "FastAPI", "APIs REST", "Microservicios", "Arquitectura hexagonal", "React"] },
  { id: "data", label: "Bases de datos", items: ["PostgreSQL", "MySQL", "MongoDB", "SQLite", "SQL Server", "Oracle", "MariaDB", "SQLAlchemy"] },
  { id: "perf", label: "Rendimiento", items: ["Procesamiento asincrónico", "Concurrencia", "GraalVM Native Image", "Polars", "Pydantic v2", "orjson"] },
  { id: "infra", label: "Infraestructura y herramientas", items: ["Docker", "AWS", "Terraform", "GitHub Actions", "uv"] },
];

/* in the CV but not tied to a specific project yet: shown as plain chips, without a count */
export const TECH_KNOWN = ["Express", "Django", "Git", "Postman"];

/* projects that used a technology, in history order */
export const projectsUsing = (tech) => PROJECT_HISTORY.filter((p) => p.tech.includes(tech));

/* `org` = where the work was done; private/internal names are deliberately omitted */
export const PROJECTS = [
  {
    id: "buk-migration",
    title: "Migración masiva de documentos a BUK",
    org: "Push HR",
    langs: [], // the CV doesn't state the language of this process
    summary:
      "Rediseño del proceso de migración masiva de archivos y documentos hacia la plataforma BUK con procesamiento concurrente y asincrónico: pasó de más de 1 hora a 5–10 minutos.",
    stack: ["Concurrencia", "Procesamiento asincrónico", "API BUK", "Trazabilidad"],
    diagram: "migration",
  },
  {
    id: "finance-platforms",
    title: "Plataformas internas de alto rendimiento",
    org: "Push HR",
    langs: ["python", "java"],
    summary:
      "Aplicaciones internas de gestión de finanzas, configurables por cliente y formato financiero, diseñadas para bajo consumo de recursos. La optimización de plataformas internas redujo el uso de CPU en 30–40% y de RAM en 15–30%.",
    stack: ["FastAPI", "Spring Boot", "PostgreSQL", "SQLAlchemy Core", "Polars", "Pydantic v2", "orjson", "Docker"],
    diagram: "finance",
  },
  {
    id: "graalvm-microservices",
    title: "Microservicios Java: de segundos a milisegundos",
    org: "BiceVida",
    langs: ["java"],
    summary:
      "Optimización de microservicios Spring Boot: tiempos de respuesta de 3–4 segundos a milisegundos, 4 servicios migrados a GraalVM Native Image, consultas SQL ≈20% más rápidas y migración de infraestructura a AWS.",
    stack: ["Java", "Spring Boot", "GraalVM Native Image", "MySQL", "AWS", "Terraform"],
    diagram: "native",
  },
  {
    id: "document-migrations",
    title: "Migraciones masivas con trazabilidad total",
    org: "Freelance · PUMA, GyG, IACC",
    langs: ["python", "node"],
    summary:
      "Automatización de migraciones masivas de documentos con normalización y limpieza de datos, un motor de búsqueda y validación con 98% de coincidencia (nombre, RUT y documentos) y reportes 100% exactos de lo migrado y no migrado.",
    stack: ["Python", "Node.js", "PostgreSQL", "MongoDB", "Normalización de datos"],
    diagram: "validation",
  },
  {
    id: "hr-bpo-platform",
    title: "Plataforma BPO de Recursos Humanos",
    org: "Proyecto empresarial · código privado",
    langs: ["java"],
    summary:
      "Plataforma multiempresa para operar un servicio de outsourcing de RRHH: ciclo completo de novedades de nómina con plantillas BUK, integración segura con la API de BUK, OCR de documentos y calendario corporativo.",
    stack: ["Java 21", "Spring Boot", "Arquitectura hexagonal", "PostgreSQL", "React", "JWT + 2FA", "AES-256-GCM", "Docker"],
    diagram: "hexagonal",
  },
  {
    id: "multi-db-workbook",
    title: "Multi-DB Workbook",
    org: "Herramienta interna",
    langs: ["java"],
    summary:
      "Convierte una base de datos corporativa en una hoja de cálculo segura para RRHH y Finanzas: traduce códigos a nombres reales, cruza tablas y exporta a Excel sin escribir SQL. Compatible con 6 motores, en modo solo lectura y con 258 pruebas automatizadas.",
    stack: ["Java 21", "Spring Boot", "React", "SQL Server", "PostgreSQL", "MySQL", "Oracle", "Docker"],
    diagram: "workbook",
  },
  {
    id: "payroll-history",
    title: "Histórico de nómina: 3,5 millones de filas",
    org: "Automatización RRHH",
    langs: ["python"],
    summary:
      "Carga de 9 archivos Excel de nómina (2024–2026) a una base consultable: 3,55 millones de registros de 2.006 trabajadores. Lectura en streaming fila a fila, inserción por lotes de 10.000 registros e índices para consultar por trabajador, fecha de pago y centro de costo.",
    stack: ["Python", "SQLite", "SQL", "openpyxl (read-only)", "Inserción por lotes", "Índices"],
    diagram: "batch",
  },
  {
    id: "excel-consolidator",
    title: "Consolidador de planillas de remuneraciones",
    org: "Automatización RRHH",
    langs: ["python"],
    summary:
      "Aplicación de escritorio que consolida múltiples planillas XLSX/XLS (liquidaciones, haberes y descuentos) en un solo archivo, con concatenación en Polars, liberación de memoria entre archivos, procesamiento en segundo plano y reporte de auditoría por archivo y hoja.",
    stack: ["Python", "Polars", "pandas", "xlsxwriter", "Threading", "PyInstaller"],
    diagram: "consolidator",
  },
  {
    id: "portfolio",
    title: "Polyglot Core · este portafolio",
    org: "Proyecto personal",
    langs: ["python", "node"],
    summary:
      "Portafolio con forma de escritorio. API en FastAPI servida por Granian (Rust), middleware ASGI puro, portada pre-renderizada, carga diferida por ventana y assets precomprimidos con Brotli: ≈540 KB → ≈140 KB (−74%).",
    stack: ["FastAPI", "Granian", "Arquitectura hexagonal", "React", "Vite", "Brotli", "Docker", "GitHub Actions"],
    diagram: "webperf",
  },
];

export const EXPERIENCE = [
  {
    role: "Backend Developer",
    company: "Push HR",
    period: "2024 — 2026",
    location: "Chile",
    bullets: [
      "Rediseñé la migración masiva de archivos y documentos hacia la plataforma BUK con procesamiento concurrente y asincrónico, reduciendo su duración de más de 1 hora a 5–10 minutos.",
      "Optimicé plataformas internas: −30–40% de uso de CPU y −15–30% de consumo de memoria RAM.",
      "Desarrollé aplicaciones internas de gestión de finanzas con Python (FastAPI) y Java (Spring Boot), con PostgreSQL, SQLAlchemy, procesamiento asincrónico y librerías basadas en Rust (Polars, Pydantic v2, orjson).",
      "Aceleré consultas SQL con SQLAlchemy Core y desarrollé APIs REST y flujos de datos que automatizan procesos operativos.",
      "Implementé sistemas configurables para múltiples formatos financieros y reportes automáticos y trazables para equipos de RRHH.",
    ],
  },
  {
    role: "Backend Developer (Practicante)",
    company: "BiceVida",
    period: "Mar 2024 — Ago 2024",
    location: "Chile",
    bullets: [
      "Reduje los tiempos de respuesta de servicios de 3–4 segundos a milisegundos optimizando microservicios Java.",
      "Migré 4 microservicios Spring Boot a GraalVM Native Image para un arranque más rápido y menor consumo de memoria.",
      "Participé en la migración de infraestructura y servicios a AWS, con infraestructura como código (Terraform).",
      "Mejoré en ≈20% el rendimiento de consultas SQL mediante indexación y rediseño de la base de datos.",
    ],
  },
  {
    role: "Backend Developer",
    company: "Freelance · PUMA, GyG, IACC",
    period: "2023 — 2024",
    location: "Chile",
    bullets: [
      "Automaticé migraciones masivas de documentos con trazabilidad completa para empresas como PUMA, GyG e IACC.",
      "Desarrollé un motor de búsqueda y validación con 98% de coincidencia por nombre, RUT y documentos.",
      "Normalicé, limpié y estructuré grandes volúmenes de datos antes de cada migración.",
      "Generé reportes 100% exactos de documentos migrados y no migrados, facilitando la auditoría.",
    ],
  },
];

export const EDUCATION = [
  {
    title: "Técnico Universitario en Programación Computacional",
    place: "Universidad Mayor — Santiago, Chile",
    period: "2023 — 2025",
    detail: "Formación en desarrollo de software, programación y bases de datos.",
  },
];

export const CERTS = [
  { name: "Capacitación ISO 27001 (Seguridad de la Información)", org: "Push HR y Hackmetrix", year: "2025" },
  { name: "Capacitación Oracle Backend", org: "Oracle Next Education", year: "2023" },
  { name: "Curso Python Native Avances", org: "Universidad Mayor", year: "2023" },
];

/* CV shown in the "Mi CV" window. Source: docs/cv/. When the CV changes: copy the PDF to public/cv/ and
   re-render the pages under a NEW version prefix (the service worker caches /img/* forever):
     pdftocairo -png -scale-to-x 1240 -scale-to-y -1 CV.pdf p1240   (and 760)  →  cwebp -q 85 / sips → .jpg */
const CV_VERSION = "2026-11";
export const CV = {
  pdf: "/cv/CV_Maximiliano_Caniullan.pdf",
  fileName: "CV_Maximiliano_Caniullan.pdf",
  size: "94 KB",
  updated: "Actualizado nov. 2026",
  pages: [1, 2].map((n) => ({
    webp: `/img/cv/cv-${CV_VERSION}-p${n}-1240.webp`,
    webpSmall: `/img/cv/cv-${CV_VERSION}-p${n}-760.webp`,
    jpg: `/img/cv/cv-${CV_VERSION}-p${n}-1240.jpg`,
  })),
};
