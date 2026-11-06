# Auditoría técnica n.º 3: auditoría completa tras la actualización de contenido y la sección CV

**Fecha:** 2026-11-05 · **Commit base:** `edff83d` más los cambios sin commitear del día (contenido desde el CV, gráfico de Skills, 3 proyectos nuevos y la ventana "Mi CV") · **Auditorías anteriores:** [AUDITORIA.md](AUDITORIA.md), [PROPUESTAS.md](PROPUESTAS.md) y [AUDITORIA-2.md](AUDITORIA-2.md)

**Alcance:** todo el repositorio:
- Backend (FastAPI + Granian).
- Despliegue (Dockerfile, compose y Caddy).
- CI.
- Scripts de build y service worker.
- Frontend completo.
- **Contenido**: exactitud frente al CV y datos personales publicados.

Para cada hallazgo que quedó abierto en las auditorías anteriores se indica su estado actual (§6). No se modificó código durante la auditoría.

---

## 1. Resumen ejecutivo

**Estado general:**
- Seguridad: **sólida**. No hay vulnerabilidades en dependencias de producción y no hay secretos en el historial de git. Path traversal, CORS y límites de tamaño están bien resueltos.
- Hallazgo más grave: **una regresión funcional (Alta)** del service worker, que hoy dispara un botón normal de la UI.
- El resto son inconsistencias entre Caddy y el backend, contenido desactualizado y detalles de accesibilidad y responsive.

| Severidad | Nuevos | Heredados aún abiertos |
|---|---|---|
| Crítica | 0 | 0 |
| Alta | 1 | 1 (CT-1) |
| Media | 9 | 4 |
| Baja | 14 | ~35 (mayormente accesibilidad y robustez de bajo impacto) |
| Info | 4 | — |

**Las 5 cosas que haría primero:**

1. **SW-5 (Alta).** Abrir el PDF del CV hace que el service worker guarde **el PDF como portada offline**. Se arregla con 2 líneas en `sw.js` más subir `VERSION`.
2. **CNT-1, CNT-2 y CNT-3.** Quedan textos que **contradicen el CV**: el simulador sigue atribuyendo el logro de 1 h → 5–10 min a IACC, y las capturas del README muestran las cifras antiguas (IACC −83 %, PUMA, GyG +20 %).
3. **PRIV-1.** El repositorio es **público**. Commitear `docs/cv/` o `frontend/public/cv/` deja tu teléfono en el historial de git para siempre. Hay que decidirlo antes del próximo commit.
4. **DEP-8.** Caddy no trata `/cv/*` como estático: un PDF inexistente devuelve el HTML de la app, y la política de caché difiere de la del backend.
5. **CT-1 (heredado, Alta).** El rate limit del formulario de contacto se evade rotando direcciones IPv6 del mismo /64. Se **reprodujo** con 30 de 30 envíos aceptados.

---

## 2. Metodología

**Revisiones:**
- Dos revisiones independientes en paralelo, una de backend, despliegue y CI, y otra del frontend.
- Mi propia revisión del contenido y los datos personales.
- Verifiqué a mano en el código cada hallazgo de severidad Media o superior.

**Pruebas reales:**
- `pytest` (91 pruebas), `ruff`, `oxlint` y `npm run build`.
- `pip-audit` sobre ambos locks, `npm audit` y búsqueda de secretos en `git log -p --all`.
- Caddy 2.11 real en Docker, con este Caddyfile y este `dist/`.
- Playwright con Chromium y WebKit (emulando iPhone 13 y Pixel 7) para reproducir los problemas de UI.

**Limitaciones:**
- **Firefox no se pudo probar**: el navegador no arranca dentro del sandbox de esta sesión.
- No se verificó el visor de PDF integrado de Chrome o Edge, porque headless-shell no lo trae.

**Etiquetas:** **CONFIRMADO** significa reproducido o trazado en el código; **PLAUSIBLE**, que el código lo permite pero depende de la configuración o de un navegador real.

---

## 3. Hallazgos nuevos: contenido y datos personales

| ID | Sev. | Estado | Dónde | Problema | Corrección |
|---|---|---|---|---|---|
| CNT-1 | Media | CONFIRMADO | `frontend/src/windows/SimulatorContent.jsx:59`, `:152` | El veredicto y la nota del simulador dicen "caso real de IACC (>1 h → 5–10 min)". Según el CV, ese logro es de **Push HR / migración a BUK**, y así lo dice el resto del sitio. Un reclutador ve dos versiones del mismo logro | Reemplazar "IACC" por "la migración a BUK (Push HR)" en ambas líneas |
| CNT-2 | Media | CONFIRMADO | `docs/screenshots/03-ficha-rrhh.png` (y probablemente `01`, `02` y `04`), usadas en `README.md` | Las capturas muestran el contenido anterior: −83 % en IACC, < 1 s en PUMA, +20 % en GyG y "2 años". Es lo primero que ve quien abre el repo público | Regenerar las capturas con el contenido actual (existe un script de Playwright reutilizable) |
| CNT-3 | Baja | CONFIRMADO | `README.md:118`, `:465` | Dice "89 pruebas"; hoy son **91**. El manual de uso no menciona la ventana "Mi CV" ni el nuevo gráfico de Skills | Actualizar las cifras y agregar el CV a §Funcionalidades y al manual |
| CNT-4 | Baja | CONFIRMADO | `content.js` (`PROJECTS` frente a `PROJECT_HISTORY`) | Las insignias de lenguaje de las tarjetas no cuadran con el gráfico de Skills, que promete conteos "calculados". `buk-migration` lleva la insignia Python, pero su historial no incluye Python, porque el CV no dice el lenguaje. `portfolio` lleva la insignia Node.js, pero su historial no la incluye | Confirmar el lenguaje de la migración a BUK y alinear ambos campos, o derivar `langs` del historial |
| CNT-5 | Baja | CONFIRMADO | `Hero.jsx:37`, `index.html`, frente a `CvContent.jsx:53` y el PDF | El apellido se escribe "Caniullan" en el sitio y "Caniullán" en el CV | Elegir una grafía y unificarla (también en `<title>` y `og:title`) |
| CNT-6 | Info | CONFIRMADO | `content.js:100` | El comentario dice que una tecnología sin proyectos "se muestra en TECH_KNOWN", pero el código la mostraría como barra 0/10. Hoy no hay ninguna en ese caso | Corregir el comentario o filtrar `n === 0` |
| PRIV-1 | Media | CONFIRMADO | `docs/cv/` (sin trackear), `frontend/public/cv/`, `img/cv/` | El repo `maximiliano-andres/new_porfolio` es **público**. El CV incluye teléfono, email y comuna. Al commitear, quedan para siempre en el historial aunque luego se borren. El metadata del PDF y del .docx está limpio (sin rutas ni GPS) | **Decisión tuya.** Opciones: (a) agregar `docs/cv/` al `.gitignore` y publicar solo `frontend/public/cv/`; (b) generar una versión web del CV sin teléfono |
| PRIV-2 | Info | CONFIRMADO | `robots.txt` (`Allow: /`) | El PDF público es indexable por buscadores | Si no quieres que se indexe: `X-Robots-Tag: noindex` para `/cv/*` en Caddy y en `cache_policy()` |

---

## 4. Hallazgos nuevos: backend, despliegue y CI

| ID | Sev. | Estado | Dónde | Problema | Corrección |
|---|---|---|---|---|---|
| **SW-5** | **Alta** | CONFIRMADO (Chromium con SW) | `frontend/public/sw.js:43-47`; lo dispara `CvContent.jsx:36`, `:47` | "Abrir en pestaña" y el clic en una página del CV son navegaciones a `/cv/…pdf`. `networkFirst` guarda **cualquier** navegación exitosa bajo la clave `"/"`, así que la portada offline pasa a ser el PDF. Sin conexión, entrar al sitio descarga el CV en vez de mostrar el portafolio. Es SW-3 (AUDITORIA-2), pero ahora lo dispara la acción principal de un reclutador | Cachear solo si `content-type` empieza por `text/html` **y** `url.pathname === "/"`. Subir `VERSION` a `"v3"` para purgar las cachés ya contaminadas |
| DEP-8 | Media | CONFIRMADO (Caddy 2.11 real) | `deploy/Caddyfile:38` (`@static` no incluye `/cv/*`) | Hay tres diferencias entre Caddy y el backend. (1) `GET /cv/viejo.pdf` devuelve 404 con el HTML de la app, mientras el backend devuelve 404 JSON con `no-store`. (2) El PDF existente sale con `no-cache` en Caddy y `max-age=3600` en el backend. (3) El nombre del PDF no lleva versión, así que con 1 h de caché un CV actualizado tarda en verse | Añadir `/cv/*` a `@static` y fijar la misma política en ambos lados: `no-cache` o `max-age=300` para `/cv/` |
| BE-1 | Baja | CONFIRMADO | `backend/app/adapters/outbound/jsonl_contact_repository.py:33-35` | `is_writable()` comprueba permisos, no espacio libre. Con el disco lleno, `/api/status` sigue en 200 mientras cada envío da 500, y el monitoreo no se entera. Esto corrige lo que afirmaba CT-1 en AUDITORIA-2: el health check no pasa a 503 y Caddy no deja de enrutar | Incluir `shutil.disk_usage(...).free > umbral` en el readiness |
| BE-3 | Baja | PLAUSIBLE (depende de la configuración) | `backend/app/adapters/inbound/http/proxy.py:13-17` | Caddy reenvía `CF-Connecting-IP` tal cual. Si se activa `CLIENT_IP_HEADER=cf-connecting-ip` y el origen es accesible sin Cloudflare, cada valor inventado es un cupo nuevo, y el valor no se valida como IP | Validar con `ipaddress.ip_address()` y, si falla, usar el peer. Si no hay CDN, borrar la cabecera en Caddy |
| DEP-9 | Baja | CONFIRMADO | `deploy/Caddyfile` | No hay directiva `log`, y Granian corre sin access log. Al revés de lo que dice el comentario de `Dockerfile:72`, **no queda ningún registro de accesos**, ni siquiera del abuso de CT-1 | `log { output stdout; format json }` |
| DEP-10 | Baja | CONFIRMADO | `deploy/security-headers.caddy` | Los errores propios de Caddy, como un 502 con el backend caído, salen sin CSP ni nosniff y con `Server: Caddy` | `handle_errors { import security-headers.caddy … }` |
| DEP-11 | Baja | CONFIRMADO | `Dockerfile:81-91` | El contenedor `web` (Caddy) corre como root. Lo atenúan `cap_drop: ALL`, `read_only` y `no-new-privileges` | `USER caddy` con `chown` de `/data` y `/config` |
| DEP-12 | Baja | CONFIRMADO | `Dockerfile:90-91` | El healthcheck de `web` consulta la API de admin (`:2019`), no el sitio, así que un `dist/` vacío queda como "healthy" | `wget -q -O /dev/null http://127.0.0.1:80/robots.txt` |
| CI-1 | Baja | CONFIRMADO (pip-audit) | `.github/workflows/ci.yml:56-57` | Solo se audita `requirements.lock`. `requirements-dev.lock` tiene **pytest 8.4.2 con PYSEC-2026-1845 / CVE-2025-71176**, que permite DoS o escalada local vía `/tmp/pytest-of-*` | Auditar también el lock de desarrollo y subir pytest a ≥ 9.0.3 |
| CI-2 | Baja | CONFIRMADO | `ci.yml:97-108` | El smoke test de Docker no cubre `/cv/`. Por eso DEP-8 pasó sin detectarse | Añadir `/cv/…pdf` → 200 `application/pdf` y `/cv/viejo.pdf` → 404 sin `text/html` |
| BE-4 | Info | CONFIRMADO (ruff PLE2502) | `backend/app/domain/contact.py:15` | `UNSAFE_CHARS` contiene caracteres bidi **literales** en el código fuente (patrón "Trojan Source"): un revisor no ve qué rango cubre | Usar escapes `‪-‮⁦-⁩` |
| BE-5 | Info | CONFIRMADO | `static_files.py:100-101` | El 404 por `\x00` no lleva `Cache-Control: no-store`, a diferencia de los demás 404 | Pasar los mismos `headers` |

---

## 5. Hallazgos nuevos: frontend

| ID | Sev. | Estado | Dónde | Problema | Corrección |
|---|---|---|---|---|---|
| FE3-03 | Media | CONFIRMADO (medido) | `components/Hero.jsx:53-106` | En pantallas bajas (320×568, 700×560) el dock tapa botones del Hero. Con "Ver CV" ahora son hasta 4 en RRHH (antes 3). El contenedor es `pointer-events-none`, así que deslizar sobre el texto no desplaza; al enfocar GitHub con Tab el foco queda tapado (WCAG 2.4.11) | Extender la variante `short:` a `max-height: 600px`, añadir `scroll-padding-bottom`, o pasar LinkedIn y GitHub a iconos bajo 360 px |
| FE3-04 | Media | CONFIRMADO (medido) | `windows/tech.jsx:117` | En el gráfico de Skills, la columna del nombre crece hasta 176 px antes que la barra. En 320 px cada barra mide **18 px**, y 1/10 no se distingue de 2/10 | `grid-cols-[minmax(5rem,9rem)_minmax(4rem,1fr)_2.75rem]` o apilar nombre y barra en pantallas angostas |
| FE3-05 | Media | CONFIRMADO (medido) | `windows/CvContent.jsx:49` | `sizes="(max-width: 820px) 100vw, 760px"` no tiene en cuenta la ventana maximizada ni el escalado de la UI. En pantallas de densidad 1 se elige la imagen de 760 px y se estira hasta 1 080 px: el CV se ve **borroso** maximizado o en monitores grandes | `sizes="(max-width: 640px) 100vw, 1240px"` |
| FE3-06 | Media | CONFIRMADO | `app/PolyglotPortfolio.jsx:540-543`, `258-261` | Al abrir una ventana desde el Hero ("Ver CV", "Sobre mí"), el Hero se desmonta y **el foco cae a `<body>`**: quien navega con teclado vuelve a empezar desde la barra superior | Tras `openWindow`, enfocar la ventana nueva en un `requestAnimationFrame` |
| FE3-07 | Media | CONFIRMADO | `PolyglotPortfolio.jsx:263-271` (SH-2 ampliado) | Al cerrar "Mi CV" con Esc el foco cae a `<body>`: la ventana no tiene ícono en el dock (`[data-dock-id="cv"]`) al que devolverlo. Afecta igual al simulador y a las insignias | Devolver el foco al elemento que abrió la ventana, guardándolo al abrirla |
| FE3-08 | Baja | CONFIRMADO | `overlays/CoreMenu.jsx:24-25`, `:44` | Con 12 módulos (se sumó `cv`), en un móvil apaisado (667×375) los botones de 48 px quedan a 36 px de distancia y se solapan | Dos anillos o una cuadrícula cuando `R·2π/n < 56` |
| FE3-09 | Baja | CONFIRMADO | `windows/tech.jsx:115`, `:214` | Las barras usan `aria-pressed`, que el lector anuncia como conmutador, pero no se desmarcan. Los chips del histórico cambian el panel de detalle, que queda fuera de vista | `role="radio"` + `aria-checked` en un `radiogroup`; hacer scroll al panel |
| FE3-11 | Baja | CONFIRMADO | `components/ui.jsx:150` | Los 9 diagramas SVG no tienen `role="img"` ni `aria-label`, así que el lector lee etiquetas sueltas | `role="img"` con una descripción por diagrama |
| FE3-12 | Baja | CONFIRMADO | `components/ui.jsx:282-302`; `data/hr.js:30` | `CountUp` sobre "< 1 s" muestra **"< 0 s"** mientras anima, y se queda así si nunca entra en pantalla | No animar valores ≤ 1, o arrancar desde el valor final |
| FE3-13 | Baja | CONFIRMADO | `windows/CvContent.jsx:22`, `:58`; `tech.jsx:181`, `:190`, `:210`; `hr.jsx:230` | Texto de 10,5 px en `white/40`–`/45`, con contraste de 3,7:1 a 4,47:1, por debajo de 4,5:1 (amplía SH-3) | Subir a `white/60` |
| FE3-14 | Baja | CONFIRMADO | `dist/assets/index-*.js` (amplía BG-4) | El chunk inicial creció de 91,8 a 101,2 KB (gzip de 31,3 a 33,5 KB): `PROJECT_HISTORY`, `CV` y los 9 diagramas viajan en la carga inicial aunque solo se usan en ventanas diferidas | Mover los datos de proyectos y CV a módulos que importen solo `tech.jsx`, `hr.jsx` y `CvContent.jsx` |
| FE3-15 | Info | CONFIRMADO | `public/img/cv/*.jpg` | Los JPEG de respaldo (466 y 416 KB) solo los piden navegadores sin WebP (anteriores a Safari 14 / 2020) | Aceptable. Se podrían bajar a calidad 70 |

---

## 6. Estado de los hallazgos abiertos de auditorías anteriores

**Corregidos desde AUDITORIA-2:** FE-1 (enlace de GitHub), SEO-1 y SEO-3 (textos y meta), y la muestra reverificada de AUDITORIA.md (F6, F7, F10, F14 y A1: traversal, `%00`, 404 honestos, 405 y CORS).

**Siguen abiertos (sin cambios salvo nota):**

| ID | Sev. | Nota de hoy |
|---|---|---|
| **CT-1** | **Alta** | **Reproducido:** 30 POST rotando `2001:db8::{i}` dieron 30 × 200. Tampoco hay cupo global ni tope de tamaño del JSONL |
| CT-2 / CF-2 | Media | Sigue sin aviso de privacidad ni plazo de retención (Ley 21.719, vigente en diciembre de 2026) |
| CT-3 | Media | Nadie recibe aviso de un mensaje nuevo |
| DEP-5 | Media | **Parcial.** Caddy no envía HSTS. `ENABLE_HSTS` del backend solo cubre `/api/*` en Docker y sin arranque gradual |
| SH-1 | Media | Reproducido: con CORE abierto, Ctrl+K y Tab dejan el foco atrapado en "Buscar comando" (dos focus traps compitiendo) |
| T-1 | Media | Reproducido: `open constructor` responde "Abriendo constructor…" y después el Hero no vuelve |
| DEP-6 / D-4 | Baja | ≈4,06 MB de imágenes sin uso más `img/README.md` (76 KB) siguen en `dist/`. `dist/` pesa 7,9 MB |
| DEP-7 | Baja | Las Actions y las imágenes de Docker se fijan por tag; no hay Dependabot |
| SRV-5 | Baja | Reproducido: las respuestas 500 salen sin CSP ni `nosniff` |
| SW-1, SW-2, SW-4 | Baja | Sin cambios en `sw.js`. SW-3 escaló a SW-5 (§4) |
| B-1, B-2, B-3 | Baja | Sin cambios en los scripts de build |
| SEO-2 | Baja | Sin `og:image`, `og:url` ni `canonical` |
| SH-2…SH-11, LZ-1, BG-1…BG-3, SND-1, T-2…T-8, CF-1, SIM-1, OV-1…OV-4 | Baja | Sin cambios. Accesibilidad y robustez de bajo impacto; el detalle está en AUDITORIA-2 §5 |

---

## 7. Resultados de las herramientas

| Herramienta | Resultado |
|---|---|
| `pytest` | **91 passed** (0,24 s) |
| `ruff check .` | All checks passed |
| `ruff --select ALL` (exploración) | 437 avisos, casi todos de estilo. Relevante: PLE2502 ×5 (BE-4) |
| `pip-audit requirements.lock` | Sin vulnerabilidades |
| `pip-audit requirements-dev.lock` | pytest 8.4.2: PYSEC-2026-1845 (CI-1) |
| `npm audit` (producción y completo) | 0 vulnerabilidades |
| `oxlint` | 0 avisos; no hay exports sin uso (los restos del radar se eliminaron por completo) |
| `npm run build` | OK; prerender verificado en 18 viewports; CSP sin cambios |
| Secretos en `git log -p --all` | 0 coincidencias (AKIA, ghp_, sk-, PRIVATE KEY, password/token, etc.) |
| Peso | JS inicial 101 KB más React 140 KB y motion 71 KB; brotli 546 → 141 KB; `dist/` 7,9 MB (4 MB sin uso) |

---

## 8. Revisado y correcto

- **Path traversal:** `..%2f`, `%2e%2e`, `..%5c`, `%00` y `/cv/..%2f..` responden 404, tanto en el backend como en Caddy.
- **PDF:** sale como `application/pdf` con Range (206) y HEAD correctos, y lleva CSP y nosniff. No necesita `Content-Disposition`: la descarga usa `download` same-origin.
- **Visor del CV:** usa imágenes en lugar de `<object>`/`<iframe>`, así que es compatible con la CSP (`object-src 'none'`, `frame-ancestors 'none'`). Las imágenes tienen nombres versionados, compatibles con el cache-first del SW. Probado en Chromium, WebKit/iPhone y Android, sin desborde horizontal.
- **Límites de la API:** CORS solo en desarrollo; 413 y 411 por tamaño; rate limit por IP exacta funcional (20 POST → 429). Caddy sobrescribe `X-Forwarded-For`.
- **Contenedor `api`:** uid 10001, `read_only`, `cap_drop ALL`, `no-new-privileges`, con límites de memoria y CPU y sin puertos publicados.
- **Dependencias y CI:** dependencias Python instaladas con `--require-hashes` y locks verificados en el CI; `permissions: contents: read`; la CSP generada coincide con la del repositorio.
- **Mensajes de contacto:** el JSONL se guarda con permisos `0600`, sin inyección de líneas, y nunca se registra su contenido.
- **Datos del sitio:** las tecnologías de `PROJECT_HISTORY` y `TECH_GROUPS` son consistentes. HR_PROJECTS, HR_CERT_NOTES y HR_EXPERIENCE cubren todo el contenido técnico.
- **Ventana `cv`:** no altera el progreso "explorer" ni los atajos 1–9. Funciona desde la paleta, la terminal (`cv`, `open cv`) y el cambio TI/RRHH.
- **Accesibilidad básica:** movimiento reducido respetado en diagramas, barras y transiciones; sin errores de consola en ningún escenario probado.

---

## 9. Plan recomendado

**Ahora (menos de 1 hora, sin decisiones tuyas):**
- SW-5: sw.js más `VERSION`.
- CNT-1: textos del simulador.
- DEP-8 y CI-2: `/cv/*` en Caddy, la política de caché y el smoke test.
- FE3-05: `sizes` de las imágenes del CV.
- FE3-04: ancho de las barras de Skills.
- CI-1: subir pytest y auditar el lock de desarrollo.
- CNT-3: cifras del README.

**Esta semana:**
- CNT-2: regenerar las capturas.
- FE3-03: Hero en pantallas bajas.
- FE3-06 y FE3-07: devolver el foco.
- DEP-6: borrar las imágenes sin uso (−4 MB).
- DEP-9: logs de acceso en Caddy.
- BE-1: espacio en disco en el health check.

**Requieren una decisión tuya:**
- **PRIV-1 y PRIV-2:** si se commitea el CV con teléfono y si se indexa.
- **CNT-4 y CNT-5:** lenguaje de la migración a BUK y grafía del apellido.
- **CT-1, CT-2 y CT-3:** cupo global del formulario, texto de privacidad y canal de aviso.
- **DEP-5:** HSTS en Caddy, que requiere HTTPS estable.

---

## 10. Estado de aplicación (2026-11-05)

Se corrigieron **todos los hallazgos de este informe y los heredados de §6**, excepto **PRIV-1 y PRIV-2**, que quedaron fuera por decisión del dueño. Ningún cambio se ha commiteado.

### Decisiones tomadas por defecto (revisables)

| Punto | Valor aplicado |
|---|---|
| CNT-4 | La tarjeta de la migración a BUK **no muestra lenguaje** porque el CV no lo indica. El portafolio suma Node.js en el historial (scripts de build) |
| CNT-5 | Grafía **"Caniullán"** en todo el sitio, como en el CV |
| CT-2 | Retención de **12 meses** (`CONTACT_RETENTION_DAYS=365`). El aviso bajo el formulario ofrece pedir el borrado por email |
| CT-3 | Webhook `CONTACT_NOTIFY_WEBHOOK`, **desactivado** hasta configurarlo. Solo acepta `https` y no envía datos personales |
| DEP-5 | HSTS desde Caddy con `max-age=300` (arranque gradual) |
| CT-1 | 5 mensajes cada 10 min por IP (IPv6 por /64), 100 por hora en total y log de 50 MB como máximo; todo configurable |

### Qué se cambió

**Backend, despliegue y CI:**
- **SW-5, SW-1, SW-2 y SW-4:** el service worker solo guarda la portada HTML, se versiona con un hash por build, recorta la caché dentro de `waitUntil` y usa navigation preload con un timeout de 3 s.
- **DEP-8 y CI-2:** `/cv/*` es estático en Caddy, con `no-cache` en ambos servidores y smoke test en CI.
- **CI-1:** pytest 9.1.0 y auditoría de ambos lockfiles.
- **CT-1, CT-2 y CT-3:** ver la tabla anterior.
- **BE-1:** se exige espacio libre en disco para el readiness.
- **BE-3:** la IP del CDN se valida y Caddy borra `Cf-Connecting-Ip`.
- **BE-4:** escapes `\u` en lugar de caracteres bidi literales.
- **BE-5:** el 404 por `\x00` lleva `no-store`.
- **SRV-5:** las respuestas 500 llevan las cabeceras de seguridad.
- **DEP-7:** Actions fijadas por SHA, imágenes por digest y Dependabot.
- **DEP-9:** access log JSON en Caddy.
- **DEP-10:** `handle_errors` con cabeceras de seguridad.
- **DEP-11:** Caddy corre con uid 10002.
- **DEP-12:** el healthcheck consulta `robots.txt` en un listener local.
- **B-1, B-2 y B-3:** reemplazos seguros en el prerender, un hash por cada script inline y compresión asíncrona que descarta variantes que no ahorran.

**Frontend:**
- **CNT-1:** el simulador ahora habla de BUK y Push HR.
- **FE3-03:** el Hero se puede desplazar en pantallas bajas y el foco no queda bajo el dock.
- **FE3-04:** barras de Skills legibles a 320 px.
- **FE3-05:** CV nítido maximizado.
- **FE3-06 y FE3-07:** el foco entra a la ventana y vuelve al elemento que la abrió.
- **FE3-08:** CORE sin solapes con 12 módulos.
- **FE3-09:** radiogroup con flechas, y el histórico lleva al panel de detalle.
- **FE3-11:** diagramas con `role="img"`.
- **FE3-12:** CountUp sin "< 0 s".
- **FE3-13:** contraste del texto pequeño.
- **FE3-14:** chunk inicial de 101 a **91,8 KB**, porque los datos del shell pasaron a `data/shell.js`.
- **FE3-15:** JPEG de respaldo de 466 a 177 KB.
- **DEP-6:** se quitaron 3,7 MB de imágenes sin uso; `dist/` pasó de 7,9 a **2,6 MB**, y la guía técnica se movió a `docs/guias/`.
- **Heredados:** SH-1…SH-11, LZ-1, BG-1 (parcial), BG-2, BG-3, SND-1, T-1…T-8, CF-1, CF-2, SIM-1 y OV-1…OV-4.

**Contenido:**
- **CNT-2:** capturas del README regeneradas, más una nueva del gráfico de Skills. La del CV no se incluye porque muestra el teléfono (ver PRIV-1).
- **CNT-3:** el README documenta las cifras, la ventana del CV, las variables nuevas y el CI.
- **CNT-6:** las tecnologías sin uso se filtran del gráfico.
- **Hallazgo extra al verificar:** el aviso de insignia tapaba la caja de búsqueda de la paleta; ahora queda debajo de los diálogos modales.

### Verificación final

| Herramienta | Resultado |
|---|---|
| `pytest` | **137 passed**: 62 unitarias y 75 de integración (antes 91) |
| `ruff` | All checks passed |
| `pip-audit` (ambos locks) | Sin vulnerabilidades |
| `npm audit` | 0 vulnerabilidades |
| `oxlint` | 0 avisos |
| `npm run build` | Prerender verificado en 18 viewports; brotli 563 → 148 KB |
| Docker | Stack completo levantado, healthchecks OK y smoke test del CI completo (`SMOKE-OK`) |
| Navegador (Playwright, Chromium y WebKit) | Las ventanas 1–9 abren y cierran sin errores de consola. El CV abre desde la paleta y carga las imágenes de 1 240 px. Las flechas recorren el gráfico de Skills. **Sin conexión, tras abrir el PDF, la portada vuelve como HTML** (SW-5 resuelto) |

### Pendiente o requiere acción

- **PRIV-1 y PRIV-2:** sin cambios, por decisión del dueño.
- **El CI necesita el PDF del CV en el repositorio.** El smoke test pide `/cv/CV_Maximiliano_Caniullan.pdf`. Mientras `frontend/public/cv/` no se commitee (decisión de PRIV-1), ese paso del CI fallará. Una alternativa es que el smoke test genere un PDF de prueba.
- **Primer deploy de Caddy con uid 10002:** si el volumen `caddy-data` ya existe en producción, antes de levantar el stack hay que ejecutar una vez `docker compose run --rm --user root --entrypoint chown web -R 10002:10002 /data /config`.
- **`deploy/security-headers.caddy`:** se regenera en cada build (el hash del script inline cambió). Hay que commitearlo junto con el resto.
- **BG-1:** solo se aplicó la mitigación barata (sin `backdrop-filter` en ventanas ni toasts). La pausa del fondo cuando las ventanas lo cubren no se implementó.
- **Sin probar:** Firefox (no arranca en el sandbox de la auditoría) y el visor PDF integrado de Chrome y Edge.
