/* Plain-language (RRHH) versions of the portfolio content. Only re-explains existing facts. */
import { Briefcase, Code2, Gauge, Laptop, MapPin, ShieldCheck, Sparkles, TrendingDown, Users } from "lucide-react";
import { CORE, HR_ACCENT, LANG } from "../theme.js";

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

export const HR_FACTS = [
  { Icon: Briefcase, label: "Experiencia", value: "2 años" },
  { Icon: MapPin, label: "Ubicación", value: "Chile" },
  { Icon: Laptop, label: "Modalidad", value: "Remoto o presencial" },
  { Icon: Sparkles, label: "Estado", value: "Disponible" },
];

export const HR_KPIS = [
  { value: "−83%", label: "Tiempo de un proceso crítico", detail: "De más de 1 hora a 5–10 minutos", client: "IACC", color: LANG.java.c1 },
  { value: "< 1 s", label: "Tiempo de respuesta", detail: "Antes tardaba 3–4 segundos", client: "PUMA", color: LANG.node.c2 },
  { value: "+20%", label: "Velocidad en consultas de datos", detail: "Con menor consumo de servidores", client: "GyG", color: LANG.python.c1 },
];

export const HR_VALUE = [
  {
    Icon: TrendingDown,
    title: "Menores costos de operación",
    text: "Reduzco el consumo de servidores en la nube. Como ese servicio se paga por uso, el ahorro se refleja directamente en la factura mensual.",
  },
  {
    Icon: Gauge,
    title: "Mejor experiencia para los usuarios",
    text: "Sistemas que responden en milésimas de segundo en lugar de segundos: menos esperas para clientes y colaboradores.",
  },
  {
    Icon: ShieldCheck,
    title: "Operación estable",
    text: "Automatizo procesos que manejan grandes volúmenes de información y que siguen funcionando en momentos de alta demanda.",
  },
];

export const HR_ROLES = [
  "Desarrollador/a Backend", "Backend Developer", "Ingeniero/a de Software",
  "Desarrollador/a Java", "Desarrollador/a Python", "Desarrollador/a Node.js",
];

export const ATS_KEYWORDS = [
  "Backend", "Java", "Spring Boot", "GraalVM", "Python", "FastAPI", "Django",
  "Node.js", "Express", "NestJS", "TypeScript", "API REST", "SQL", "PostgreSQL",
  "MySQL", "MongoDB", "AWS", "Docker", "Multithreading", "Optimización de rendimiento",
];

/* levels mirror the self-assessed percentages of the TI view (≥88 → Avanzado);
   areas without a percentage show the evidence instead of an invented level */
export const HR_COMPETENCIES = [
  {
    area: "Construcción de sistemas empresariales",
    plain: "Desarrollo el “motor” de las aplicaciones: procesa la información, aplica las reglas del negocio y conecta servicios entre sí.",
    level: "Avanzado",
    tech: ["Java", "Spring Boot", "Python", "FastAPI", "Django", "Node.js", "NestJS"],
    color: LANG.java.c1,
  },
  {
    area: "Optimización de rendimiento y costos",
    plain: "Hago que los sistemas respondan más rápido usando menos recursos, lo que baja el gasto en servidores.",
    level: "Avanzado",
    tech: ["GraalVM", "Ajuste de JVM", "Código eficiente (CPU / memoria)"],
    color: CORE,
  },
  {
    area: "Gestión de bases de datos",
    plain: "Organizo y acelero los “archivos digitales” donde la empresa guarda su información: clientes, ventas, registros.",
    level: "Comprobado en proyectos",
    tech: ["SQL", "PostgreSQL", "MySQL", "MongoDB"],
    color: LANG.python.c1,
  },
  {
    area: "Integración entre sistemas",
    plain: "Construyo los “puentes” que permiten que distintas aplicaciones intercambien información de forma ordenada y segura.",
    level: "Sólido",
    tech: ["API REST", "Arquitectura orientada a eventos", "TypeScript"],
    color: LANG.node.c2,
  },
  {
    area: "Automatización de procesos de datos",
    plain: "Automatizo tareas que procesan grandes volúmenes de información sin intervención manual.",
    level: "Sólido",
    tech: ["Python", "Asyncio", "Pipelines de datos"],
    color: HR_ACCENT,
  },
  {
    area: "Nube e infraestructura",
    plain: "Publico y mantengo aplicaciones en servidores de Amazon (AWS) y las empaqueto para que funcionen igual en cualquier entorno.",
    level: "Experiencia práctica",
    tech: ["AWS (EC2, S3, RDS)", "Docker"],
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
  "iacc-optimizer": {
    title: "Proceso crítico: de 1 hora a 10 minutos",
    challenge: "Un proceso de datos clave para la operación tardaba más de una hora en completarse.",
    action: "Lo rediseñé para ejecutar varias tareas en paralelo y optimicé el acceso a la información.",
    result: "Hoy termina en 5–10 minutos: más de un 83% menos de tiempo.",
    before: "+1 h", after: "5–10 min",
  },
  "puma-api": {
    title: "Respuestas instantáneas en las plataformas de PUMA",
    challenge: "Algunas pantallas tardaban entre 3 y 4 segundos en responder.",
    action: "Optimicé las consultas de datos y dejé en memoria la información más solicitada.",
    result: "El tiempo de respuesta bajó de segundos a milésimas de segundo.",
    before: "3–4 s", after: "< 1 s",
  },
  "gyg-performance": {
    title: "Bases de datos más rápidas y eficientes en GyG",
    challenge: "Las consultas a la base de datos y el consumo de recursos limitaban el rendimiento.",
    action: "Reorganicé la estructura de búsqueda de los datos y reduje el uso de memoria y procesador.",
    result: "Más de un 20% de mejora en velocidad de consultas, con menor consumo de servidores.",
    before: null, after: "+20%",
  },
};

export const HR_EXPERIENCE = [
  {
    plainRole: "Desarrollador de sistemas · Consultor independiente",
    bullets: [
      "Resuelvo problemas de lentitud en sistemas de clientes como PUMA, GyG e IACC.",
      "Reduje un proceso crítico de más de 1 hora a 5–10 minutos (83% menos tiempo).",
      "Logré que pantallas que tardaban 3–4 segundos respondan de forma prácticamente instantánea.",
      "Aceleré en más de un 20% las consultas a bases de datos.",
    ],
  },
  {
    plainRole: "Desarrollador de sistemas",
    bullets: [
      "Construí sistemas que conectan aplicaciones entre sí, usando tres lenguajes de amplio uso empresarial (Java, Python y Node.js).",
      "Reduje el consumo de servidores en la nube, generando ahorros en costos de infraestructura.",
      "Automaticé procesos de grandes volúmenes de datos, manteniendo los sistemas disponibles en momentos de alta demanda.",
    ],
  },
];

export const HR_CERT_NOTES = {
  "AWS Certified Developer / Cloud Practitioner": "Valida conocimientos en los servicios de nube de Amazon, uno de los proveedores líderes del mercado.",
  "Oracle Certified Professional — Java SE": "Certificación oficial de Oracle, la empresa responsable del lenguaje Java.",
  "Especialización en Bases de Datos Relacionales": "Formación específica en diseño y manejo de bases de datos.",
  "Desarrollo Backend de Alto Rendimiento": "Formación en construcción de sistemas rápidos y eficientes.",
};
