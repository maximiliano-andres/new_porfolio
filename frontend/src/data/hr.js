/* Plain-language (RRHH) versions of the portfolio content. Only re-explains existing facts. */
import { Briefcase, Gauge, Laptop, MapPin, ShieldCheck, Sparkles, TrendingDown } from "lucide-react";
import { CORE, HR_ACCENT, LANG } from "../styles/theme.js";

export const HR_FACTS = [
  { Icon: Briefcase, label: "Experiencia", value: "+2 años" },
  { Icon: MapPin, label: "Ubicación", value: "Peñaflor, RM · Chile" },
  { Icon: Laptop, label: "Modalidad", value: "Remoto o presencial" },
  { Icon: Sparkles, label: "Estado", value: "Disponible" },
];

export const HR_KPIS = [
  { value: "−83%", label: "Tiempo de migración de documentos", detail: "De más de 1 hora a 5–10 minutos", client: "Push HR · BUK", color: LANG.java.c1 },
  { value: "< 1 s", label: "Tiempo de respuesta", detail: "Antes tardaba 3–4 segundos", client: "BiceVida", color: LANG.node.c2 },
  { value: "−40%", label: "Uso de procesador (CPU)", detail: "−30–40% de CPU y −15–30% de memoria", client: "Push HR", color: LANG.python.c1 },
];

export const HR_VALUE = [
  {
    Icon: Gauge,
    title: "Procesos más rápidos",
    text: "Transformo procesos lentos y pesados en sistemas rápidos y estables: tareas de más de una hora que hoy terminan en minutos.",
  },
  {
    Icon: TrendingDown,
    title: "Menor consumo de recursos",
    text: "Hago que los sistemas hagan más con menos: menos uso de procesador y memoria, lo que reduce el costo de operarlos.",
  },
  {
    Icon: ShieldCheck,
    title: "Datos confiables y trazables",
    text: "Automatizo migraciones, validaciones y reportes sobre grandes volúmenes de información, con control de cada registro procesado.",
  },
];

export const HR_ROLES = [
  "Backend Developer", "Desarrollador/a Backend", "Software Developer",
  "Desarrollador/a Java", "Desarrollador/a Python", "Desarrollador/a Node.js",
];

export const ATS_KEYWORDS = [
  "Backend", "Java", "Spring Boot", "GraalVM Native Image", "Python", "FastAPI", "Django",
  "Node.js", "Express", "API REST", "Microservicios", "SQL", "PostgreSQL", "MySQL", "MongoDB",
  "SQLAlchemy", "Polars", "Pydantic v2", "AWS", "Docker", "Git", "Concurrencia",
  "Procesamiento asincrónico", "Optimización de rendimiento", "Migración de datos",
];

/* the badge counts projects of PROJECT_HISTORY (content.js) that used any `tech` of the area,
   or the explicit `projects` ids when the area is a practice rather than a technology */
export const HR_COMPETENCIES = [
  {
    area: "Optimización de rendimiento",
    plain: "Encuentro los cuellos de botella de un sistema y lo hago responder más rápido usando menos procesador y memoria.",
    tech: ["GraalVM Native Image", "Concurrencia", "Procesamiento asincrónico", "Polars", "orjson"],
    color: CORE,
  },
  {
    area: "Construcción de sistemas empresariales",
    plain: "Desarrollo el “motor” de las aplicaciones: procesa la información, aplica las reglas del negocio y conecta servicios entre sí.",
    tech: ["Java", "Spring Boot", "Python", "FastAPI", "Django", "Node.js", "Express"],
    color: LANG.java.c1,
  },
  {
    area: "Migración y calidad de datos",
    plain: "Traslado grandes volúmenes de información entre sistemas sin perder nada: valido, limpio y dejo un reporte de cada registro.",
    projects: ["document-migrations", "buk-migration", "payroll-history"],
    tech: ["Migración masiva", "Normalización", "Validación", "Reportes automáticos"],
    color: HR_ACCENT,
  },
  {
    area: "Gestión de bases de datos",
    plain: "Organizo y acelero los “archivos digitales” donde la empresa guarda su información: clientes, nóminas, registros.",
    tech: ["SQL", "PostgreSQL", "MySQL", "MongoDB", "SQLAlchemy"],
    color: LANG.python.c1,
  },
  {
    area: "Integración entre sistemas",
    plain: "Construyo los “puentes” que permiten que distintas aplicaciones intercambien información de forma ordenada y segura.",
    tech: ["APIs REST", "Microservicios", "API de BUK"],
    color: LANG.node.c2,
  },
  {
    area: "Nube e infraestructura",
    plain: "Publico aplicaciones en servidores de Amazon (AWS) y las empaqueto para que funcionen igual en cualquier entorno.",
    tech: ["AWS", "Docker", "Git"],
    color: LANG.java.c2,
  },
];

export const HR_GLOSSARY = [
  { term: "Backend", def: "La “cocina” de una aplicación: no se ve, pero prepara cada pedido que hace el usuario." },
  { term: "API", def: "El “mesero” entre sistemas: lleva solicitudes y trae respuestas de forma ordenada." },
  { term: "Java · Python · Node.js", def: "Lenguajes de programación de amplio uso en empresas. Dominar los tres permite adaptarse al equipo." },
  { term: "Spring Boot · FastAPI · Django", def: "Frameworks: kits de herramientas que aceleran el desarrollo en cada lenguaje." },
  { term: "Base de datos (SQL)", def: "El archivo digital ordenado donde la empresa guarda y consulta su información." },
  { term: "Nube (AWS)", def: "Servidores arrendados a Amazon que se pagan por consumo; optimizar es ahorrar." },
  { term: "Docker", def: "Empaqueta una aplicación con todo lo que necesita, como un contenedor de transporte." },
  { term: "Latencia", def: "El tiempo de espera entre que el usuario hace clic y recibe una respuesta." },
];

/* plain-language versions of the TI data, keyed by the same ids */
export const HR_PROJECTS = {
  "buk-migration": {
    title: "Migración de documentos: de 1 hora a 10 minutos",
    challenge: "Trasladar masivamente archivos y documentos de clientes a la plataforma de RRHH BUK tomaba más de una hora.",
    action: "Rediseñé el proceso para trabajar con muchos documentos a la vez, sin esperas innecesarias entre uno y otro.",
    result: "Hoy termina en 5–10 minutos: más de un 83% menos de tiempo.",
    before: "+1 h", after: "5–10 min",
  },
  "finance-platforms": {
    title: "Aplicaciones de finanzas que gastan menos recursos",
    challenge: "Las plataformas internas consumían mucho procesador y memoria, y cada cliente necesitaba formatos financieros distintos.",
    action: "Construí aplicaciones configurables por cliente usando herramientas de alto rendimiento y optimicé su consumo.",
    result: "Entre 30% y 40% menos uso de procesador y entre 15% y 30% menos memoria.",
    before: null, after: "−30–40% CPU",
  },
  "graalvm-microservices": {
    title: "Respuestas instantáneas en servicios de BiceVida",
    challenge: "Algunos servicios tardaban entre 3 y 4 segundos en responder.",
    action: "Optimicé los servicios, los migré a una tecnología de arranque rápido y aceleré las consultas a la base de datos.",
    result: "El tiempo de respuesta bajó de segundos a milésimas de segundo y las consultas mejoraron cerca de un 20%.",
    before: "3–4 s", after: "< 1 s",
  },
  "document-migrations": {
    title: "Migraciones sin perder un solo documento",
    challenge: "Empresas como PUMA, GyG e IACC necesitaban trasladar grandes volúmenes de documentos con datos desordenados.",
    action: "Automaticé la migración, limpié los datos y creé un buscador que valida cada documento por nombre, RUT y archivo.",
    result: "98% de coincidencia automática y reportes 100% exactos de lo migrado y lo pendiente.",
    before: null, after: "98%",
  },
  "hr-bpo-platform": {
    title: "Plataforma para gestionar la nómina de muchas empresas",
    challenge: "Un servicio de outsourcing de RRHH necesitaba ordenar las novedades de nómina de muchas empresas cliente en un solo lugar.",
    action: "Desarrollé una plataforma segura (doble factor de autenticación y datos cifrados) conectada directamente con BUK.",
    result: "Todo el ciclo de novedades —carga, revisión, procesamiento y cierre— en una sola herramienta, respaldada por ~1.100 pruebas automáticas.",
    before: null, after: "~1.100 pruebas",
  },
  "multi-db-workbook": {
    title: "Reportes sin depender de TI",
    challenge: "Para obtener un reporte, RRHH y Finanzas debían pedírselo a TI y recibían datos llenos de códigos.",
    action: "Creé una herramienta con apariencia de planilla para explorar, cruzar y descargar datos a Excel con clics.",
    result: "Equipos no técnicos consultan la información por su cuenta, de forma segura (solo lectura) y en 6 tipos de bases de datos.",
    before: null, after: "6 motores",
  },
  "payroll-history": {
    title: "3,5 millones de registros de nómina, consultables",
    challenge: "El historial de remuneraciones estaba repartido en planillas Excel enormes, imposibles de abrir y cruzar con fluidez.",
    action: "Automaticé su carga a una base de datos leyendo los archivos por partes y guardando miles de registros a la vez.",
    result: "3,55 millones de registros de 2.006 trabajadores en un solo lugar, listos para buscar por persona, fecha o centro de costo.",
    before: "9 planillas", after: "1 base",
  },
  "excel-consolidator": {
    title: "Planillas de remuneraciones unidas en un clic",
    challenge: "Consolidar a mano muchas planillas de liquidaciones, haberes y descuentos tomaba tiempo y se prestaba a errores.",
    action: "Creé una aplicación de escritorio que las une automáticamente y deja un reporte de control de cada archivo.",
    result: "Un consolidado único por tipo de planilla, con auditoría que confirma cuántas filas se copiaron de cada archivo.",
    before: "Manual", after: "Automático",
  },
  "portfolio": {
    title: "Un portafolio rápido de cargar",
    challenge: "Un sitio interactivo, con muchas ventanas y animaciones, corre el riesgo de ser pesado y lento.",
    action: "Lo construí para que cargue solo lo necesario, con la portada lista de antemano y archivos comprimidos.",
    result: "Los archivos del sitio pesan 74% menos al enviarse (de ≈540 KB a ≈140 KB).",
    before: "≈540 KB", after: "≈140 KB",
  },
};

export const HR_EXPERIENCE = [
  {
    plainRole: "Desarrollador Backend",
    bullets: [
      "Reduje la migración masiva de documentos a BUK de más de 1 hora a 5–10 minutos.",
      "Bajé el consumo de procesador en 30–40% y de memoria en 15–30% en plataformas internas.",
      "Desarrollé aplicaciones internas de finanzas adaptables a los requerimientos de cada cliente.",
      "Automaticé reportes completos y trazables para los equipos de RRHH.",
    ],
  },
  {
    plainRole: "Desarrollador Backend en práctica",
    bullets: [
      "Logré que servicios que tardaban 3–4 segundos respondan de forma prácticamente instantánea.",
      "Modernicé 4 servicios para que arranquen más rápido y usen menos memoria.",
      "Participé en el traslado de la infraestructura a la nube de Amazon (AWS).",
      "Aceleré cerca de un 20% las consultas a bases de datos.",
    ],
  },
  {
    plainRole: "Desarrollador Backend independiente",
    bullets: [
      "Automaticé migraciones masivas de documentos para empresas como PUMA, GyG e IACC.",
      "Creé un buscador que valida documentos con 98% de coincidencia por nombre, RUT y archivo.",
      "Entregué reportes 100% exactos de lo migrado y lo pendiente, facilitando las auditorías.",
    ],
  },
];

export const HR_CERT_NOTES = {
  "Capacitación ISO 27001 (Seguridad de la Información)": "Norma internacional de seguridad de la información: cómo proteger los datos de la empresa y de sus clientes.",
  "Capacitación Oracle Backend": "Programa de formación en desarrollo backend de Oracle Next Education.",
  "Curso Python Native Avances": "Curso de Python dictado por la Universidad Mayor.",
};
