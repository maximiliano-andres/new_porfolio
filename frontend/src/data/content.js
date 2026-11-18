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
      "Portafolio con forma de escritorio. API en FastAPI servida por Granian (Rust), middleware ASGI puro, portada pre-renderizada, carga diferida por ventana y assets precomprimidos con Brotli: ≈730 KB → ≈180 KB (−75%).",
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

/* topics being studied right now (shown in Formación and in the "Estudio constante" hobby) */
export const LEARNING = [
  { id: "english", name: "Inglés", detail: "Nivel actual: intermedio (B1–B2)." },
  { id: "architecture", name: "Arquitectura de software", detail: "Ya aplicada: arquitectura hexagonal en la Plataforma BPO de RRHH y en este portafolio." },
  { id: "cloud", name: "Cloud / AWS", detail: "Base práctica: migración de infraestructura a AWS con Terraform en BiceVida." },
];

/* case studies for the TI project detail, keyed by project id. Only facts from the CV, LinkedIn or the project
   itself. `snippet.illustrative`: true when the code shows the pattern, not the client's code (always labelled). */
export const CASES = {
  "buk-migration": {
    context: "Los archivos y documentos de los clientes debían trasladarse en forma masiva a la plataforma de RRHH BUK. El proceso original tardaba más de 1 hora.",
    approach: [
      "Rediseño del flujo con procesamiento concurrente: varios documentos en curso a la vez, con un límite controlado.",
      "Llamadas asincrónicas a la API de BUK, sin bloquear el resto del proceso mientras se espera cada respuesta.",
      "Reporte trazable de cada documento: qué se migró y qué no.",
    ],
    result: "De más de 1 hora a 5–10 minutos por migración: al menos un 83 % menos de tiempo.",
    snippet: {
      illustrative: true,
      lang: "pseudocódigo",
      code: `# Antes: un documento a la vez
para cada doc en documentos:
    subir_a_buk(doc)          # espera a que termine
    registrar(doc)

# Después: varios en curso, con un límite
limite = semaforo(N)
tareas = [procesar(doc, limite) para doc en documentos]
resultados = esperar_todas(tareas)
reporte(resultados)           # migrados y no migrados`,
    },
  },
  "finance-platforms": {
    context: "Aplicaciones internas de gestión de finanzas que debían adaptarse a cada cliente y a distintos formatos financieros, con un consumo de recursos acotado.",
    approach: [
      "Servicios en Python (FastAPI) y Java (Spring Boot) sobre PostgreSQL.",
      "Consultas SQL aceleradas con SQLAlchemy Core en lugar de cargar objetos por registro.",
      "Librerías basadas en Rust (Polars, Pydantic v2, orjson) y procesamiento asincrónico.",
      "Configuración por cliente y formato financiero, con reportes automáticos y trazables.",
    ],
    result: "−30–40 % de uso de CPU y −15–30 % de consumo de memoria RAM en plataformas internas.",
    snippet: {
      illustrative: true,
      lang: "python",
      code: `# SQLAlchemy Core: SQL explícito y filas livianas,
# sin crear un objeto ORM por cada registro
stmt = (
    select(mov.c.cliente_id, func.sum(mov.c.monto))
    .where(mov.c.periodo == periodo)
    .group_by(mov.c.cliente_id)
)
with engine.connect() as conn:
    totales = conn.execute(stmt).all()`,
    },
  },
  "graalvm-microservices": {
    context: "Microservicios Java con Spring Boot que tardaban entre 3 y 4 segundos en responder.",
    approach: [
      "Optimización de los microservicios Spring Boot.",
      "Migración de 4 servicios a GraalVM Native Image: arranque más rápido y menor consumo de memoria.",
      "Indexación y rediseño de la base de datos MySQL.",
      "Participación en la migración de infraestructura a AWS con Terraform.",
    ],
    result: "Tiempos de respuesta de 3–4 segundos a milisegundos y consultas SQL ≈20 % más rápidas.",
  },
  "document-migrations": {
    context: "Empresas como PUMA, GyG e IACC necesitaban migrar grandes volúmenes de documentos cuyos datos venían desordenados.",
    approach: [
      "Normalización, limpieza y estructuración de los datos antes de cada migración.",
      "Motor de búsqueda y validación que cruza nombre, RUT y documento.",
      "Reportes de lo migrado y lo no migrado para facilitar la auditoría.",
    ],
    result: "98 % de coincidencia automática y reportes 100 % exactos.",
  },
  "hr-bpo-platform": {
    context: "Un servicio de outsourcing de RRHH necesitaba operar las novedades de nómina de muchas empresas cliente en un solo lugar.",
    approach: [
      "Java 21 y Spring Boot con arquitectura hexagonal; SPA en React; PostgreSQL.",
      "Ciclo completo de novedades de nómina con plantillas BUK e integración segura con la API de BUK.",
      "Seguridad: JWT con doble factor (2FA) y cifrado AES-256-GCM.",
      "OCR de documentos y calendario corporativo.",
    ],
    result: "Todo el ciclo de novedades en una sola herramienta, respaldada por ~1.100 pruebas automatizadas.",
  },
  "multi-db-workbook": {
    context: "RRHH y Finanzas dependían de TI para obtener reportes, y los datos llegaban llenos de códigos.",
    approach: [
      "Interfaz tipo planilla en React sobre una API Java 21 / Spring Boot.",
      "Traducción de códigos a nombres reales y cruce de tablas sin escribir SQL.",
      "Acceso en modo solo lectura a 6 motores: SQL Server, PostgreSQL, MySQL, Oracle, MariaDB y SQLite.",
    ],
    result: "Equipos no técnicos exportan a Excel por su cuenta, con 258 pruebas automatizadas.",
  },
  "payroll-history": {
    context: "El historial de remuneraciones 2024–2026 estaba repartido en 9 planillas Excel demasiado grandes para abrir y cruzar con fluidez.",
    approach: [
      "Lectura en streaming, fila a fila, sin cargar cada archivo completo en memoria.",
      "Inserción por lotes de 10.000 registros.",
      "Índices para consultar por trabajador, fecha de pago y centro de costo.",
    ],
    result: "3,55 millones de registros de 2.006 trabajadores en una sola base consultable.",
    evidence: "Cifras medidas sobre la base de datos resultante.",
    snippet: {
      illustrative: true,
      lang: "python",
      code: `LOTE = 10_000
wb = load_workbook(ruta, read_only=True)    # streaming
lote = []
for fila in wb.active.iter_rows(min_row=2, values_only=True):
    lote.append(fila)
    if len(lote) == LOTE:
        conn.executemany(INSERT_SQL, lote)
        lote.clear()
if lote:
    conn.executemany(INSERT_SQL, lote)`,
    },
  },
  "excel-consolidator": {
    context: "Consolidar a mano muchas planillas de liquidaciones, haberes y descuentos tomaba tiempo y se prestaba a errores.",
    approach: [
      "Aplicación de escritorio (PyInstaller) con el procesamiento en segundo plano.",
      "Concatenación con Polars y liberación de memoria entre archivos.",
      "Reporte de auditoría por archivo y por hoja.",
    ],
    result: "Un consolidado único por tipo de planilla, con control de cuántas filas aportó cada archivo.",
    snippet: {
      illustrative: true,
      lang: "python",
      code: `partes, auditoria = [], []
for archivo in archivos:
    df = pl.read_excel(archivo)
    auditoria.append((archivo.name, df.height))  # filas por archivo
    partes.append(df)
consolidado = pl.concat(partes, how="diagonal")`,
    },
  },
  "portfolio": {
    context: "Un sitio con forma de escritorio, muchas ventanas y animaciones corre el riesgo de ser pesado y lento.",
    approach: [
      "Portada pre-renderizada en el build: se ve antes de que cargue JavaScript.",
      "Cada ventana se descarga solo cuando se abre (carga diferida).",
      "Archivos precomprimidos con Brotli y gzip; API en FastAPI con arquitectura hexagonal servida por Granian.",
    ],
    result: "Los archivos del sitio pesan ≈75 % menos al enviarse.",
    evidence: "Medido en el build de producción (npm run build).",
    snippet: {
      illustrative: false,
      lang: "javascript",
      code: `// frontend/scripts/compress.mjs (código real de este sitio)
const [b, g] = await Promise.all([
  brotliAsync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }),
  gzipAsync(data, { level: 9 }),
]);
if (b.length < data.length) writes.push(writeFile(\`\${path}.br\`, b));
if (g.length < data.length) writes.push(writeFile(\`\${path}.gz\`, g));`,
    },
  },
};

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
