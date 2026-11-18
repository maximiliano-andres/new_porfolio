/* English twin of content.js (TI view). Same exports, ids, order and figures: keep both files in sync. */
import { CV as CV_ES } from "./content.js";

/* Project history behind the Skills chart; usage counts are computed from this list, never typed by hand. */
export const PROJECT_HISTORY = [
  {
    id: "document-migrations", name: "Bulk document migrations", org: "Freelance · PUMA, GyG, IACC", period: "2023–2024",
    tech: ["Python", "Node.js", "SQL", "PostgreSQL", "MongoDB"],
  },
  {
    id: "graalvm-microservices", name: "Microservice optimization", org: "BiceVida", period: "2024",
    tech: ["Java", "Spring Boot", "Microservices", "GraalVM Native Image", "SQL", "MySQL", "AWS", "Terraform"],
  },
  {
    id: "buk-migration", name: "Bulk document migration to BUK", org: "Push HR", period: "2024–2026",
    tech: ["Concurrency", "Async processing", "REST APIs"],
  },
  {
    id: "finance-platforms", name: "Internal finance applications", org: "Push HR", period: "2024–2026",
    tech: ["Python", "FastAPI", "Java", "Spring Boot", "SQL", "PostgreSQL", "SQLAlchemy", "Polars", "Pydantic v2", "orjson", "Async processing", "Docker", "uv"],
  },
  {
    id: "pushhr-apis", name: "REST APIs and data flows", org: "Push HR", period: "2024–2026",
    tech: ["Node.js", "REST APIs", "SQL", "MySQL", "MongoDB", "Docker"],
  },
  {
    id: "excel-consolidator", name: "Excel spreadsheet consolidator", org: "HR automation", period: "2026",
    tech: ["Python", "Polars"],
  },
  {
    id: "payroll-history", name: "Searchable payroll history", org: "HR automation", period: "2026",
    tech: ["Python", "SQL", "SQLite"],
  },
  {
    id: "multi-db-workbook", name: "Multi-DB Workbook", org: "Internal tool", period: "2026",
    tech: ["Java", "Spring Boot", "REST APIs", "React", "SQL", "PostgreSQL", "MySQL", "SQL Server", "Oracle", "MariaDB", "SQLite", "Docker"],
  },
  {
    id: "hr-bpo-platform", name: "HR BPO platform", org: "Business project", period: "2026",
    tech: ["Java", "Spring Boot", "GraalVM Native Image", "REST APIs", "Hexagonal architecture", "React", "SQL", "PostgreSQL", "Docker"],
  },
  {
    id: "portfolio", name: "Polyglot Core · this portfolio", org: "Personal project", period: "2026",
    tech: ["Python", "FastAPI", "Node.js", "REST APIs", "Hexagonal architecture", "React", "Docker", "GitHub Actions"],
  },
];

export const TECH_GROUPS = [
  { id: "lang", label: "Languages", items: ["Java", "Python", "Node.js", "SQL"] },
  { id: "backend", label: "Frameworks and architecture", items: ["Spring Boot", "FastAPI", "REST APIs", "Microservices", "Hexagonal architecture", "React"] },
  { id: "data", label: "Databases", items: ["PostgreSQL", "MySQL", "MongoDB", "SQLite", "SQL Server", "Oracle", "MariaDB", "SQLAlchemy"] },
  { id: "perf", label: "Performance", items: ["Async processing", "Concurrency", "GraalVM Native Image", "Polars", "Pydantic v2", "orjson"] },
  { id: "infra", label: "Infrastructure and tools", items: ["Docker", "AWS", "Terraform", "GitHub Actions", "uv"] },
];

export const TECH_KNOWN = ["Express", "Django", "Git", "Postman"];

export const projectsUsing = (tech) => PROJECT_HISTORY.filter((p) => p.tech.includes(tech));

export const PROJECTS = [
  {
    id: "buk-migration",
    title: "Bulk document migration to BUK",
    org: "Push HR",
    langs: [],
    summary:
      "Redesigned the bulk migration of files and documents to the BUK platform with concurrent and asynchronous processing: from over 1 hour down to 5–10 minutes.",
    stack: ["Concurrency", "Async processing", "BUK API", "Traceability"],
    diagram: "migration",
  },
  {
    id: "finance-platforms",
    title: "High-performance internal platforms",
    org: "Push HR",
    langs: ["python", "java"],
    summary:
      "Internal finance management applications, configurable per client and financial format, designed for low resource usage. Optimizing internal platforms cut CPU usage by 30–40% and RAM by 15–30%.",
    stack: ["FastAPI", "Spring Boot", "PostgreSQL", "SQLAlchemy Core", "Polars", "Pydantic v2", "orjson", "Docker"],
    diagram: "finance",
  },
  {
    id: "graalvm-microservices",
    title: "Java microservices: from seconds to milliseconds",
    org: "BiceVida",
    langs: ["java"],
    summary:
      "Spring Boot microservice optimization: response times from 3–4 seconds to milliseconds, 4 services migrated to GraalVM Native Image, SQL queries ≈20% faster and infrastructure migrated to AWS.",
    stack: ["Java", "Spring Boot", "GraalVM Native Image", "MySQL", "AWS", "Terraform"],
    diagram: "native",
  },
  {
    id: "document-migrations",
    title: "Bulk migrations with full traceability",
    org: "Freelance · PUMA, GyG, IACC",
    langs: ["python", "node"],
    summary:
      "Automated bulk document migrations with data normalization and cleanup, a search and validation engine with a 98% match rate (name, RUT and documents) and 100% accurate reports of what was and wasn't migrated.",
    stack: ["Python", "Node.js", "PostgreSQL", "MongoDB", "Data normalization"],
    diagram: "validation",
  },
  {
    id: "hr-bpo-platform",
    title: "HR BPO platform",
    org: "Business project · private code",
    langs: ["java"],
    summary:
      "Multi-company platform to run an HR outsourcing service: full payroll-change cycle with BUK templates, secure integration with the BUK API, document OCR and a corporate calendar.",
    stack: ["Java 21", "Spring Boot", "Hexagonal architecture", "PostgreSQL", "React", "JWT + 2FA", "AES-256-GCM", "Docker"],
    diagram: "hexagonal",
  },
  {
    id: "multi-db-workbook",
    title: "Multi-DB Workbook",
    org: "Internal tool",
    langs: ["java"],
    summary:
      "Turns a corporate database into a safe spreadsheet for HR and Finance: translates codes into real names, joins tables and exports to Excel without writing SQL. Supports 6 engines, read-only, with 258 automated tests.",
    stack: ["Java 21", "Spring Boot", "React", "SQL Server", "PostgreSQL", "MySQL", "Oracle", "Docker"],
    diagram: "workbook",
  },
  {
    id: "payroll-history",
    title: "Payroll history: 3.5 million rows",
    org: "HR automation",
    langs: ["python"],
    summary:
      "Loaded 9 payroll Excel files (2024–2026) into a searchable database: 3.55 million records for 2,006 employees. Row-by-row streaming reads, batch inserts of 10,000 records and indexes to query by employee, pay date and cost center.",
    stack: ["Python", "SQLite", "SQL", "openpyxl (read-only)", "Batch inserts", "Indexes"],
    diagram: "batch",
  },
  {
    id: "excel-consolidator",
    title: "Payroll spreadsheet consolidator",
    org: "HR automation",
    langs: ["python"],
    summary:
      "Desktop app that consolidates many XLSX/XLS spreadsheets (payslips, earnings and deductions) into a single file, with Polars concatenation, memory released between files, background processing and an audit report per file and sheet.",
    stack: ["Python", "Polars", "pandas", "xlsxwriter", "Threading", "PyInstaller"],
    diagram: "consolidator",
  },
  {
    id: "portfolio",
    title: "Polyglot Core · this portfolio",
    org: "Personal project",
    langs: ["python", "node"],
    summary:
      "A desktop-style portfolio. FastAPI API served by Granian (Rust), pure ASGI middleware, prerendered landing screen, per-window lazy loading and Brotli-precompressed assets: ≈730 KB → ≈180 KB (−75%).",
    stack: ["FastAPI", "Granian", "Hexagonal architecture", "React", "Vite", "Brotli", "Docker", "GitHub Actions"],
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
      "Redesigned the bulk migration of files and documents to the BUK platform with concurrent and asynchronous processing, cutting its duration from over 1 hour to 5–10 minutes.",
      "Optimized internal platforms: −30–40% CPU usage and −15–30% RAM usage.",
      "Built internal finance management applications with Python (FastAPI) and Java (Spring Boot), using PostgreSQL, SQLAlchemy, asynchronous processing and Rust-based libraries (Polars, Pydantic v2, orjson).",
      "Sped up SQL queries with SQLAlchemy Core and built REST APIs and data flows that automate operational processes.",
      "Implemented configurable systems for multiple financial formats and automated, traceable reports for HR teams.",
    ],
  },
  {
    role: "Backend Developer (Intern)",
    company: "BiceVida",
    period: "Mar 2024 — Aug 2024",
    location: "Chile",
    bullets: [
      "Cut service response times from 3–4 seconds to milliseconds by optimizing Java microservices.",
      "Migrated 4 Spring Boot microservices to GraalVM Native Image for faster startup and lower memory usage.",
      "Took part in migrating infrastructure and services to AWS, with infrastructure as code (Terraform).",
      "Improved SQL query performance by ≈20% through indexing and database redesign.",
    ],
  },
  {
    role: "Backend Developer",
    company: "Freelance · PUMA, GyG, IACC",
    period: "2023 — 2024",
    location: "Chile",
    bullets: [
      "Automated bulk document migrations with full traceability for companies such as PUMA, GyG and IACC.",
      "Built a search and validation engine with a 98% match rate by name, RUT and documents.",
      "Normalized, cleaned and structured large volumes of data before each migration.",
      "Produced 100% accurate reports of migrated and non-migrated documents, making audits easier.",
    ],
  },
];

export const EDUCATION = [
  {
    title: "University Technician in Computer Programming",
    place: "Universidad Mayor — Santiago, Chile",
    period: "2023 — 2025",
    detail: "Training in software development, programming and databases.",
  },
];

export const CERTS = [
  { name: "ISO 27001 training (Information Security)", org: "Push HR and Hackmetrix", year: "2025" },
  { name: "Oracle Backend training", org: "Oracle Next Education", year: "2023" },
  { name: "Python Native Advanced course", org: "Universidad Mayor", year: "2023" },
];

export const LEARNING = [
  { id: "english", name: "English", detail: "Current level: intermediate (B1–B2)." },
  { id: "architecture", name: "Software architecture", detail: "Already applied: hexagonal architecture in the HR BPO platform and in this portfolio." },
  { id: "cloud", name: "Cloud / AWS", detail: "Hands-on foundation: infrastructure migration to AWS with Terraform at BiceVida." },
];

export const CASES = {
  "buk-migration": {
    context: "Client files and documents had to be moved in bulk to the BUK HR platform. The original process took over 1 hour.",
    approach: [
      "Redesigned the flow with concurrent processing: several documents in flight at once, under a controlled limit.",
      "Asynchronous calls to the BUK API, so the rest of the process isn't blocked while each response is pending.",
      "A traceable report for every document: what was migrated and what wasn't.",
    ],
    result: "From over 1 hour to 5–10 minutes per migration: at least 83% less time.",
    snippet: {
      illustrative: true,
      lang: "pseudocode",
      code: `# Before: one document at a time
for each doc in documents:
    upload_to_buk(doc)        # waits until it finishes
    record(doc)

# After: several in flight, with a limit
limit = semaphore(N)
tasks = [process(doc, limit) for doc in documents]
results = wait_all(tasks)
report(results)               # migrated and not migrated`,
    },
  },
  "finance-platforms": {
    context: "Internal finance management applications that had to adapt to each client and to different financial formats, with bounded resource usage.",
    approach: [
      "Python (FastAPI) and Java (Spring Boot) services on PostgreSQL.",
      "SQL queries sped up with SQLAlchemy Core instead of loading an object per record.",
      "Rust-based libraries (Polars, Pydantic v2, orjson) and asynchronous processing.",
      "Per-client and per-format configuration, with automated, traceable reports.",
    ],
    result: "−30–40% CPU usage and −15–30% RAM usage on internal platforms.",
    snippet: {
      illustrative: true,
      lang: "python",
      code: `# SQLAlchemy Core: explicit SQL and lightweight rows,
# no ORM object created for every record
stmt = (
    select(txn.c.client_id, func.sum(txn.c.amount))
    .where(txn.c.period == period)
    .group_by(txn.c.client_id)
)
with engine.connect() as conn:
    totals = conn.execute(stmt).all()`,
    },
  },
  "graalvm-microservices": {
    context: "Java microservices built with Spring Boot that took 3 to 4 seconds to respond.",
    approach: [
      "Optimized the Spring Boot microservices.",
      "Migrated 4 services to GraalVM Native Image: faster startup and lower memory usage.",
      "Indexing and redesign of the MySQL database.",
      "Took part in migrating infrastructure to AWS with Terraform.",
    ],
    result: "Response times from 3–4 seconds to milliseconds and SQL queries ≈20% faster.",
  },
  "document-migrations": {
    context: "Companies such as PUMA, GyG and IACC needed to migrate large volumes of documents whose data was messy.",
    approach: [
      "Normalized, cleaned and structured the data before each migration.",
      "A search and validation engine that cross-checks name, RUT and document.",
      "Reports of what was and wasn't migrated, to make audits easier.",
    ],
    result: "98% automatic match rate and 100% accurate reports.",
  },
  "hr-bpo-platform": {
    context: "An HR outsourcing service needed to run the payroll changes of many client companies in one place.",
    approach: [
      "Java 21 and Spring Boot with hexagonal architecture; React SPA; PostgreSQL.",
      "Full payroll-change cycle with BUK templates and secure integration with the BUK API.",
      "Security: JWT with two-factor authentication (2FA) and AES-256-GCM encryption.",
      "Document OCR and a corporate calendar.",
    ],
    result: "The whole payroll-change cycle in a single tool, backed by ~1,100 automated tests.",
  },
  "multi-db-workbook": {
    context: "HR and Finance depended on IT to get reports, and the data arrived full of codes.",
    approach: [
      "Spreadsheet-like React interface on top of a Java 21 / Spring Boot API.",
      "Codes translated into real names and tables joined without writing SQL.",
      "Read-only access to 6 engines: SQL Server, PostgreSQL, MySQL, Oracle, MariaDB and SQLite.",
    ],
    result: "Non-technical teams export to Excel on their own, with 258 automated tests.",
  },
  "payroll-history": {
    context: "The 2024–2026 payroll history was spread across 9 Excel spreadsheets too large to open and cross-reference smoothly.",
    approach: [
      "Row-by-row streaming reads, without loading each file into memory.",
      "Batch inserts of 10,000 records.",
      "Indexes to query by employee, pay date and cost center.",
    ],
    result: "3.55 million records for 2,006 employees in a single searchable database.",
    evidence: "Figures measured on the resulting database.",
    snippet: {
      illustrative: true,
      lang: "python",
      code: `BATCH = 10_000
wb = load_workbook(path, read_only=True)    # streaming
batch = []
for row in wb.active.iter_rows(min_row=2, values_only=True):
    batch.append(row)
    if len(batch) == BATCH:
        conn.executemany(INSERT_SQL, batch)
        batch.clear()
if batch:
    conn.executemany(INSERT_SQL, batch)`,
    },
  },
  "excel-consolidator": {
    context: "Consolidating many payslip, earnings and deductions spreadsheets by hand took time and was error-prone.",
    approach: [
      "Desktop application (PyInstaller) with processing in the background.",
      "Concatenation with Polars and memory released between files.",
      "Audit report per file and per sheet.",
    ],
    result: "A single consolidated file per spreadsheet type, tracking how many rows each file contributed.",
    snippet: {
      illustrative: true,
      lang: "python",
      code: `parts, audit = [], []
for file in files:
    df = pl.read_excel(file)
    audit.append((file.name, df.height))  # rows per file
    parts.append(df)
consolidated = pl.concat(parts, how="diagonal")`,
    },
  },
  "portfolio": {
    context: "A desktop-style site with many windows and animations risks being heavy and slow.",
    approach: [
      "Landing screen prerendered at build time: it shows before JavaScript loads.",
      "Each window is downloaded only when it opens (lazy loading).",
      "Files precompressed with Brotli and gzip; FastAPI API with hexagonal architecture served by Granian.",
    ],
    result: "The site's files are ≈75% lighter over the wire.",
    evidence: "Measured on the production build (npm run build).",
    snippet: {
      illustrative: false,
      lang: "javascript",
      code: `// frontend/scripts/compress.mjs (real code from this site)
const [b, g] = await Promise.all([
  brotliAsync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }),
  gzipAsync(data, { level: 9 }),
]);
if (b.length < data.length) writes.push(writeFile(\`\${path}.br\`, b));
if (g.length < data.length) writes.push(writeFile(\`\${path}.gz\`, g));`,
    },
  },
};

export const CV = { ...CV_ES, updated: "Updated Nov 2026" };
