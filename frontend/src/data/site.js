/* "Cómo está hecho" window: how this portfolio is built, with numbers measured on the project itself.
   Update SITE_STATS after big changes: `pytest` in backend/ and the "compress:" line of `npm run build`. */

export const REPO_URL = "https://github.com/maximiliano-andres/new_porfolio";

export const SITE_STATS = [
  { value: "137", label: "pruebas del backend pasando (pytest)", labelEn: "backend tests passing (pytest)" },
  { value: "−75%", label: "peso enviado gracias a Brotli", labelEn: "less data sent thanks to Brotli" },
  { value: "18", label: "tamaños de pantalla verificados en cada build", labelEn: "screen sizes verified on every build" },
  { value: "3", label: "sistemas operativos en la integración continua", labelEn: "operating systems in continuous integration" },
];

export const SITE_LAYERS = [
  {
    id: "frontend", title: "Frontend", titleEn: "Frontend",
    items: [
      { es: "React 18 + Vite + Tailwind CSS 4", en: "React 18 + Vite + Tailwind CSS 4" },
      { es: "Portada pre-renderizada: se ve antes de que cargue JavaScript", en: "Prerendered landing screen: visible before JavaScript loads" },
      { es: "Cada ventana se descarga solo al abrirla", en: "Each window is downloaded only when it opens" },
      { es: "Service worker: visitas repetidas casi instantáneas", en: "Service worker: near-instant repeat visits" },
      { es: "Bilingüe (ES / EN) y dos perfiles de lectura (TI / RRHH)", en: "Bilingual (ES / EN) with two reading profiles (Tech / HR)" },
    ],
  },
  {
    id: "backend", title: "Backend", titleEn: "Backend",
    items: [
      { es: "FastAPI + Pydantic sobre Python 3.14", en: "FastAPI + Pydantic on Python 3.14" },
      { es: "Arquitectura hexagonal: dominio sin dependencias, puertos y adaptadores", en: "Hexagonal architecture: dependency-free domain, ports and adapters" },
      { es: "Servido por Granian (Rust) detrás de Caddy", en: "Served by Granian (Rust) behind Caddy" },
      { es: "Límite de solicitudes por IP con memoria acotada", en: "Per-IP rate limiting with bounded memory" },
    ],
  },
  {
    id: "security", title: "Seguridad y privacidad", titleEn: "Security and privacy",
    items: [
      { es: "Content-Security-Policy con el hash de cada script inline", en: "Content-Security-Policy with the hash of every inline script" },
      { es: "HSTS con despliegue gradual", en: "HSTS with gradual rollout" },
      { es: "Sin cookies, sin analítica, sin rastreadores", en: "No cookies, no analytics, no trackers" },
      { es: "Contacto por correo: el sitio no guarda datos del visitante", en: "Contact by email: the site stores no visitor data" },
    ],
  },
  {
    id: "delivery", title: "Entrega", titleEn: "Delivery",
    items: [
      { es: "Docker multi-etapa + Caddy con HTTPS automático", en: "Multi-stage Docker + Caddy with automatic HTTPS" },
      { es: "GitHub Actions: lint, pruebas y build en Linux, macOS y Windows, más prueba del stack Docker", en: "GitHub Actions: lint, tests and build on Linux, macOS and Windows, plus a Docker stack smoke test" },
      { es: "Dependencias con hash verificado (uv), pip-audit y Dependabot", en: "Hash-verified dependencies (uv), pip-audit and Dependabot" },
    ],
  },
];
