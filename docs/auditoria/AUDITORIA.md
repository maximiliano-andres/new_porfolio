# Auditoría técnica — Portfolio (FastAPI + React/Vite)

**Fecha:** 2026-11-02 · **Commit auditado:** `e438fa2` · **Stack:** FastAPI 0.141.1 / Starlette 1.6.0 / Pydantic 2.13.4 / Uvicorn 0.52.4 / Python 3.14 · React 18 + Vite 8 + framer-motion 11

## 1. Metodología

- **Pruebas reales:** se levantaron 3 copias aisladas de `main.py` (fuera del repo, para no escribir `contact_messages.jsonl` en el proyecto) con el `dist/` compilado real:
  - `:8701`: configuración por defecto (`APP_ENV=production`).
  - `:8702`: con `TRUST_PROXY=1`.
  - `:8703`: con `dist/` como **symlink**, el patrón típico de despliegue `releases/current`.
- Las peticiones HTTP se enviaron con **sockets crudos**, para controlar cada cabecera (Content-Length, Transfer-Encoding, X-Forwarded-For, Accept-Encoding, bytes nulos).
- Script reproducible: [`auditoria/audit_tests.py`](audit_tests.py). Resultado: **49 pruebas, 21 fallas** (más 1 prueba corregida: C1).
- **Pruebas unitarias directas** de `RateLimiter`, con 30 000 IPs distintas.
- **Frontend:** revisión de código de todos los componentes, `npm run lint` y `vite build`, validación cruzada de datos y de los assets referenciados.
- **Severidad:**
  - **Crítica:** explotable hoy con impacto grave.
  - **Alta:** falla real con impacto en usuarios o en la operación.
  - **Media:** falla real acotada, o riesgo futuro probable.
  - **Baja:** higiene o robustez.

## 2. Resumen ejecutivo

| Área | Crítica | Alta | Media | Baja | Total |
|---|---|---|---|---|---|
| Middleware / transversal | 0 | 0 | 1 | 2 | 3 |
| `GET /api/status` | 0 | 0 | 1 | 2 | 3 |
| `POST /api/contact` | 0 | 2 | 3 | 1 | 6 |
| `/api/{rest}` (catch-all) | 0 | 0 | 1 | 1 | 2 |
| `/{path}` (SPA + estáticos) | 0 | 1 | 2 | 3 | 6 |
| Despliegue / dependencias | 0 | 0 | 2 | 2 | 4 |
| Frontend (React) | 0 | 3 | 6 | 10 | 19 |
| **Total** | **0** | **6** | **16** | **21** | **43** |

**Lo más urgente:**
- Evasión del rate limit con `X-Forwarded-For` (C-1).
- Memoria sin límite en el limitador (C-2).
- Assets inexistentes devueltos como `index.html` 200, que rompen la app tras cada redeploy (F-1).
- Enlace de GitHub roto (FE-1).
- Estado perdido al minimizar ventanas (FE-2).
- Ningún reintento cuando falla la carga de chunks (FE-3).

**Lo que funciona bien, verificado con pruebas:**
- Path traversal bloqueado.
- CSP con hash del script inline, idéntico en FastAPI y en Caddy.
- 411 / 413 / 422 / 429 + `Retry-After`.
- Archivo de mensajes con permisos `0600`.
- Rechazo de `text/plain`, lo que impide envíos cross-site sin preflight.
- Precompresión br/gzip sin doble compresión.
- `sw.js` servido con `no-cache`.
- Lint sin warnings y build limpio.

---

## 3. Middleware transversal — `security_and_limits` ([main.py:104](../main.py#L104))

### Pruebas

| ID | Prueba | Esperado | Obtenido | Resultado |
|---|---|---|---|---|
| S2 | Cabeceras de seguridad en respuesta normal | CSP, nosniff, XFO | Presentes | ✅ PASA |
| C1 | POST chunked sin Content-Length | 411 | 411 `Falta Content-Length.` | ✅ PASA |
| C2 | Cabeceras de seguridad en 411/413 | CSP + nosniff | **Ausentes** | ❌ FALLA |
| C3 | Content-Length 99 999 | 413 | 413 | ✅ PASA |
| C4 | Content-Length `-1` | 4xx | 400 (lo rechaza uvicorn) | ✅ PASA |
| — | Content-Length `\xb2` (dígito Unicode) | 4xx | 400 (lo rechaza uvicorn antes de `isdigit()`) | ✅ PASA |
| S8 | Origen `http://localhost:5173` con `APP_ENV=production` | Sin ACAO | `access-control-allow-origin: http://localhost:5173` | ❌ FALLA |

### Hallazgos

**M-1 · Media · CORS de desarrollo activo en producción** ([main.py:54](../main.py#L54))
1. **Qué pasa:** `localhost:5173` y `127.0.0.1:5173` siempre se añaden a `allow_origins`, incluso con `APP_ENV=production`.
2. **Escenario:** cualquier página servida en el puerto 5173 de la máquina de un visitante (otro proyecto Vite, una extensión o un malware local) puede leer las respuestas de la API de producción. Hoy el impacto es bajo, porque la API no devuelve datos sensibles. Pero es una puerta abierta para endpoints futuros.
3. **Prueba:** S8.
4. **Corrección:** añadir esos orígenes solo `if IS_DEV`.

**M-2 · Baja · Respuestas tempranas sin cabeceras de seguridad** ([main.py:109](../main.py#L109), [main.py:130](../main.py#L130))
1. **Qué pasa:** los `return` de 411/413 salen antes del bucle que añade las cabeceras. El handler de `Exception` (500) corre en `ServerErrorMiddleware`, por fuera de este middleware, así que tampoco las recibe.
2. **Escenario:** las respuestas 411, 413 y 500 se envían sin `nosniff`, CSP ni `X-Frame-Options`.
3. **Prueba:** C2. La cabecera de la 413 es `date | server: uvicorn | content-length | content-type | connection`.
4. **Corrección:** construir la respuesta y pasarla por una función común `apply_security_headers(resp)`.

**M-3 · Baja · `server: uvicorn` expuesto**
1. **Qué pasa:** la cabecera `Server` revela el stack. Caddy la elimina (`-Server`), pero en un despliegue directo con uvicorn queda visible.
2. **Corrección:** pasar `server_header=False` a `uvicorn.run`.

---

## 4. `GET /api/status` ([main.py:203](../main.py#L203))

### Pruebas

| ID | Prueba | Esperado | Obtenido | Resultado |
|---|---|---|---|---|
| S1 | GET | 200 `{"status":"ok"}` | 200 `{"status":"ok"}` | ✅ PASA |
| S3 | Cache-Control en la respuesta | `no-store` | **Ausente** | ❌ FALLA |
| S4 | `HEAD /api/status` | 200 sin cuerpo, o 405 JSON | **200 `text/html`** (index del SPA) | ❌ FALLA |
| S5 | `POST /api/status` | 405 | **404** `Recurso no encontrado.` | ❌ FALLA |
| S6 | Preflight desde `https://evil.example` | 400 sin ACAO | 400 sin ACAO | ✅ PASA |
| S7 | Preflight desde `localhost:5173` | 200 con ACAO | 200 con ACAO | ✅ PASA |

### Hallazgos

**S-1 · Media · `HEAD /api/status` devuelve el HTML del SPA**
1. **Qué pasa:** `@app.get` no registra HEAD, y el catch-all `/api/{rest}` tampoco lo incluye. La petición termina en `serve_frontend`, que sí acepta HEAD y devuelve `index.html` con 200.
2. **Escenario:** un monitor de uptime que usa HEAD (UptimeRobot, el health check de un load balancer) siempre ve "200 OK", aunque la API esté rota. Por ejemplo, con un error de import en el router de la API, el monitor seguiría en verde mientras `dist/` exista.
3. **Prueba:** S4.
4. **Corrección:** declarar `@app.api_route("/api/status", methods=["GET", "HEAD"])` y añadir `HEAD` y `OPTIONS` al catch-all `/api/{rest}`.

**S-2 · Baja · Método incorrecto devuelve 404 en lugar de 405**
1. **Qué pasa:** el catch-all `/api/{rest}` acepta POST, PUT, PATCH y DELETE, así que gana la coincidencia completa frente a la ruta que existe pero con otro método.
2. **Escenario:** `POST /api/status` y `DELETE /api/contact` responden "Recurso no encontrado". Despista al depurar y no es correcto según HTTP.
3. **Prueba:** S5 y A5.
4. **Corrección:** en el catch-all, si la ruta existe con otro método, responder 405 con `Allow`. La alternativa más simple es limitar el catch-all a GET.

**S-3 · Baja · Respuestas de la API sin `Cache-Control`**
1. **Escenario:** un CDN o proxy con caché heurística podría guardar `/api/status`, o un 404 de la API.
2. **Prueba:** S3.
3. **Corrección:** poner `Cache-Control: no-store` en todo `/api/*` desde el middleware.

**S-4 · Baja (riesgo futuro) · El health check no comprueba nada**
1. **Qué pasa:** siempre responde `ok`. No verifica que `dist/` exista ni que se pueda escribir el log de contacto.
2. **Escenario:** el disco se llena o los permisos cambian → `/api/status` sigue en "ok" mientras cada mensaje de contacto devuelve 500.
3. **Corrección:** comprobar `os.access(BASE_DIR, os.W_OK)` y `index.html`, y responder 503 si alguno falla.

---
## 5. `POST /api/contact` ([main.py:208](../main.py#L208))

### Pruebas

| ID | Prueba | Esperado | Obtenido | Resultado |
|---|---|---|---|---|
| C5 | JSON malformado `{not json` | 422 | 422 `fields:["1"]` | ✅ PASA |
| C6 | Body `[]` | 422 | 422 | ✅ PASA |
| C7 | Nombre con solo espacios | 422 | 422 `fields:["name"]` | ✅ PASA |
| C8 | Email `a@.` | 422 | **200, almacenado** | ❌ FALLA |
| C9 | Email `a@b.` | 422 | **200, almacenado** | ❌ FALLA |
| C10 | Email `a@@b.cl` | 422 | **200, almacenado** | ❌ FALLA |
| C11 | Mensaje de 5001 caracteres | 422 | 422 | ✅ PASA |
| C12 | Nombre numérico | 422 | 422 | ✅ PASA |
| C13 | Bytes `\x00\x07` y carácter bidi `‮` | 422 | **200, almacenado** | ❌ FALLA |
| C14 | `Content-Type: text/plain` (request simple cross-site) | 415/422 | 422 | ✅ PASA |
| C15 | 8 envíos válidos seguidos | 429 + Retry-After | 1×200 y luego 429 `Retry-After: 600` (C8-C13 ya habían consumido 4 cupos) | ✅ PASA |
| C16 | Permisos de `contact_messages.jsonl` | `0600` | `0600` | ✅ PASA |
| C17 | Contenido del log | Solo emails válidos | `a@.`, `a@b.`, `a@@b.cl`, … | ❌ FALLA |
| C18 | `TRUST_PROXY=1`, 12 envíos rotando `X-Forwarded-For` | Algún 429 | **12 × 200** | ❌ FALLA |
| C19 | `TRUST_PROXY=1`, 8 envíos con la misma XFF | 429 a partir del 6.º | 5×200 y 3×429 | ✅ (informativo) |
| U1 | `RateLimiter.check` con 30 000 IPs distintas | ≤ 10 000 claves | **30 000 claves retenidas**, 0,28 ms por request | ❌ FALLA |

### Hallazgos

**C-1 · Alta · El rate limit se evade falsificando `X-Forwarded-For`** ([main.py:198](../main.py#L198))
1. **Qué pasa:** con `TRUST_PROXY=1`, `client_ip()` toma el **primer** valor de XFF. Ese valor lo controla el cliente. Proxies como nginx (`$proxy_add_x_forwarded_for`), ALB o Heroku **añaden** la IP real al final de la cabecera, no la reemplazan.
2. **Escenario:** un atacante envía `X-Forwarded-For: <IP aleatoria>` en cada petición. Obtiene envíos ilimitados: spam en el log de contactos y crecimiento del disco. Combinado con C-2, también crece la memoria.
3. **Prueba:** C18, 12/12 envíos aceptados.
4. **Corrección:** con `proxy_headers=True` y `forwarded_allow_ips` apuntando al proxy, Uvicorn ya reescribe `request.client`. Basta con usar siempre `request.client.host`. Si no, tomar el valor de XFF que corresponde al **último salto de confianza**: `split(",")[-N]`.

**C-2 · Alta · El limitador de memoria nunca libera nada (crecimiento sin límite y O(n) por request)** ([main.py:184](../main.py#L184))
1. **Qué pasa:** la limpieza solo borra las colas **vacías**. Pero una cola solo se purga cuando *esa misma* IP vuelve a llamar, así que nunca quedan colas vacías y la limpieza no elimina nada.
2. **Consecuencia:** a partir de 10 000 claves, *cada* request recorre el diccionario completo dentro del lock.
3. **Escenario:** basta con IPs distintas (rotación de IPv6 /64, una botnet o C-1). El diccionario crece sin techo y cada envío añade latencia lineal mientras retiene el lock global.
4. **Prueba:** U1, 30 000 claves retenidas.
5. **Corrección:** purgar por antigüedad (`q[-1] < now - window`) en lugar de `not v`. Otra opción es usar un `OrderedDict` con LRU, o limitar por prefijo /64 en IPv6.

**C-3 · Media · Cupo compartido detrás de un CDN y cupo multiplicado con varios workers**
1. **Detrás de Cloudflare → Caddy:** Caddy no confía por defecto en la XFF entrante y pone la IP del nodo de Cloudflare. Todos los visitantes de esa región comparten 5 envíos cada 10 minutos.
2. **Con `--workers N`:** cada proceso tiene su propio limitador, así que el límite real es 5×N.
3. **Prueba:** C19 demuestra que con la misma IP efectiva el sexto visitante recibe 429.
4. **Corrección:**
   - Configurar `trusted_proxies cloudflare` en Caddy y leer `CF-Connecting-IP`.
   - Documentar que se debe usar 1 worker, o mover el límite a Redis o SQLite.

**C-4 · Media · La validación de email acepta direcciones inválidas** ([main.py:157](../main.py#L157))
1. **Qué pasa:** solo se exige un `@` y un punto después del `@`.
2. **Escenario:** se aceptan `a@.`, `a@b.` y `a@@b.cl`. El mensaje se guarda pero **no se puede responder**, y además consume cupo del rate limit.
3. **Inconsistencia:** el frontend usa otra regla (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), así que front y back no coinciden.
4. **Prueba:** C8, C9, C10 y C17.
5. **Corrección:** usar `pydantic.EmailStr` (requiere `email-validator`) o una regex compartida que exija etiquetas no vacías: `^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$`.

**C-5 · Media · Los mensajes solo quedan en un `.jsonl` local, sin aviso, rotación ni respaldo**
1. **Qué pasa:** no hay notificación al dueño (email o webhook) y el archivo crece indefinidamente.
2. **Escenario:** en un PaaS o contenedor con disco efímero (Render, Fly, Docker sin volumen) cada redeploy **borra todos los mensajes**. En un VPS, si nadie revisa el archivo, el contacto queda sin respuesta. Esto contradice la promesa de la UI "Responderé dentro de 24–48 h".
3. **Corrección:**
   - Enviar una notificación por SMTP o webhook en segundo plano.
   - Configurar `CONTACT_LOG` por variable de entorno, apuntando a un volumen persistente.
   - Rotar el archivo (logrotate).

**C-6 · Baja · Se aceptan caracteres de control y bidi**
1. **Qué pasa:** `json.dumps` escapa `\x00`-`\x1f`, pero `‮` (RTL override) y los caracteres de ancho cero quedan tal cual.
2. **Escenario:** quien lea el log en un visor o en un futuro panel HTML puede ver nombres o emails visualmente falseados.
3. **Prueba:** C13.
4. **Corrección:** rechazar o eliminar las categorías Unicode `Cc` y `Cf` (excepto `\n` y `\t` en el mensaje).

---

## 6. `/api/{rest:path}` — catch-all de la API ([main.py:241](../main.py#L241))

### Pruebas

| ID | Prueba | Esperado | Obtenido | Resultado |
|---|---|---|---|---|
| A1 | `GET /api/nope` | 404 JSON | 404 JSON | ✅ PASA |
| A2 | `GET /api` (sin slash) | 404 JSON | **200 `text/html`** | ❌ FALLA |
| A3 | `HEAD /api/nope` | 404 | **200 `text/html`** | ❌ FALLA |
| A4 | `OPTIONS /api/nope` | 404/405 | 405 JSON | ✅ PASA |
| A5 | `DELETE /api/contact` | 405 | **404** | ❌ FALLA |

### Hallazgos

**A-1 · Media · Hay rutas de la API que caen en el SPA**
1. **Qué pasa:** `/api` sin barra y cualquier `HEAD /api/*` devuelven `index.html` con 200.
2. **Escenario:** clientes, monitores y crawlers reciben HTML con éxito cuando esperan JSON o un error. Esto oculta configuraciones rotas, como un proxy que reescribe mal la ruta.
3. **Prueba:** A2 y A3.
4. **Corrección:**
   - Registrar el catch-all también para `"/api"`.
   - Añadir `HEAD` y `OPTIONS` a sus métodos.
   - En `serve_frontend`, rechazar con 404 cualquier `path` que empiece por `api`.

**A-2 · Baja · 404 en lugar de 405 para métodos no soportados.** Es el mismo defecto que S-2 (prueba A5).

---

## 7. `/{path:path}` — SPA y archivos estáticos ([main.py:264](../main.py#L264))

### Pruebas

| ID | Prueba | Esperado | Obtenido | Resultado |
|---|---|---|---|---|
| F1 | `GET /` con `br, gzip` | br + `no-cache` | br + `no-cache` | ✅ PASA |
| F2 | Hash CSP del script inline | Presente | Presente (1 script) | ✅ PASA |
| F3 | Hash en `deploy/security-headers.caddy` | Igual al de `dist/` | `sha256-bBZ24x…` igual | ✅ PASA |
| F4 | Asset JS con gzip | gzip, `immutable`, sin doble compresión | Correcto | ✅ PASA |
| F5 | `Accept-Encoding: gzip;q=0, br;q=0, identity` | Sin codificar | **`br`** | ❌ FALLA |
| F6 | `GET /assets/old-deploy-AbC123.js` | 404 | **200 `text/html`** | ❌ FALLA |
| F7 | `GET /img/no-existe.webp` | 404 | **200 `text/html`** | ❌ FALLA |
| F8 | `GET /%2e%2e/main.py` | Sin código fuente | index.html | ✅ PASA |
| F9 | `GET /..%2fsecurity-headers.json` | Sin JSON de política | index.html | ✅ PASA |
| F10 | `GET /%00` | 4xx | **500 + traceback completo en el log** | ❌ FALLA |
| F11 | Nombre de archivo de 4000 caracteres | ≠ 500 | 200 | ✅ PASA |
| F12 | `GET /index.html.br` | No servir el binario | index.html | ✅ PASA |
| F13 | `GET /sw.js` | `no-cache` | `no-cache` | ✅ PASA |
| F14 | `GET /ruta/inexistente` | 404 | **200** (soft-404) | ❌ FALLA |
| F15 | `If-None-Match` con el ETag correcto | 304 | **200** (cuerpo completo) | ❌ FALLA |
| F16 | `GET /robots.txt` | 200 `text/plain` | 200 | ✅ PASA |
| F17 | Asset JS con `dist/` como symlink | `text/javascript` | **`text/html`** | ❌ FALLA |

### Hallazgos

**F-1 · Alta · Los assets inexistentes se responden con `index.html` y estado 200**
1. **Qué pasa:** el fallback del SPA se aplica también a `/assets/`, `/img/` y `/fonts/`. Caddy hace lo mismo (`try_files {path} /index.html`).
2. **Escenario:** tras un redeploy, quien tiene la pestaña abierta o un `index.html` antiguo pide `/assets/TerminalContent-<hash viejo>.js`. Recibe HTML con 200, y con `nosniff` el navegador falla con "Failed to load module script".
   - La ventana no abre: ver FE-3 y FE-4.
   - Además, `sw.js` (`cacheFirst`) guarda cualquier respuesta `ok`, así que **cachea el HTML bajo la URL de una imagen o fuente** de forma permanente.
3. **Prueba:** F6 y F7.
4. **Corrección:**
   - En FastAPI, devolver 404 si `path` empieza por `assets/`, `img/` o `fonts/` y no existe.
   - En Caddy, añadir `handle /assets/* { file_server }` sin `try_files`.
   - En `sw.js`, cachear solo si el `content-type` coincide con lo esperado.

**F-2 · Media · Un byte nulo en la ruta provoca un 500 y un traceback por cada petición** ([main.py:272](../main.py#L272))
1. **Qué pasa:** `Path.resolve()` lanza `ValueError: lstat: embedded null character in path`.
2. **Escenario:** un escáner o atacante repite `GET /%00`. Cada petición escribe unas 40 líneas de traceback (inundación del log o del disco) y contamina las alertas de errores 500.
3. **Prueba:** F10, con el traceback verificado en el log.
4. **Corrección:** `if "\x00" in path: return 404`, o capturar `ValueError`/`OSError` alrededor de `resolve()`.

**F-3 · Media (riesgo futuro) · Con `dist/` como symlink, todo el sitio queda roto** ([main.py:29-31](../main.py#L29))
1. **Qué pasa:** `FRONTEND_DIR` no se resuelve, pero `candidate` sí. Entonces `is_relative_to` es `False` para todos los archivos, y JS, CSS e imágenes se sirven como `index.html`.
2. **Escenario:** un despliegue atómico típico (`dist -> releases/2026-11-02`) produce una página en blanco.
3. **Prueba:** F17.
4. **Corrección:** resolver la raíz en cada petición, `root = FRONTEND_DIR.resolve()`, y comparar contra ella.

**F-4 · Baja · Se ignora `q=0` en `Accept-Encoding`** ([main.py:258](../main.py#L258))
1. **Qué pasa:** se comprueba si la subcadena aparece (`"br" in accepted`) en vez de parsear la cabecera.
2. **Escenario:** un cliente que rechaza br explícitamente recibe br igualmente. Es raro, pero rompe clientes estrictos o proxies que normalizan.
3. **Prueba:** F5.
4. **Corrección:** parsear los tokens y su `q`.

**F-5 · Baja · No hay respuestas condicionales (304)**
1. **Qué pasa:** se envía `ETag`, pero `If-None-Match` no se respeta.
2. **Escenario:** `index.html` (`no-cache`) se descarga completo en cada visita, en lugar de un 304 vacío.
3. **Prueba:** F15.
4. **Corrección:** comparar `If-None-Match` con el ETag y devolver `Response(status_code=304)`. Otra opción es dejar que Caddy sirva los estáticos.

**F-6 · Baja · Soft-404**
1. **Escenario:** cualquier URL devuelve 200 con la home, y Google puede indexar URLs basura como duplicados.
2. **Prueba:** F14.
3. **Corrección:** el SPA no tiene rutas propias, así que basta con servir `index.html` solo para `/` (y `/index.html`) y responder 404 al resto.

---
## 8. Despliegue, dependencias y calidad

| ID | Severidad | Hallazgo | Evidencia | Corrección |
|---|---|---|---|---|
| D-1 | Media | **No existe ninguna prueba automatizada ni CI.** Todas las fallas de este informe se habrían detectado con un `pytest` + `TestClient`. | No existe `tests/` ni `.github/workflows` | Convertir [`audit_tests.py`](audit_tests.py) en una suite de `pytest` y ejecutarla en CI junto con `npm run lint` y `npm run build` |
| D-2 | Media | **Caddy no envía HSTS.** `ENABLE_HSTS` solo se aplica en FastAPI, pero en producción Caddy sirve las páginas, así que el sitio queda sin `Strict-Transport-Security`. | `deploy/security-headers.caddy` no contiene HSTS | Añadir HSTS a `security-headers.json` o generarlo en `deploy-headers.mjs` |
| D-3 | Baja | **Dependencias transitivas de Python sin fijar** (starlette, pydantic, anyio). Un `pip install` futuro puede traer una versión incompatible. | `requirements.txt` solo fija fastapi y uvicorn | Usar `pip-compile` o `uv lock` con hashes |
| D-4 | Baja | **Unos 3,5 MB de imágenes sin uso** (`logo_max_andres.png` 1,9 MB, `max_andres_head.png` 1,6 MB, entre otras) y una guía `README.md` de 76 KB se copian a `dist/img/`. El README no queda expuesto: FastAPI excluye `.md` y Caddy lo bloquea con 404. | Revisado en `public/img` | Eliminar de `public/` lo que no se referencia |

---

## 9. Frontend (React)

**Lint:** sin errores ni warnings (`--max-warnings 0`). **Build:** limpio.

Chunks principales:

| Chunk | Tamaño | gzip |
|---|---|---|
| react | 139,8 kB | 45,3 kB |
| index | 90,6 kB | 30,9 kB |
| motionFeatures | 70,8 kB | 22,4 kB |
| CSS | 58,7 kB | 9,4 kB |

**XSS:** no hay `dangerouslySetInnerHTML` ni `innerHTML`, y la terminal muestra lo que escribe el usuario como texto de React. Los datos cruzados entre `content.js`, `hr.js` y `system.js` son consistentes y todos los assets referenciados existen.

### 9.1 Formulario de contacto (`ContactContent.jsx`)

| ID | Severidad | Hallazgo | Escenario | Corrección |
|---|---|---|---|---|
| FE-C1 | Media | La regex de email del front no coincide con la del back (ver C-4) | El front rechaza `a@b.` pero la API lo acepta. Si se corrige solo uno de los dos, divergen todavía más | Usar una regla única documentada en los dos lados |
| FE-C2 | Baja | Un 422 por JSON malformado devuelve `fields:["1"]` o `["body"]` | El usuario ve "Revisa los datos" sin ningún campo marcado. Inofensivo, pero poco claro | Tratar `body` como error genérico |

### 9.2 Ventanas y shell (`PolyglotPortfolio.jsx`, `FloatingWindow.jsx`, `BootScreen.jsx`)

| ID | Severidad | Archivo | Hallazgo | Escenario de falla | Corrección |
|---|---|---|---|---|---|
| FE-2 | **Alta** | [FloatingWindow.jsx:110](../src/components/FloatingWindow.jsx#L110) | Al minimizar, el contenido se **desmonta** (`{!isMinimized && …}`) | Escribes en la terminal o dejas el formulario a medias → minimizas desde el dock → restauras → historial y borrador vacíos. Un envío en curso se aborta | Mantener los hijos montados y ocultarlos con `hidden`/`inert` |
| FE-5 | Media | [PolyglotPortfolio.jsx:475](../src/PolyglotPortfolio.jsx#L475) + BootScreen.jsx:22,37 | `onDone={() => setBooted(true)}` es una función nueva en cada render y es dependencia del efecto del boot | Girar el teléfono o redimensionar durante el boot reinicia el log y oculta los botones de perfil | Usar `useCallback` en el padre, o guardar `onDone` en un ref |
| FE-12 | Baja | PolyglotPortfolio.jsx:229 | `isFrontmost` ignora el `z` de `projectWin` | Con el detalle de un proyecto delante, el clic en "Proyectos" del dock minimiza la ventana en vez de traerla al frente | Incluir `projectWin.z` en el máximo |
| FE-13 | Baja | PolyglotPortfolio.jsx:513 | El Hero se muestra aunque `projectWin` esté abierto | Se cierra "Proyectos" con un detalle abierto → el Hero aparece detrás con botones clicables | Añadir `!(projectWin.open && !projectWin.minimized)` a la condición |
| FE-14 | Baja (plausible) | PolyglotPortfolio.jsx:140 vs :319 | El timeout de 900 ms del coach no se cancela al iniciar el autotour | El CoachTour aparece encima del recorrido automático | Cancelar el timeout en `startAutoTour` |
| FE-15 | Baja | PolyglotPortfolio.jsx:192, FloatingWindow.jsx:50 | `visualViewport.resize` (pinch-zoom) crea un `windowSize` nuevo, y `onPointerDown` re-ordena el z en cada clic | Toda la app se re-renderiza en cada frame del gesto o en cada clic | Comparar antes de actualizar el estado y no hacer nada si la ventana ya está al frente |
| FE-16 | Baja | PolyglotPortfolio.jsx:83,107 · BadgesContent.jsx:18 | `readSet` no filtra contra los ids válidos | Con ids obsoletos en localStorage aparece "15 de 13 insignias", el progreso pasa de 100 % y "Explorador" queda inalcanzable | Filtrar por ids válidos y comparar con `>=` |

### 9.3 Carga diferida y despliegues

| ID | Severidad | Archivo | Hallazgo | Escenario de falla | Corrección |
|---|---|---|---|---|---|
| FE-3 | **Alta** (plausible) | [PolyglotPortfolio.jsx:36](../src/PolyglotPortfolio.jsx#L36) | `loadMotionFeatures` no tiene `.catch`, y `LazyMotion` no maneja el rechazo | Un HTML viejo pide un `motionFeatures-*.js` que ya no existe (F-1) → ventanas, toasts y botones del boot quedan invisibles (`opacity:0`) sin ningún error visible | `.catch` que recarga una sola vez (con un flag en `sessionStorage`) y un listener de `vite:preloadError` en `main.jsx` |
| FE-4 | Media | [lazy.js:14](../src/windows/lazy.js#L14), SectionBoundary.jsx:28 | `React.lazy` cachea para siempre la promesa rechazada, y en los overlays `silent` el boundary devuelve `null` | Si falla la carga de CommandPalette, CoreMenu o CoachTour, Ctrl+K no funciona durante toda la sesión | Usar `lazyWithRetry`, añadir `Unable to preload` al regex y resetear el boundary con `key` |

### 9.4 Accesibilidad

| ID | Severidad | Archivo | Hallazgo | Escenario de falla | Corrección |
|---|---|---|---|---|---|
| FE-6 | Media | [TerminalContent.jsx:267](../src/windows/TerminalContent.jsx#L267) | Tab y Shift+Tab siempre hacen `preventDefault`, y Escape se ignora dentro del input | Un usuario de teclado queda atrapado en la terminal (incumple WCAG 2.1.2) | Interceptar Tab solo cuando hay autocompletado, y que Escape haga `blur()` |
| FE-7 | Media | FloatingWindow.jsx:52-97 | Una ventana minimizada solo queda con `opacity:0`: sus botones siguen siendo enfocables y visibles para lectores de pantalla | Con Tab el foco cae en botones invisibles, y el lector anuncia "Cerrar Skills" de una ventana oculta | Añadir `inert` al minimizar, `role="dialog"` + `aria-label` y devolver el foco al dock |
| FE-8 | Media | [CoreMenu.jsx:30](../src/overlays/CoreMenu.jsx#L30) vs Dock.jsx:14 | El overlay usa `z-[95]` y el dock `z-[100]`, así que el dock queda encima y clicable | Con CORE abierto, un clic en el dock abre la ventana detrás del overlay y parece que no pasó nada | Subir el overlay a z ≥ 110 o cerrarlo desde `onToggle` |
| FE-9 | Media | CoreMenu.jsx:28, CoachTour.jsx:58, CommandPalette.jsx:44 | Los diálogos no mueven el foco al abrir, no lo atrapan ni lo devuelven al cerrar. Escape en la paleta solo funciona con el foco en el input | Tab escapa a las ventanas de fondo, y Escape no cierra la paleta si el foco está en una opción | Manejar Escape en el contenedor, usar un focus trap y restaurar `activeElement` |

### 9.5 Prerender, contenido y detalles

| ID | Severidad | Archivo | Hallazgo | Escenario de falla | Corrección |
|---|---|---|---|---|---|
| FE-1 | **Alta** | [theme.js:21](../src/theme.js#L21) | El enlace `https://github.com/maxcaniullan` devuelve **404**. Lo verificó con `curl` el revisor del frontend; conviene confirmarlo | Reclutadores que hacen clic en GitHub (Hero, TopBar, paleta y shell prerenderizado) llegan a una página inexistente | Corregir el usuario o quitar el enlace |
| FE-10 | Baja | [prerender.jsx:27](../src/prerender.jsx#L27) | `isMac` se evalúa en build con el `navigator` de Node | Usuarios de Windows ven "⌘K" y luego salta a "Ctrl K" | Usar un valor neutro en el shell |
| FE-11 | Baja | prerender.jsx:61 | `?vista` se lee dentro del `try` de localStorage | Con el storage bloqueado, `?vista=rrhh` muestra el hero TI y después cambia | Leer `vista` fuera del `try` |
| FE-17 | Baja | SimulatorContent.jsx:39,48 | El primer frame de rAF puede dar `k < 0` | En la segunda ejecución las barras parpadean y el contador muestra "-0.0 min" | `Math.max(0, k)` |
| FE-18 | Baja | hr.jsx:36 | El `setTimeout` de "Copiado" no se limpia al desmontar | Inofensivo en React 18; deuda técnica | Guardarlo en un ref y limpiarlo en el cleanup |

---

## 10. Plan de corrección priorizado

| Prioridad | IDs | Esfuerzo | Motivo |
|---|---|---|---|
| 1 | FE-1 | 1 min | Impacto directo en el objetivo del portafolio |
| 2 | C-1, C-2 | ~30 min | Abuso del formulario: spam, disco y memoria |
| 3 | F-1, FE-3, FE-4 | ~1 h | Pantalla rota tras cada redeploy |
| 4 | FE-2 | ~20 min | Pérdida de datos del usuario (borrador de contacto) |
| 5 | C-5, D-2 | ~1 h | Mensajes que se pueden perder, y HSTS en producción |
| 6 | F-2, F-3, S-1, A-1, C-4, M-1 | ~1 h | Robustez del servidor y validación |
| 7 | D-1 | ~2 h | Evitar regresiones: suite `pytest` + CI |
| 8 | Accesibilidad (FE-6 a FE-9) y el resto Bajas | Variable | Calidad y WCAG |

## 11. Cómo reproducir las pruebas

```bash
# 1. Copiar el servidor fuera del repo (el script escribe contact_messages.jsonl)
mkdir -p /tmp/aud/srv /tmp/aud/srv_proxy /tmp/aud/srv_link
for d in srv srv_proxy; do cp main.py security-headers.json /tmp/aud/$d/ && cp -R dist /tmp/aud/$d/dist; done
cp main.py security-headers.json /tmp/aud/srv_link/ && ln -s "$PWD/dist" /tmp/aud/srv_link/dist
# 2. Levantar los tres servidores
PY="$PWD/.venv/bin/python"
(cd /tmp/aud/srv && PORT=8701 "$PY" main.py &)
(cd /tmp/aud/srv_proxy && PORT=8702 TRUST_PROXY=1 "$PY" main.py &)
(cd /tmp/aud/srv_link && PORT=8703 "$PY" main.py &)
# 3. Ejecutar (AUDIT_ROOT = carpeta que contiene srv/)
AUDIT_ROOT=/tmp/aud REPO=$PWD python3 auditoria/audit_tests.py
```

> El rate limit dura 10 minutos: reinicia los servidores entre ejecuciones para obtener resultados idénticos.

---

## Anexo (2026-11-02): hallazgos al probar el despliegue con Docker + Caddy

Estos tres hallazgos aparecieron al levantar el `deploy/Caddyfile` real, y ya están **corregidos** en `deploy/Caddyfile` y en el `Dockerfile`.

> **Corrección:** la versión anterior de este informe decía que Caddy bloqueaba `*.md`. Era incorrecto (ver D-5).

| ID | Severidad | Hallazgo | Evidencia | Estado |
|---|---|---|---|---|
| D-5 | Media | `respond @hidden 404` nunca se ejecutaba, porque en el orden de directivas de Caddy `respond` va después de `handle` y el `handle` catch-all respondía antes. Resultado: `/img/README.md` (76 KB), `/index.html.br` y todos los `.gz` eran **públicos**. | `GET /img/README.md` → 200 con el contenido de la guía | ✅ Corregido con `handle @hidden { respond 404 }` → 404 |
| D-6 | Media | Caddy **2.10.x** responde **206 Partial Content** (rango completo) a los archivos precomprimidos aunque la petición no tenga `Range`. Eso viola HTTP, y CDNs y proxies no cachean bien un 206. | Reproducido con un Caddyfile mínimo: 2.10.2 → 206, 2.11.7 → 200 | ✅ `CADDY_VERSION=2.11`. Si despliegas Caddy sin Docker, usa ≥ 2.11. |
| D-7 | Alta | Es F-1 agravado en Caddy: `/assets/<inexistente>.js` devolvía `index.html` **con `Cache-Control: public, max-age=31536000, immutable`**, así que navegador y CDN guardaban HTML como si fuera JS durante un año. Además, las rutas del SPA salían sin `Cache-Control`. | `GET /assets/no-existe.js` → 200 `text/html` + immutable | ✅ `handle @static` sin fallback → 404, y `no-cache` en las páginas |

**Rendimiento medido en Docker Desktop (Mac arm64)**, con `ab -k -c 50 -n 20000` y límites de 1 CPU y 256 MB por contenedor:
- `/` con br: 15 910 req/s (6,6 KB por respuesta).
- JS principal con br: 10 017 req/s (26,7 KB por respuesta).
- `/api/status`: 5 103 req/s.
- 0 fallos en todas las pruebas.

Memoria en reposo tras la carga: Caddy 29 MB, API 46 MB.
