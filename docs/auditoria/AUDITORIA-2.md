# Auditoría técnica n.º 2: rendimiento, seguridad y mejoras, con foco en Rust

**Fecha:** 2026-11-04 · **Commit base:** `5b737f7` · **Auditoría anterior:** [AUDITORIA.md](AUDITORIA.md) y [PROPUESTAS.md](PROPUESTAS.md) (2026-11-02, ya aplicada)

**Alcance:** todo el repositorio, organizado por funcionalidad: servidor, API de contacto, estáticos, despliegue, CI y cada parte del frontend. Los hallazgos ya corregidos en la auditoría anterior no se repiten; solo se mencionan si la corrección quedó incompleta.

**Pedido explícito:** usar librerías o enfoques en Rust donde se pueda. La §2 evalúa cada pieza: qué se adoptó (con medición), qué ya era Rust y qué se descartó, con el motivo.

## 1. Metodología

**Entorno:** Windows 11, Python 3.13 (CI y Docker usan 3.14), Node 24. Docker Desktop no estaba activo, así que el Dockerfile no se pudo construir localmente; lo valida el job `docker` del CI (ver §8).

**Pruebas reales:**
- `pytest` (suite existente más 3 pruebas nuevas), `npm run build` completo y lint.
- `npm audit`, `pip-audit` y `ruff` con todas las reglas, como exploración.

**Benchmarks:**
- Herramienta: `autocannon` con 50 conexiones, 8 s y 2 s de calentamiento.
- Servidor y generador de carga en la misma máquina, así que **los números absolutos son bajos; lo que vale es la comparación**.
- Cada variante se probó primero sobre una copia del proyecto en el scratchpad; el repositorio solo se tocó después de validar.

**Frontend:** dos revisiones independientes del código, una del shell, las ventanas y las libs, y otra de las ventanas de contenido, los overlays, el SW y el build. Verifiqué a mano los hallazgos clave:
- `open constructor` en la terminal.
- `key={i}` en CoachTour.
- El `cache.put("/")` del SW.
- El `AudioContext` sin `resume()`.

**Severidad:** se usa la misma escala que en la auditoría anterior. **CONFIRMADO** significa trazado en el código o reproducido; **PLAUSIBLE**, que el código lo permite pero falta medirlo en un navegador real.

## 2. Rust: qué se usa, qué se adoptó y qué no conviene

### 2.1 Ya era Rust (sin cambios)

| Pieza | Componente en Rust |
|---|---|
| Bundler (Vite 8) | Rolldown + Oxc (parseo, transformación y minificación). El build del cliente tarda unos 0,6 s |
| CSS (Tailwind 4) | Oxide + Lightning CSS |
| Validación de la API | `pydantic-core` |
| Recarga en desarrollo | `watchfiles` (ahora a través de `granian[reload]`) |

### 2.2 Adoptado en esta auditoría (aplicado y verificado)

| Antes | Ahora (Rust) | Qué se gana (medido) |
|---|---|---|
| Uvicorn + httptools | **Granian** (hyper + tokio) | Ver §3.1: junto con SRV-1, `/api/status` pasa de **1 540 a 2 671 req/s (+73 %)** con p99 de 43 a 22 ms, y `/` de 746 a 2 044 req/s (×2,7) |
| `pip install -r requirements.txt` sin lock (D-3 pendiente) | **uv**: `requirements.lock` y `requirements-dev.lock` universales, con hashes | El lock resuelve en unos 5 s, con `uvloop` condicionado a no-Windows por marcador, que era lo que bloqueaba D-3. Docker y CI instalan **exactamente** lo que se probó. Hoy, sin lock, ya se instalaba Starlette 1.10 / Pydantic 2.14 en lugar de las 1.6 / 2.13 auditadas |
| ESLint 8 (fuera de soporte desde 10/2024) | **oxlint** 1.91 | **11 vulnerabilidades moderadas → 0** (todas venían de la cadena de ESLint 8: `minimatch`, `glob`, `rimraf`). 217 paquetes menos en `node_modules`. 41 archivos en unos 0,3 s, frente a 1,7 s. Ahora también se lintan los `.mjs` de `scripts/`, que ESLint no cubría |
| Sin lint de Python | **ruff** (CI: `ruff check .`) | Encontró 3 detalles reales en `main.py`, ya corregidos (§3.1) |

### 2.3 Evaluado y descartado (con el motivo)

| Idea | Veredicto |
|---|---|
| **Rust→WASM en el frontend** (fondo animado, layout, terminal, simulador) | **No.** No hay cómputo que acelerar: el layout son decenas de operaciones con N ≤ 11 ventanas, el simulador es una fórmula cerrada O(1) y el parser de la terminal es un `split` sobre ≤ 200 caracteres. El costo real está en el **repintado** (BG-1) y los **re-renders** (T-7, OV-3, SIM-1), que WASM no puede tocar. WASM añadiría entre 15 y 60 KB, una inicialización asíncrona y exigiría `'wasm-unsafe-eval'` en `script-src`, lo que debilita la CSP |
| `orjson` en la API | **No.** FastAPI ya serializa con `pydantic-core` (Rust) gracias a `response_model`. El único `json.dumps` escribe una línea de unos 200 bytes por mensaje de contacto: unos µs |
| CLI de brotli o zstd en Rust para `compress.mjs` | **No.** El zlib de Node es la misma librería en C y el paso completo tarda 0,6 s. zstd nivel 19 da 143,8 KB contra 133,8 KB de brotli q11 (+7 %) y Safari no lo soporta |
| Cambiar Caddy (Go) por un proxy en Rust (Pingora, Ferron, static-web-server) | **No.** Caddy da TLS automático, HTTP/3 y `precompressed` ya validados (D-5 a D-7). Cambiarlo es riesgo sin una ganancia medible para este tráfico |
| `oxipng` / AVIF (`ravif`) para imágenes | **Marginal.** El favicon pesa 9 KB y la foto 22 KB, y no se cargan en el landing. Lo que sí pesa es borrar los **4 MB** sin uso (D-4) |
| **Reescribir el backend en Rust (axum)** | **Opcional: decisión tuya** (ver §2.4) |

### 2.4 Opción abierta: backend en Rust (axum + tokio)

Hoy el backend son unas 400 líneas: contacto, health, CSP y estáticos (estos últimos solo cuando no hay Caddy delante).

**Lo que daría:**
- Un binario estático y una imagen *distroless* de unos 10 MB, frente a unos 150 MB con Python.
- Varias veces más req/s y unos 5 MB de RAM.
- Un argumento de portafolio: el sitio se presenta como "poliglota" y no tiene Rust.

**Lo que cuesta:**
- Reescribir y mantener la lógica, y portar las 51 pruebas de `pytest`. Se podrían dejar como pruebas HTTP de caja negra contra el binario, lo que las haría reutilizables.
- Añadir el toolchain de Rust al CI.
- No existe una necesidad operativa: con Caddy delante, la API solo atiende `/api/*`, y el tráfico de un portafolio cabe holgadamente en lo medido.

**Recomendación:** hacerlo solo si te interesa como pieza de portafolio. Por rendimiento o seguridad no hace falta.

## 3. Backend por funcionalidad

### 3.1 Servidor y middleware

| ID | Sev. | Estado | Hallazgo | Evidencia / corrección |
|---|---|---|---|---|
| SRV-1 | **Media** | ✅ Corregido | `@app.middleware("http")` es un `BaseHTTPMiddleware`: crea una tarea y un stream de cuerpo por cada request. Era el principal cuello de botella del servidor | Medido en una copia: con Uvicorn, 1 540 → 2 073 req/s (+35 %) en `/api/status`. Ahora es el middleware ASGI puro `SecurityAndLimits`, con el mismo comportamiento (cabeceras con semántica `setdefault`, 411 y 413 tempranos) |
| SRV-2 | Baja | ✅ Corregido | `GZipMiddleware` corría en cada respuesta sin aportar nada: la API responde menos de 1 KB, los estáticos ya van precomprimidos y Caddy comprime `/api/*`. Además ignoraba `gzip;q=0` (era el residual F-5 de la auditoría anterior) | Eliminado |
| SRV-3 | Media (rendimiento) | ✅ Corregido | Uvicorn → **Granian** (Rust) | Medido. `/api/status`: 1 839 req/s con el middleware anterior y **2 671** con SRV-1. Estáticos servidos por Python: 2,3×–2,7× |
| SRV-4 | Baja | ⚠️ Aceptado | Granian siempre envía `server: granian` y no tiene opción para quitarla (Uvicorn sí: M-3) | En Docker, Caddy la elimina (`-Server`), y el CI ahora lo comprueba. En un despliegue **sin** Caddy queda visible. Es solo una divulgación de stack, sin impacto real |
| SRV-5 | Baja | Abierto (heredado) | El handler de `Exception` (500) corre en `ServerErrorMiddleware`, por fuera del middleware de cabeceras, así que las respuestas 500 salen sin CSP ni `nosniff`. Es el residual de M-2 | Es un JSON sin HTML, así que el impacto es mínimo. Se podría añadir las cabeceras dentro del propio handler |
| SRV-6 | Baja | Documentado | Con `FORWARDED_ALLOW_IPS=*` (así viene en Docker) **todos** los saltos se consideran confiables y se toma el **primer** valor de XFF, que controla el cliente. Hoy es seguro porque Caddy **sobrescribe** XFF (no confía en la cabecera entrante salvo que se configure `trusted_proxies`) | Documentado en `main.py`, el Dockerfile y el README. Endurecimiento opcional: fijar una subred en `docker-compose.yml` y confiar solo en ella |
| — | — | ✅ Corregido (ruff) | Línea muerta `local, sep, domain = v.rpartition("@")`, `raise` sin `from` y un `if path:` que siempre era verdadero | — |

**Nuevo punto de entrada:** `main:asgi`. Es la app envuelta con el manejo de `X-Forwarded-For` de Granian, y solo cuando `TRUST_PROXY=1`. Toma el último salto que **no** es proxy, la misma regla que usaba Uvicorn con `--proxy-headers`. `main:app` sigue siendo la app FastAPI sin envolver, para los tests o para usar otro servidor ASGI. Pruebas nuevas:
- `test_proxy_entrypoint_uses_last_untrusted_hop`
- `test_proxy_entrypoint_untrusted_peer_ignores_forwarded_for`
- `test_security_headers_on_early_rejections`

Verificado también con el servidor real: XFF rotando el primer valor da 5×200 y luego 429.

### 3.2 API de contacto (`POST /api/contact`)

| ID | Sev. | Estado | Hallazgo | Escenario | Corrección propuesta |
|---|---|---|---|---|---|
| CT-1 | **Alta** | Abierto | El rate limit va por **IP exacta**: no agrupa IPv6 por /64 (C-2 lo mencionaba, pero no se aplicó). Tampoco hay un cupo **global** ni un tope de tamaño para `contact_messages.jsonl` | Un atacante con un /64 (cualquier VPS o conexión residencial con IPv6) rota direcciones y obtiene envíos ilimitados. Con unos 5 KB por mensaje, a 1 000 req/s son unos 18 GB por hora en el volumen `contact-data`, que comparte disco con el host. El health check pasa a 503 cuando el disco se llena y Caddy deja de enrutar | (a) Clave `ipaddress.ip_network(f"{ip}/64", strict=False)` para IPv6. (b) Cupo global, por ejemplo 100 mensajes por hora en total, respondiendo 429. (c) Rechazar con 507 o 503 si el log supera, por ejemplo, 50 MB, y alertar |
| CT-2 | Media | Abierto | Los mensajes (nombre, email y texto) se guardan sin aviso de tratamiento, sin plazo de retención y sin procedimiento de borrado | La **Ley 21.719** de protección de datos personales de Chile entra en vigencia en diciembre de 2026 (vigencia diferida de 24 meses desde su publicación). Un formulario que recoge datos personales sin aviso es lo primero que se revisa. *Conviene confirmar el alcance con alguien del área legal* | Una línea bajo el botón ("Usaré tus datos solo para responderte; se eliminan a los N meses"), retención automática (purgar líneas de más de N meses) y un email para solicitar la eliminación |
| CT-3 | Media | Abierto (pendiente desde C-5b) | Nadie recibe aviso de que llegó un mensaje nuevo | La UI promete "responderé dentro de 24–48 h" | Ver el snippet de C-5 en PROPUESTAS.md. Falta que elijas el canal |

### 3.3 Estáticos y SPA (`/{path}`)

Sin hallazgos nuevos. Verificado tras los cambios: 404 real para assets inexistentes, ETag/304, precompresión br/gz, symlink de `dist/`, `/%00` → 404 y el hash CSP sin cambios (`git diff deploy/` vacío tras `npm run build`).

## 4. Despliegue, dependencias y CI

| ID | Sev. | Estado | Hallazgo | Corrección |
|---|---|---|---|---|
| DEP-1 | Media | ✅ Corregido | **D-3:** dependencias transitivas sin fijar. Ya se estaban instalando versiones distintas de las auditadas | `requirements.lock` y `requirements-dev.lock` (generados con uv, universales y con hashes). Docker: `uv pip install --require-hashes`. El CI comprueba que el lock coincida con `requirements*.txt` |
| DEP-2 | Media | ✅ Corregido | ESLint 8 fuera de soporte, con 11 vulnerabilidades moderadas (solo de desarrollo) | oxlint (§2.2). `npm audit` → 0 |
| DEP-3 | Baja | ✅ Corregido | `uvicorn[standard]` instalaba en producción `websockets`, `watchfiles`, `pyyaml` y `python-dotenv`, que no se usan | El lock de producción pasa de 19 a 13 paquetes. Menos superficie y menos CVE posibles |
| DEP-4 | Baja | ✅ Corregido | El CI no auditaba dependencias ni lintaba Python | Job `audit` (`pip-audit` con el lock más `npm audit`) y `ruff check .` en el job `backend` |
| DEP-5 | Media | Abierto (D-2) | Caddy sigue sin enviar HSTS | Como en PROPUESTAS D-2: `max-age=300` y subirlo cuando HTTPS sea estable |
| DEP-6 | Baja | Abierto (D-4) | Unos 4 MB de imágenes sin uso y `img/README.md` (76 KB) se copian a `dist/` | Borrarlos de `public/img/` |
| DEP-7 | Baja | Abierto | Las GitHub Actions están fijadas por tag (`@v4`) y las imágenes base de Docker por tag, no por SHA ni digest. Tampoco hay Dependabot ni Renovate | Fijar por SHA y digest y añadir `.github/dependabot.yml` (pip, npm, docker, github-actions) |

## 5. Frontend por funcionalidad

En seguridad, el frontend sale limpio:
- No hay sinks de XSS (`dangerouslySetInnerHTML`, `innerHTML` ni `eval`).
- Todos los `href` son constantes y los `target=_blank` llevan `noopener noreferrer`.
- Lo que viene de localStorage y de la URL se compara contra valores conocidos.
- Todo es compatible con la CSP actual.

Los hallazgos son de **rendimiento de pintado, accesibilidad y robustez**.

### 5.1 Shell y ventanas (`PolyglotPortfolio.jsx`, `FloatingWindow.jsx`, `BootScreen.jsx`)

| ID | Sev. | Estado | Archivo | Hallazgo y escenario | Corrección |
|---|---|---|---|---|---|
| SH-1 | Media | CONFIRMADO | PolyglotPortfolio.jsx:369-373, useFocusTrap.js:27-41 | Ctrl+K abre la paleta sin cerrar CORE ni el tour, y quedan **dos focus traps** compitiendo en `document`. Con CORE abierto, Ctrl+K y luego Tab, el foco nunca pasa de la primera opción | Cerrar CORE y el coach al abrir la paleta, o mantener una pila de traps en la que solo actúe el último |
| SH-2 | Media | CONFIRMADO | PolyglotPortfolio.jsx:263-271 | FE-7 está incompleto. (a) Al minimizar, el foco queda dentro de un subárbol `inert`. (b) Simulador, insignias y detalle de proyecto no tienen `[data-dock-id]`, así que al cerrar el foco cae a `body` | Llevar el foco al icono del dock al minimizar. Como respaldo, el botón CORE, o la tarjeta del proyecto en el caso del detalle |
| SH-3 | Media | CONFIRMADO | TopBar, BootScreen, Hero, FloatingWindow, Dock | Texto de 9,5 a 10,5 px en `white/30`–`/45`: el contraste va de 2,5:1 a 4,46:1, bajo el 4,5:1 que exige WCAG 1.4.3 | Usar como mínimo `white/50` (≈ 5,3:1) en el texto informativo |
| SH-4 | Media | CONFIRMADO | PolyglotPortfolio.jsx:386-392 | Los atajos de una sola tecla (1–9 y `?`) no se pueden desactivar (WCAG 2.1.4, nivel A). Con control por voz, decir "uno" abre una ventana | Exigir Alt+número o añadir un interruptor para desactivarlos |
| SH-5 | Baja | CONFIRMADO | PolyglotPortfolio.jsx:358 | El autotour **cierra** las ventanas en lugar de minimizarlas: se pierde el borrador de Contacto y el historial de la terminal que FE-2 quería conservar | Minimizar en lugar de cerrar |
| SH-6 | Baja | CONFIRMADO (impacto PLAUSIBLE) | FloatingWindow.jsx:17-22 | `querySelector` y `getBoundingClientRect` se llaman **durante el render** de cada ventana: cualquier render del shell fuerza N lecturas de layout síncronas | Calcular `toDock` en un `useLayoutEffect` y solo al minimizar |
| SH-7 | Baja | CONFIRMADO | BootScreen.jsx:51-60 | El boot es un `role="dialog"` sin `aria-modal` ni trampa de foco, y no se puede saltar con teclado. La TopBar sigue enfocable debajo, con foco invisible | `inert` en el resto mientras dura el boot y Esc/Enter para saltarlo |
| SH-8 | Baja | CONFIRMADO | ui.jsx:225-258 | El `radiogroup` TI/RRHH no responde a las flechas y sus dos radios están en el orden de Tab | Flechas y `tabIndex` itinerante, o botones con `aria-pressed` |
| SH-9 | Baja | PLAUSIBLE | PolyglotPortfolio.jsx:662-670 | El toast monta un `role="status"` ya con su contenido; muchos lectores no anuncian una región así | Una región `aria-live` persistente que solo reciba el texto |
| SH-10 | Baja | PLAUSIBLE | PolyglotPortfolio.jsx:369 | `e.key.toLowerCase()` lanza un error con los `keydown` sintéticos del autocompletado de Chrome | `e.key?.toLowerCase()` |
| SH-11 | Baja | CONFIRMADO | PolyglotPortfolio.jsx:51 | `useState(makeInitialWindows())` se evalúa en cada render | `useState(makeInitialWindows)` |

### 5.2 Carga diferida y redeploys (`lazy.js`, `reload.js`, `SectionBoundary.jsx`)

| ID | Sev. | Estado | Hallazgo y escenario | Corrección |
|---|---|---|---|---|
| LZ-1 | Media | CONFIRMADO en código | FE-3 y FE-4 quedaron como "recargar una vez", no como un reintento. (a) Un corte de red breve al abrir una ventana **recarga toda la página** y se pierden los borradores de las otras ventanas. (b) Si `reloadOnce()` se niega (offline, menos de 30 s desde la última recarga, o `sessionStorage` bloqueado), `React.lazy` cachea el rechazo: Ctrl+K queda muerto toda la sesión y, si falló `motionFeatures`, **toda la UI queda en `opacity:0`** sin ningún mensaje | `lazyWithRetry`: reintentar el `import()` 1 o 2 veces con backoff, y recargar solo ante un 404 de chunk obsoleto. Poner `key={intentos}` en los boundaries `silent` y un flag en memoria si el storage falla |

### 5.3 Fondo animado y pintado (`CircuitBackground.jsx`, `prerender.jsx`)

| ID | Sev. | Estado | Hallazgo | Corrección |
|---|---|---|---|---|
| BG-1 | Media | PLAUSIBLE (medir con DevTools Performance) | 16 trazos animan `stroke-dashoffset` y hay 8 puntos SMIL, que no se componen en GPU. A eso se suma `backdrop-filter: blur` en cada ventana (con fondo opaco al 92 %, donde el blur ni se ve), en el dock y en el toast: el blur se recalcula en cada frame sobre un fondo en movimiento. En un portátil modesto con 2 o 3 ventanas abiertas, el resultado es jank y consumo de batería continuo | Quitar el `backdrop-filter` cuando el fondo es ≥ 0,9 opaco, pausar el fondo si las ventanas cubren más del 60 % y bajar la cadencia. **No es un caso para WASM**: el costo está en el motor de render |
| BG-2 | Baja | CONFIRMADO | `prefersReducedMotion()` se lee una sola vez: activar "reducir movimiento" a mitad de sesión no pausa el SMIL | Escuchar `matchMedia(...).addEventListener("change")` |
| BG-3 | Baja | CONFIRMADO | El listener `resize` del script inline no se quita nunca y sigue escribiendo variables CSS en `<html>` después de que React monta | Quitarlo al montar. Ojo: **cambia el hash CSP**, así que hay que desplegar `dist/` y el `.caddy` juntos |
| BG-4 | Baja | CONFIRMADO | RadarChart, ProjectDiagram, CountUp, Tilt y los datos (unos 16 KB) van en el chunk principal aunque solo los usan las ventanas | Separar `ui.jsx` y los datos por consumidor. Ahorro estimado: 4–6 KB gzip en el arranque |

### 5.4 Sonido (`lib/sound.js`)

| ID | Sev. | Estado | Hallazgo y escenario | Corrección |
|---|---|---|---|---|
| SND-1 | Media | CONFIRMADO en código | El `AudioContext` se crea en el primer `play()`, aunque aún no haya habido interacción. Un visitante que vuelve con `sound=on` recibe el toast a los 3 s, el contexto nace en estado `suspended` y nunca se llama a `resume()`: **no hay sonido en toda la sesión** | `if (!navigator.userActivation?.hasBeenActive) return;` y `if (ctx.state === "suspended") ctx.resume();` |

### 5.5 Terminal (`TerminalContent.jsx`)

| ID | Sev. | Estado | Hallazgo y escenario | Corrección |
|---|---|---|---|---|
| T-1 | Baja | **CONFIRMADO** (verificado a mano) | :79 `TERMINAL_OPEN_ALIASES[arg]` sobre un objeto literal: `open constructor` o `open toString` resuelven a funciones del prototipo y `openWindow` crea una entrada basura en `windows` con `open:true`. Después de eso, el Hero no vuelve al cerrar todo | `Object.hasOwn(ALIASES, k)` y, en `openWindow`, `if (!w[id]) return w` |
| T-2 | Media | CONFIRMADO | :326 El log no tiene `role="log"` ni `aria-live`: con lector de pantalla, `help` no produce ninguna respuesta audible | `role="log" aria-live="polite"`, y `aria-hidden` en el arte ASCII |
| T-3 | Baja | CONFIRMADO | :272-280 Tab hace `preventDefault` aunque no haya coincidencias, así que con texto en el input Tab no hace nada (FE-6 incompleto) | `preventDefault` solo si `hits.length > 0` |
| T-4 | Baja | PLAUSIBLE | :321-324 Un clic en la consola hace `scrollToEnd()` y enfoca el input, así que seleccionar texto para copiarlo salta al final y se pierde la selección | No hacer nada si `getSelection().toString()` no está vacío |
| T-5 | Baja | CONFIRMADO | :127-129 Si se escribe `matrix` dos veces en menos de 2,6 s, el primer timeout apaga la lluvia antes de tiempo | Guardar el id del timer y cancelarlo |
| T-6 | Baja | CONFIRMADO | :173-183 El `switch` usa el comando sin normalizar, y cualquier argumento lo rompe (`skills --all` → "no reconocido") | Hacer el `switch` sobre `cmd` |
| T-7 | Baja | CONFIRMADO | `key={idx}` con `slice(-300)`: con el log lleno, cada comando reescribe los 300 nodos. Además, `cmdHistory` crece sin límite | Id incremental por línea y tope de 100 entradas en el historial |
| T-8 | Baja | CONFIRMADO | :232-257 about, skills y experience están duplicados en duro en lugar de leerse de `data/content.js` | Leer de `data/` |

### 5.6 Formulario de contacto (frontend: `ContactContent.jsx`)

Verificado como correcto:
- `AbortController` con timeout de 12 s, que también cubre la lectura de `res.json()`.
- Guard contra el doble envío y aborto al desmontar.
- La regex de email es lineal (sin ReDoS) y equivalente a la del backend.
- Se envían solo los campos necesarios.

| ID | Sev. | Estado | Hallazgo | Corrección |
|---|---|---|---|---|
| CF-1 | Baja | CONFIRMADO | Si falla la validación, el foco no va al primer campo inválido. Tras un envío exitoso, el botón se desmonta y el foco cae a `body`; además, "Mensaje enviado" no tiene `role="status"` | Enfocar el primer `aria-invalid`, y en el éxito usar `role="status"` y enfocar "Enviar otro" |
| CF-2 | Media | Abierto | Falta el aviso de privacidad (es la contraparte de CT-2) | Ver CT-2 |

### 5.7 Simulador (`SimulatorContent.jsx`)

| ID | Sev. | Estado | Hallazgo | Corrección |
|---|---|---|---|---|
| SIM-1 | Media | CONFIRMADO | :131,141 El `aria-live` envuelve el contador, que cambia **en cada frame** (60 Hz durante unos 3 s): el lector de pantalla se satura o descarta los anuncios | Sacar el progreso de la región `live` y anunciar solo el veredicto final |

### 5.8 Tours, paleta y CORE (`overlays/`)

| ID | Sev. | Estado | Hallazgo y escenario | Corrección |
|---|---|---|---|---|
| OV-1 | Media | **CONFIRMADO** (verificado a mano) | CoachTour.jsx:70 La tarjeta lleva `key={i}` y se remonta en cada paso. El trap devuelve el foco al primer botón, que es **"Saltar tour"**. Un usuario de teclado pulsa Enter en "Siguiente" y su siguiente Enter cierra el tour y lo marca como visto | Quitar `key={i}` de la tarjeta, o poner `data-autofocus` en "Siguiente" |
| OV-2 | Baja | PLAUSIBLE | CoachTour.jsx:116-119 Si ningún target tiene tamaño, `steps=[]`: no se renderiza nada, pero `coachOpen` queda en true y los atajos globales dejan de funcionar | Si `steps.length === 0`, llamar a `onClose()` |
| OV-3 | Baja | CONFIRMADO | AutoTourBar.jsx:13-16 Un `setInterval` de 100 ms re-renderiza la barra 10 veces por segundo durante 60 s | Animación CSS con `animation-play-state` y `onAnimationEnd` |
| OV-4 | Baja | CONFIRMADO | CommandPalette.jsx:108-135 Los encabezados de grupo no tienen rol dentro de `listbox`, y Tab recorre las unas 20 opciones en vez de seguir el patrón combobox | `role="group"`/`presentation` y opciones con `tabIndex={-1}` |

### 5.9 Service worker (`public/sw.js`)

| ID | Sev. | Estado | Hallazgo y escenario | Corrección |
|---|---|---|---|---|
| SW-1 | Media | CONFIRMADO | `/img/*` y `/fonts/*` no llevan hash pero van por cache-first, y `sw.js` es idéntico byte a byte entre deploys (`VERSION` manual). Si reemplazas la foto con el mismo nombre, los visitantes que vuelven **ven la vieja indefinidamente** | Stale-while-revalidate para img y fonts, e inyectar el hash del build en `sw.js` en el post-build |
| SW-2 | Media/Baja | CONFIRMADO | El `trim` es FIFO, no LRU: cada deploy agrega unas 45 entradas y, al pasar de 80, borra primero las fuentes y el chunk `react`, que siguen en uso. Además, `trim()` corre fuera de `waitUntil` | Al activar, purgar lo que no esté referenciado en el `index.html` actual |
| SW-3 | Baja | **CONFIRMADO** (verificado a mano) | :47 Cualquier navegación `ok` se guarda bajo `"/"`. Si alguien abre `/robots.txt` en una pestaña, la portada offline pasa a ser ese archivo | Cachear solo si el `content-type` es `text/html` |
| SW-4 | Baja | CONFIRMADO | No hay navigation preload ni timeout: con red mala ("lie-fi"), la navegación se cuelga en vez de usar la copia en caché | `navigationPreload.enable()` y un timeout de unos 3 s con fallback |

### 5.10 Build, prerender y CSP (`scripts/`)

| ID | Sev. | Estado | Hallazgo | Corrección |
|---|---|---|---|---|
| B-1 | Baja (latente) | CONFIRMADO | prerender.mjs:31-33 `String.replace` con un string de reemplazo interpreta `$&`, `` $` `` y `$'`. Si un texto llega a contenerlos, el HTML se corrompe en silencio, y el hash CSP igual "cuadra" porque se calcula sobre el resultado ya corrupto | `.replace(pat, () => valor)` |
| B-2 | Baja | CONFIRMADO | deploy-headers.mjs:8 y main.py solo hashean `<script>` **sin atributos**. Un JSON-LD (`type=`) futuro quedaría bloqueado por la CSP sin que el build falle | Que el build falle si hay algún `<script` inline sin hash |
| B-3 | Baja | CONFIRMADO (medido) | compress.mjs comprime de forma síncrona y en serie: 513 ms, frente a 189 ms con la versión asíncrona y `Promise.all` | Opcional, ganancia de menos de 0,4 s. También conviene omitir los `.br`/`.gz` que no salgan más chicos que el original |

### 5.11 Contenido y SEO

| ID | Sev. | Hallazgo |
|---|---|---|
| FE-1 | **Alta** | Abierto desde la auditoría anterior: `github.com/maxcaniullan` da 404 (theme.js:21). Falta tu usuario real |
| SEO-1 | Media | `index.html` dice "**Senior** Backend Engineer", mientras el contenido dice "2 años" y "Backend Developer". Un reclutador lo nota |
| SEO-2 | Baja | Faltan `og:image`, `og:url` y `<link rel="canonical">`, y `twitter:card summary` va sin imagen: al compartir el enlace no aparece vista previa |
| SEO-3 | Baja | content.js:143 dice "Autometicé" (debería ser "Automaticé"), y quedan los placeholders "Institución Académica" y "Tech Academy" |

## 6. Mediciones

**Backend** (Windows, 50 conexiones, 8 s; carga y servidor en la misma máquina):

| Variante | `/api/status` req/s (p99) | `/` br req/s (p99) | JS principal br req/s (p99) |
|---|---|---|---|
| Antes: Uvicorn + BaseHTTPMiddleware + GZip | 1 540 (43 ms) | 746 (79 ms) | 656 (91 ms) |
| Solo Granian | 1 839 (32 ms) | 1 591 (39 ms) | 1 194 (55 ms) |
| Solo middleware ASGI puro (Uvicorn) | 2 073 (28 ms) | 1 018 (64 ms) | 834 (69 ms) |
| **Ahora: Granian + ASGI puro, sin GZip** (`python main.py` real) | **2 671 (22 ms)** | **2 044 (29 ms)** | **1 523 (43 ms)** |

En Docker los estáticos los sirve Caddy, así que en producción la mejora que cuenta es la de `/api/*`. La de estáticos aplica a un despliegue sin Caddy.

**Herramientas:**

| Métrica | Antes | Ahora |
|---|---|---|
| `npm audit` | 11 moderadas | **0** |
| Paquetes en `node_modules` | 264 | 49 |
| Lint frontend | ESLint 8: 1,7 s, solo `.js`/`.jsx` | oxlint: unos 0,3–0,7 s, 41 archivos incluidos los `.mjs` |
| Paquetes Python en producción | 19 (sin fijar) | 13 (fijados con hash) |
| `pytest` | 48 ✅ + 2 omitidas | **51 ✅** + 2 omitidas (las mismas de POSIX en Windows) |
| `ruff check .` | No existía | ✅ |
| `pip-audit` con el lock | — | ✅ sin vulnerabilidades |
| `npm run build` (prerender en 18 viewports) | ✅ | ✅, con `deploy/security-headers.caddy` sin cambios |

## 7. Plan priorizado de lo que queda abierto

| Prioridad | IDs | Esfuerzo | Motivo |
|---|---|---|---|
| 1 | FE-1, SEO-1 | 5 min | Es lo primero que ve un reclutador |
| 2 | **CT-1** | ~45 min | Envíos ilimitados con IPv6 y disco lleno |
| 3 | CT-2 / CF-2 | ~30 min + revisión legal | La Ley 21.719 entra en vigencia en diciembre de 2026 |
| 4 | LZ-1, SND-1, T-1, SW-3 | ~1 h | Fallos silenciosos: UI invisible, sonido mudo, estado basura, portada offline equivocada |
| 5 | SW-1, SW-2, DEP-5 (HSTS), DEP-6 (4 MB) | ~1 h | Caché obsoleta, HSTS e imágenes sin uso |
| 6 | Accesibilidad: OV-1, SH-1 a SH-4, T-2, SIM-1, CF-1 y el resto | 2–3 h | WCAG A/AA |
| 7 | BG-1 (medir primero), SH-6, BG-4, OV-3, T-7 | 2 h | Fluidez y batería |
| 8 | DEP-7, B-1, B-2, el resto de Bajas | Variable | Endurecimiento |
| — | §2.4 backend en axum | 1–2 días | Solo si lo quieres como pieza de portafolio |

## 8. Cambios aplicados en esta auditoría

| Archivo | Cambio |
|---|---|
| `main.py` | Middleware ASGI puro (SRV-1), sin GZip (SRV-2), Granian y el punto de entrada `main:asgi` con `with_proxy_headers` (SRV-3), y las correcciones de ruff |
| `tests/test_api.py` | 3 pruebas nuevas: proxy con último salto no confiable, peer no confiable y cabeceras en los 413 |
| `requirements.txt`, `requirements-dev.txt` | `granian[uvloop]` reemplaza a `uvicorn[standard]`. En desarrollo se añaden `granian[reload]` y `ruff` |
| `requirements.lock`, `requirements-dev.lock` | **Nuevos**: generados con uv, universales y con hashes |
| `ruff.toml`, `.oxlintrc.json` | **Nuevos** |
| `.eslintrc.cjs` | Eliminado |
| `package.json`, `package-lock.json` | Se quitan eslint y sus 3 plugins y se añade `oxlint` 1.91.0 (versión exacta) |
| `Dockerfile` | Etapa de dependencias con `uv pip install --require-hashes -r requirements.lock` y CMD con `granian … main:asgi` |
| `.github/workflows/ci.yml` | El backend instala desde el lock con uv, comprueba que el lock esté al día y ejecuta `ruff check`. Nuevo job `audit` (pip-audit + npm audit). El smoke test de Docker comprueba que `server:` no salga por Caddy |
| `README.md` | Instalación desde el lock, Granian, oxlint, ruff y la semántica de `FORWARDED_ALLOW_IPS` |

> ⚠️ **Sin verificar localmente:** el build de la imagen Docker (el daemon no estaba activo). Las piezas nuevas que dependen de él son la imagen `ghcr.io/astral-sh/uv:0.13.7`, `uv venv` dentro de `python:3.14-slim` y Granian con `--loop uvloop` en Linux. El job `docker` del CI las construye y hace el smoke test completo a través de Caddy. Si falla, la causa estará en esa etapa.
