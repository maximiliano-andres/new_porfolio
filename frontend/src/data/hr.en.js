/* English twin of hr.js (RRHH view). Same exports, ids and order; icons and colors come from the Spanish file.
   Competency `tech` names match content.en.js so the per-project counts stay identical. */
import * as ES from "./hr.js";

const merge = (list, en) => list.map((item, i) => ({ ...item, ...en[i] }));

export const HR_FACTS = merge(ES.HR_FACTS, [
  { label: "Experience", value: "2+ years" },
  { label: "Location", value: "Peñaflor, Santiago Metro Region · Chile" },
  { label: "Work mode", value: "Remote or on-site" },
  { label: "English", value: "Intermediate (B1–B2)" },
  { label: "Availability", value: "Immediate" },
]);

export const HR_KPIS = merge(ES.HR_KPIS, [
  { label: "Document migration time", detail: "From over 1 hour to 5–10 minutes" },
  { label: "Response time", detail: "It used to take 3–4 seconds" },
  { label: "Processor (CPU) usage", detail: "And −15–30% memory usage" },
]);

export const HR_SEEKING = {
  roles: [
    "Backend with Java and Spring Boot",
    "Backend with Python (FastAPI)",
    "HR-tech, payroll or ERP companies",
    "Performance optimization and data processing",
  ],
  text: "I'm looking to join a tech team where performance, code quality and architecture are a priority, and where optimizing a system has a direct impact on the business.",
};

export const HR_DOMAIN = {
  intro: "Almost all my experience is in technology for Human Resources. Beyond coding, I know the business: I understand what a payroll change, a payslip or a cost center is.",
  items: [
    { term: "BUK platform", evidence: "Bulk document migration (from over 1 hour to 5–10 minutes) and integration with its API." },
    { term: "Payroll changes", evidence: "BPO platform: upload, review, processing and close with BUK templates, for many client companies." },
    { term: "Payslips, earnings and deductions", evidence: "Automatic consolidator of payroll spreadsheets, with an audit per file." },
    { term: "Payroll history", evidence: "3.55 million records for 2,006 employees, searchable by employee, pay date and cost center." },
    { term: "People data (RUT, the Chilean national ID, and documents)", evidence: "Validation by name, RUT and document with a 98% match rate." },
    { term: "Personal data protection", evidence: "ISO 27001 training; a platform with two-factor authentication and encrypted data." },
  ],
};

export const HR_WORKSTYLE = merge(ES.HR_WORKSTYLE, [
  { title: "I measure before and after", evidence: "Every result has a number: from 1+ h to 5–10 min, −30–40% CPU, from 3–4 s to milliseconds." },
  { title: "I build for non-technical users", evidence: "Multi-DB Workbook: HR and Finance get their own reports without writing SQL or waiting on IT." },
  { title: "Traceability and auditing", evidence: "100% accurate reports of what was migrated and what's pending; per-file audit in the consolidator." },
  { title: "Quality through automated tests", evidence: "~1,100 tests in the BPO platform, 258 in Multi-DB Workbook and 137 in this portfolio's backend." },
  { title: "I document what I learn", evidence: "My own guide to concurrency and data access: 43 problems with examples in Java, Python and Node.js." },
  { title: "Security by design", evidence: "ISO 27001 training; two-factor authentication, AES-256-GCM encryption and security headers in my projects." },
]);

export const HR_VALUE = merge(ES.HR_VALUE, [
  { title: "Faster processes", text: "I turn slow, heavy processes into fast, stable systems: tasks that took over an hour now finish in minutes." },
  { title: "Lower resource usage", text: "I make systems do more with less: less processor and memory usage, which lowers the cost of running them." },
  { title: "Reliable, traceable data", text: "I automate migrations, validations and reports over large volumes of information, keeping track of every record processed." },
]);

export const HR_ROLES = ["Backend Developer", "Software Developer", "Java Developer", "Python Developer", "Node.js Developer"];

export const ATS_KEYWORDS = [
  "Backend", "Java", "Spring Boot", "GraalVM Native Image", "Python", "FastAPI", "Django",
  "Node.js", "Express", "REST API", "Microservices", "SQL", "PostgreSQL", "MySQL", "MongoDB",
  "SQLAlchemy", "Polars", "Pydantic v2", "AWS", "Docker", "Git", "Concurrency",
  "Asynchronous processing", "Performance optimization", "Data migration",
];

export const HR_COMPETENCIES = merge(ES.HR_COMPETENCIES, [
  {
    area: "Performance optimization",
    plain: "I find a system's bottlenecks and make it respond faster while using less processor and memory.",
    tech: ["GraalVM Native Image", "Concurrency", "Async processing", "Polars", "orjson"],
  },
  {
    area: "Building business systems",
    plain: "I build the “engine” of applications: it processes information, applies the business rules and connects services together.",
    tech: ["Java", "Spring Boot", "Python", "FastAPI", "Django", "Node.js", "Express"],
  },
  {
    area: "Data migration and quality",
    plain: "I move large volumes of information between systems without losing anything: I validate, clean and leave a report for every record.",
    tech: ["Bulk migration", "Normalization", "Validation", "Automated reports"],
  },
  {
    area: "Database management",
    plain: "I organize and speed up the “digital filing cabinets” where a company keeps its information: clients, payrolls, records.",
    tech: ["SQL", "PostgreSQL", "MySQL", "MongoDB", "SQLAlchemy"],
  },
  {
    area: "System integration",
    plain: "I build the “bridges” that let different applications exchange information in an orderly, secure way.",
    tech: ["REST APIs", "Microservices", "BUK API"],
  },
  {
    area: "Cloud and infrastructure",
    plain: "I deploy applications on Amazon's servers (AWS) and package them so they run the same in any environment.",
    tech: ["AWS", "Docker", "Git"],
  },
]);

export const HR_GLOSSARY = [
  { term: "Backend", def: "An application's “kitchen”: you don't see it, but it prepares every order the user places." },
  { term: "API", def: "The “waiter” between systems: it carries requests and brings back answers in an orderly way." },
  { term: "Java · Python · Node.js", def: "Programming languages widely used in companies. Knowing all three makes it easy to fit into the team." },
  { term: "Spring Boot · FastAPI · Django", def: "Frameworks: toolkits that speed up development in each language." },
  { term: "Database (SQL)", def: "The organized digital filing cabinet where a company stores and looks up its information." },
  { term: "Cloud (AWS)", def: "Servers rented from Amazon and paid for by usage; optimizing means saving money." },
  { term: "Docker", def: "Packages an application with everything it needs, like a shipping container." },
  { term: "Latency", def: "The waiting time between a user's click and the response." },
];

export const HR_PROJECTS = {
  "buk-migration": {
    title: "Document migration: from 1 hour to 10 minutes",
    challenge: "Moving client files and documents in bulk to the BUK HR platform took over an hour.",
    action: "I redesigned the process to handle many documents at once, with no needless waiting between them.",
    result: "It now finishes in 5–10 minutes: over 83% less time.",
    before: "1+ h", after: "5–10 min",
  },
  "finance-platforms": {
    title: "Finance applications that use fewer resources",
    challenge: "The internal platforms used a lot of processor and memory, and every client needed different financial formats.",
    action: "I built client-configurable applications with high-performance tools and optimized their resource usage.",
    result: "30% to 40% less processor usage and 15% to 30% less memory.",
    before: null, after: "−30–40% CPU",
  },
  "graalvm-microservices": {
    title: "Instant responses in BiceVida's services",
    challenge: "Some services took 3 to 4 seconds to respond.",
    action: "I optimized the services, moved them to a fast-startup technology and sped up the database queries.",
    result: "Response time dropped from seconds to milliseconds and queries improved by about 20%.",
    before: "3–4 s", after: "< 1 s",
  },
  "document-migrations": {
    title: "Migrations without losing a single document",
    challenge: "Companies such as PUMA, GyG and IACC needed to move large volumes of documents with messy data.",
    action: "I automated the migration, cleaned the data and built a search tool that validates each document by name, RUT and file.",
    result: "98% automatic match rate and 100% accurate reports of what was migrated and what's pending.",
    before: null, after: "98%",
  },
  "hr-bpo-platform": {
    title: "A platform to manage payroll for many companies",
    challenge: "An HR outsourcing service needed to organize the payroll changes of many client companies in one place.",
    action: "I developed a secure platform (two-factor authentication and encrypted data) connected directly to BUK.",
    result: "The whole payroll-change cycle —upload, review, processing and close— in a single tool, backed by ~1,100 automated tests.",
    before: null, after: "~1,100 tests",
  },
  "multi-db-workbook": {
    title: "Reports without depending on IT",
    challenge: "To get a report, HR and Finance had to ask IT and received data full of codes.",
    action: "I created a spreadsheet-like tool to explore, cross-reference and download data to Excel with a few clicks.",
    result: "Non-technical teams look up information on their own, safely (read-only) and across 6 types of databases.",
    before: null, after: "6 engines",
  },
  "payroll-history": {
    title: "3.5 million payroll records, searchable",
    challenge: "The payroll history was spread across huge Excel spreadsheets, impossible to open and cross-reference smoothly.",
    action: "I automated loading them into a database, reading the files in parts and saving thousands of records at a time.",
    result: "3.55 million records for 2,006 employees in one place, ready to search by person, date or cost center.",
    before: "9 spreadsheets", after: "1 database",
  },
  "excel-consolidator": {
    title: "Payroll spreadsheets merged in one click",
    challenge: "Consolidating many payslip, earnings and deductions spreadsheets by hand took time and was error-prone.",
    action: "I created a desktop app that merges them automatically and leaves a control report for each file.",
    result: "A single consolidated file per spreadsheet type, with an audit confirming how many rows were copied from each file.",
    before: "Manual", after: "Automatic",
  },
  "portfolio": {
    title: "A portfolio that loads fast",
    challenge: "An interactive site with many windows and animations risks being heavy and slow.",
    action: "I built it to load only what's needed, with the landing screen ready in advance and compressed files.",
    result: "The site's files are 75% lighter when sent (from ≈730 KB to ≈180 KB).",
    before: "≈730 KB", after: "≈180 KB",
  },
};

export const HR_EXPERIENCE = [
  {
    plainRole: "Backend Developer",
    bullets: [
      "Cut the bulk document migration to BUK from over 1 hour to 5–10 minutes.",
      "Reduced processor usage by 30–40% and memory by 15–30% on internal platforms.",
      "Built internal finance applications adaptable to each client's requirements.",
      "Automated complete, traceable reports for HR teams.",
    ],
  },
  {
    plainRole: "Backend Developer intern",
    bullets: [
      "Made services that took 3–4 seconds respond practically instantly.",
      "Modernized 4 services so they start faster and use less memory.",
      "Took part in moving the infrastructure to Amazon's cloud (AWS).",
      "Sped up database queries by about 20%.",
    ],
  },
  {
    plainRole: "Freelance Backend Developer",
    bullets: [
      "Automated bulk document migrations for companies such as PUMA, GyG and IACC.",
      "Built a search tool that validates documents with a 98% match rate by name, RUT and file.",
      "Delivered 100% accurate reports of what was migrated and what's pending, making audits easier.",
    ],
  },
];

export const HR_CERT_NOTES = {
  "ISO 27001 training (Information Security)": "International information security standard: how to protect the data of the company and its clients.",
  "Oracle Backend training": "Backend development training program by Oracle Next Education.",
  "Python Native Advanced course": "Python course taught by Universidad Mayor.",
};
