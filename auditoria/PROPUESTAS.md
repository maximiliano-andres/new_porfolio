# Propuestas de mejora por hallazgo — con impacto medido

Complementa [AUDITORIA.md](AUDITORIA.md): cada ID (C-1, F-1, FE-2…) corresponde a un hallazgo de ese informe.

**Criterio:** ninguna propuesta cambia el flujo actual de un visitante que usa el sitio normalmente. Solo cambia el comportamiento en el caso defectuoso.

## Cómo se validaron

Las propuestas no se quedaron en teoría: se aplicaron sobre **copias** del proyecto (el repo no se tocó) y se midieron.

| Validación | Antes | Después |
|---|---|---|
| Suite HTTP real ([audit_tests.py](audit_tests.py)), 57 pruebas, incluidas 7 nuevas de **regresión del flujo normal** (R0-R6) | 22 fallas | **4 fallas**, todas explicadas abajo como residuales o intencionales |
| Regresión R0-R6: envío normal, email con `+` y subdominio, emoji con ZWJ, `?vista=rrhh`, `/index.html`, fuentes, `/api/status` sano | 7/7 | **7/7**, sin cambios para el usuario |
| `RateLimiter` con 30 000 IPs distintas | 30 000 claves, 3,78 s | **10 000 claves, 0,02 s** (unas 190 veces más rápido, memoria acotada) |
| `npm run lint` (`--max-warnings 0`) | OK | **OK** |
| `npm run build` completo (prerender verificado en 18 viewports, compresión, CSP de Caddy) | OK | **OK** |
| Tracebacks en el log durante la suite | Sí (`/%00`) | **0** |
| `git apply --check` de los parches | — | **Aplican limpio** |

**Parches listos para aplicar** (revisarlos antes):
- [parches/01-backend.diff](parches/01-backend.diff): `main.py`.
- [parches/02-frontend.diff](parches/02-frontend.diff): 14 archivos + `src/lib/reload.js` nuevo.

```bash
git apply auditoria/parches/01-backend.diff auditoria/parches/02-frontend.diff
npm run lint && npm run build
```

**Las 4 fallas que quedan tras aplicar los parches:**

| Prueba | Por qué sigue en rojo | ¿Acción? |
|---|---|---|
| S7 (preflight desde `localhost:5173`) | **Intencional:** es la corrección de M-1. En desarrollo (`APP_ENV=development`) sigue permitido. | No |
| C13 (caracteres de control → 422) | **Intencional:** se eliminan en lugar de rechazar el mensaje, para no bloquear al usuario. El log guarda `'A'` en vez de `'A\x00\x07'`. | No |
| C18 (XFF `10.x, 127.0.0.1`) | **Artefacto del test:** simula un atacante conectado desde 127.0.0.1, es decir, el propio proxy de confianza. El caso real, un proxy que añade la IP real (C18b), queda corregido. | No |
| F5 (`gzip;q=0`) | **Residual de Starlette:** su `GZipMiddleware` comprime si encuentra la subcadena "gzip". Nuestro código ya respeta `q=0`. Impacto real nulo. | Opcional |

**Leyenda de las tablas:**
- **Impacto en el flujo:** 🟢 ninguno visible · 🟡 cambio visible pero deseado · 🟠 requiere atención operativa.
- **Validado:** ✅ con pruebas reales o build · 📝 solo propuesta (requiere un dato o una decisión tuya).

---

## 1. Middleware transversal

| ID | Propuesta | Impacto en el flujo | Riesgo / qué vigilar | Esfuerzo | Val. |
|---|---|---|---|---|---|
| M-1 | Añadir `localhost:5173` a CORS solo `if IS_DEV` | 🟢 En desarrollo Vite usa proxy (`/api` → `:8000`), así que las peticiones son del mismo origen y CORS ni interviene. Los visitantes reales no notan nada. | Si algún día sirves el frontend desde otro dominio, agrégalo con `CORS_ORIGINS` | 1 línea | ✅ S8 |
| M-2 | Extraer `apply_security_headers()` y aplicarla también a las respuestas 411/413 | 🟢 Solo añade cabeceras | Ninguno | 10 min | ✅ C2 |
| M-3 | `server_header=False` en `uvicorn.run` | 🟢 | Ninguno | 1 línea | ✅ |

## 2. `GET /api/status`

| ID | Propuesta | Impacto en el flujo | Riesgo / qué vigilar | Esfuerzo | Val. |
|---|---|---|---|---|---|
| S-1 | `methods=["GET","HEAD"]` | 🟢 Un HEAD ahora responde JSON 200 en vez del HTML del SPA | Ninguno | 1 línea | ✅ S4 |
| S-2 | El catch-all devuelve **405 + `Allow`** para rutas conocidas con otro método | 🟢 El frontend nunca usa esos métodos | Si agregas un endpoint nuevo, súmalo a `API_METHODS` | 10 min | ✅ S5/A5 |
| S-3 | `Cache-Control: no-store` en todo `/api/*` | 🟢 Los POST nunca se cachean, y `/api/status` deja de poder quedar cacheado en un CDN | Ninguno | 2 líneas | ✅ S3 |
| S-4 | Responder **503 `{"status":"degraded"}`** si no se puede escribir el log de contactos o falta `dist/index.html`. La respuesta sana no cambia. | 🟠 El monitor **alertará** cuando el formulario esté roto, que es lo que se busca | Si despliegas con el directorio del proyecto en solo lectura, el estado quedará en 503: usa `CONTACT_LOG` en un volumen escribible (ver C-5) | 10 min | ✅ R6 |

## 3. `POST /api/contact`

| ID | Propuesta | Impacto en el flujo | Riesgo / qué vigilar | Esfuerzo | Val. |
|---|---|---|---|---|---|
| C-1 | `client_ip()` usa `request.client.host`. Uvicorn (`proxy_headers` + `forwarded_allow_ips`) ya lo resuelve desde el **último salto de confianza**. Se añade la variable `FORWARDED_ALLOW_IPS` (por defecto `127.0.0.1`). | 🟢 Los visitantes reales mantienen sus 5 envíos cada 10 min | 🟠 **Arrancar siempre con `python main.py`** (que ya pasa `proxy_headers`) o con `uvicorn --proxy-headers --forwarded-allow-ips=…`. Si se lanza `uvicorn main:app` sin esos flags detrás de un proxy, todos compartirían la IP del proxy y el límite sería colectivo. | 15 min | ✅ C18b |
| C-2 | El limitador pasa a un `OrderedDict` LRU que expulsa clientes inactivos por el extremo antiguo (O(1) amortizado), con tope duro `max_keys=10 000` | 🟢 Misma semántica por IP: `[0,0,0,0,0,600,600]`, idéntica a la actual | Bajo un ataque con más de 10 000 IPs **activas** a la vez, se olvidan los contadores más antiguos. Es aceptable: el límite global lo da la memoria acotada. | 20 min | ✅ U1 |
| C-3 | (a) Variable opcional `CLIENT_IP_HEADER=cf-connecting-ip`, desactivada por defecto. (b) En Caddy, `trusted_proxies cloudflare`. (c) Documentar que hay que usar **1 worker** o mover el límite a Redis. | 🟢 Sin la variable, nada cambia | 🟠 Activarla **solo** si el CDN garantiza esa cabecera. De lo contrario es falsificable, igual que C-1. | 10 min + config | ✅ (a) · 📝 (b, c) |
| C-4 | Regex `^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$` en el back y la **misma** en el front (FE-C1) | 🟢 Los emails válidos (`ana.perez+rrhh@mail.empresa.co.uk`) siguen aceptándose. Los malformados se rechazan antes de enviar, en el propio formulario. | No valida que el dominio exista; para eso haría falta `email-validator` con DNS, que no recomiendo porque añade latencia | 5 min | ✅ C8-C10, R1 |
| C-5 | (a) `CONTACT_LOG` configurable por variable de entorno, en un volumen persistente. (b) Notificación opcional por SMTP o webhook (`CONTACT_WEBHOOK_URL`) con `BackgroundTasks`, **después** de guardar el mensaje. (c) Rotación con logrotate. | 🟢 La respuesta al visitante es la misma y no añade latencia (se envía en segundo plano). Si falla el aviso, el mensaje ya quedó guardado. | 🟠 **Privacidad:** el webhook envía datos personales a un tercero. Prefiere SMTP a tu propio buzón, o enviar solo el aviso "nuevo mensaje" sin el contenido. | 45 min | 📝 |
| C-6 | Eliminar (no rechazar) los controles C0/C1 y los overrides bidi (`U+202A-202E`, `U+2066-2069`). **Se conservan** `\n`, `\t` y el ZWJ (`U+200D`). | 🟢 El mensaje llega igual. Los emoji compuestos (👨‍👩‍👧) quedan intactos. | Un nombre formado *solo* por esos caracteres queda vacío y responde 422 "Revisa este campo". Es correcto. | 5 min | ✅ C13, R1 |

**Snippet de C-5** (no incluido en el parche, porque requiere elegir el canal):

```python
from fastapi import BackgroundTasks
CONTACT_LOG = Path(os.getenv("CONTACT_LOG", BASE_DIR / "contact_messages.jsonl"))
WEBHOOK = os.getenv("CONTACT_WEBHOOK_URL")

def notify_owner():  # sin datos personales: solo el aviso
    if not WEBHOOK:
        return
    try:
        req = urllib.request.Request(WEBHOOK, data=b'{"text":"Nuevo mensaje en el portafolio"}',
                                     headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        log.warning("Contact notification failed")  # el mensaje ya está guardado

# en submit_contact(payload, request, background: BackgroundTasks), tras escribir:
background.add_task(notify_owner)
```

## 4. `/api/{rest}`, catch-all

| ID | Propuesta | Impacto en el flujo | Riesgo / qué vigilar | Esfuerzo | Val. |
|---|---|---|---|---|---|
| A-1 | Registrar también `"/api"` y añadir `HEAD` y `OPTIONS` al catch-all | 🟢 Ninguna ruta de la API vuelve a responder con el HTML del SPA. Los preflight CORS reales los sigue atendiendo `CORSMiddleware` **antes** del router. | `OPTIONS /api/nope` pasa de 405 a 404, lo cual sigue siendo válido | 5 min | ✅ A2-A4 |
| A-2 | La misma corrección que S-2 | 🟢 | — | — | ✅ A5 |

## 5. `/{path}`: SPA y archivos estáticos

| ID | Propuesta | Impacto en el flujo | Riesgo / qué vigilar | Esfuerzo | Val. |
|---|---|---|---|---|---|
| F-1 | **Servidor:** si la ruta empieza por `assets/`, `img/` o `fonts/`, o tiene una extensión estática, y el archivo no existe → **404**. **SW:** no cachear respuestas `text/html` como asset, y `VERSION = "v2"` para purgar lo que la v1 haya envenenado. **Caddy:** ver el snippet de abajo. | 🟡 Una pestaña con un deploy antiguo deja de quedar rota en silencio: recibe 404 y, con FE-3/FE-4, **recarga una vez** con la versión nueva | Con el cambio a `v2`, cada visitante vuelve a descargar los estáticos **una sola vez** (unos 136 KB br). `/favicon.ico` pasa de "HTML 200" (inútil) a 404. | 20 min | ✅ F6, F7, build |
| F-2 | Si hay `\x00` en la ruta → 404, y `try/except (OSError, ValueError)` alrededor de `resolve()` | 🟢 | Ninguno | 5 min | ✅ F10, 0 tracebacks |
| F-3 | Resolver la raíz en **cada request** (`FRONTEND_DIR.resolve()`) | 🟢 Permite despliegues atómicos con symlink (`dist -> releases/N`) sin reiniciar | Una llamada `realpath` más por request: despreciable | 2 líneas | ✅ F17 |
| F-4 | Parsear `Accept-Encoding` respetando `q=0` | 🟢 | Queda el residual de Starlette (ver arriba) | 15 min | ✅ parcial |
| F-5 | ETag propio por variante (br, gzip o identity) y **304** con `If-None-Match` | 🟢 Las visitas repetidas revalidan `index.html` con 0 bytes en vez de 6,6 KB | El formato del ETag cambia: tras el deploy, cada cliente revalida una vez | 20 min | ✅ F15 |
| F-6 | Una URL desconocida **sigue mostrando la app**, pero con estado **404** | 🟢 El visitante ve exactamente lo mismo, y `?vista=rrhh` sigue en 200 (R2) | Si en el futuro añades rutas por path (`/proyectos/x`), inclúyelas en una lista permitida. El SW no cachea el 404 (`response.ok` es falso) pero lo muestra. | 5 min | ✅ F14, R2-R4 |

**Snippet de Caddy para F-1 y F-6** (reemplaza el bloque `handle` final; 📝 probarlo en staging):

```caddy
# assets inexistentes → 404 real (nunca el index.html)
@static path /assets/* /fonts/* /img/*
handle @static {
	file_server {
		precompressed br gzip
	}
}
handle {
	try_files {path} /index.html
	file_server {
		precompressed br gzip
	}
}
```

## 6. Despliegue y calidad

| ID | Propuesta | Impacto en el flujo | Riesgo / qué vigilar | Esfuerzo | Val. |
|---|---|---|---|---|---|
| D-1 | Convertir `audit_tests.py` en una suite `pytest` con `fastapi.testclient` (requiere `httpx` como dependencia de desarrollo) + GitHub Actions: `pytest`, `npm run lint` y `npm run build` | 🟢 Solo afecta a CI | Las pruebas de rate limit necesitan un limitador nuevo por test (fixture) | 2 h | 📝 |
| D-2 | Añadir `"hsts": "max-age=300"` a `security-headers.json`, que lo usen tanto `deploy-headers.mjs` como `main.py`, y **subirlo a `31536000` tras una semana** sin incidentes | 🟢 Mientras HTTPS funcione | 🟠 HSTS es "pegajoso": si se rompe el certificado, los navegadores no dejan entrar durante `max-age`. Por eso se empieza en 5 minutos. No usar `includeSubDomains` ni `preload` hasta estar seguro. | 15 min | 📝 |
| D-3 | `pip-compile --generate-hashes` (o `uv lock`) → `requirements.lock` | 🟢 | El deploy debe instalar desde el lock | 15 min | 📝 |
| D-4 | Borrar de `public/img/` los archivos `logo_max_andres.png`, `logo_max_andres.webp`, `max_andres_head.png` y `max_andres_head.webp` (unos 4 MB; ninguno se carga: `tech.jsx:31` solo muestra el nombre como texto), y sacar `README.md` de `public/` | 🟢 El `dist/` queda unos 4 MB más liviano | Revisa que no los uses fuera del sitio, por ejemplo enlazados desde LinkedIn | 2 min | 📝 |

---

## 7. Frontend

### 7.1 Ventanas y shell

| ID | Propuesta | Impacto en el flujo | Riesgo / qué vigilar | Esfuerzo | Val. |
|---|---|---|---|---|---|
| FE-2 | No desmontar el contenido al minimizar: se mantiene montado con `hidden={isMinimized}` (Tailwind 4 aplica `display:none !important`, verificado en el CSS compilado) | 🟡 Al restaurar, la terminal conserva su historial y el formulario su borrador. Un envío en curso **termina** en vez de abortarse. Es lo que ya prometía el comentario de `PolyglotPortfolio.jsx:380`. | Las ventanas minimizadas siguen en memoria (son 11 como máximo, impacto mínimo). El simulador termina su animación (≤ 3,2 s) aunque esté minimizado. Al cambiar de perfil TI/RRHH se sigue remontando, igual que hoy. | 5 min | ✅ build |
| FE-5 | `finishBoot = useCallback(() => setBooted(true), [])` | 🟢 El boot ya no se reinicia al rotar o redimensionar | Ninguno | 2 líneas | ✅ lint |
| FE-12 | `toggleWindow` considera el `z` del detalle de proyecto (a través de `projectWinRef`) | 🟢 El clic en el dock trae la ventana al frente en vez de minimizarla | Ninguno | 5 min | ✅ lint |
| FE-13 | Ocultar el Hero también si `projectWin` está abierto | 🟢 | Ninguno | 1 línea | ✅ |
| FE-14 | El timeout del coach comprueba `autoTourRef.current` antes de abrirse | 🟢 El coach no se superpone al recorrido de 60 s. Quedará pendiente (`tour_seen` no se marca) y aparecerá en la próxima visita. | Ninguno | 3 líneas | ✅ |
| FE-15 | Actualizar `windowSize` solo si cambió, y `bringFront` no hace nada si la ventana ya está al frente | 🟢 Menos re-renders en pinch-zoom y en cada clic | En dev (StrictMode) el updater puede incrementar `z` dos veces. Es inocuo, porque `zRef` y el estado quedan coherentes. | 10 min | ✅ |
| FE-16 | `readSet(key, validIds)` filtra contra `ACHIEVEMENTS` y `DOCK_ITEMS`, y "explorer" pasa a `>=` | 🟢 El progreso nunca supera el 100 % | Los ids obsoletos se descartan sin aviso, lo cual es correcto | 10 min | ✅ |

### 7.2 Carga diferida y redeploys

| ID | Propuesta | Impacto en el flujo | Riesgo / qué vigilar | Esfuerzo | Val. |
|---|---|---|---|---|---|
| FE-3 | Nuevo `src/lib/reload.js` con `reloadOnce()`: como máximo **una** recarga cada 30 s, **nunca sin conexión**. Se usa en `loadMotionFeatures`, en los `lazy()` y en `vite:preloadError`. | 🟡 Una pestaña abierta durante un deploy recarga sola una vez y queda funcionando, en lugar de mostrar ventanas invisibles | La recarga pierde las ventanas abiertas, pero solo ocurre cuando la app ya está rota. Sin conexión no recarga y se muestra el mensaje de error actual. | 20 min | ✅ build |
| FE-4 | Los mismos `lazy()` con `.catch(reloadOnce)`. En `SectionBoundary`, los overlays `silent` llaman a `reloadOnce()` ante un error de chunk, y se añade `Unable to preload` al regex. | 🟢/🟡 Ctrl+K deja de quedar muerto toda la sesión | Igual que FE-3 | 10 min | ✅ |

### 7.3 Accesibilidad

| ID | Propuesta | Impacto en el flujo | Riesgo / qué vigilar | Esfuerzo | Val. |
|---|---|---|---|---|---|
| FE-6 | Terminal: Tab solo autocompleta con texto y sin Shift. **Escape hace `blur()`**, y un segundo Escape cierra la ventana (atajo global ya existente). | 🟡 El autocompletado funciona igual. Con el input vacío, Tab ahora mueve el foco (antes no hacía nada). | Ninguno | 5 min | ✅ |
| FE-7 | `inert` + `aria-hidden` en las ventanas minimizadas. **Pendiente** 📝: `role="dialog"` + `aria-label={title}`, y al cerrar devolver el foco a `[data-dock-id="${id}"]`, que ya existe en el Dock. | 🟢 Tab y los lectores de pantalla ya no llegan a botones invisibles | React 18 no conoce `inert` como booleano: se pasa como `inert=""`, que sí funciona. Al migrar a React 19 hay que cambiarlo a `inert={true}`. | 5 min + 15 | ✅ / 📝 |
| FE-8 | El dock usa `toggleFromDock`: cierra CORE y luego abre la ventana | 🟡 Antes el clic no parecía hacer nada; ahora abre la ventana. El aspecto de CORE no cambia. | Ninguno | 3 líneas | ✅ |
| FE-9 | Paleta: Escape en todo el diálogo, no solo en el input, y **devolver el foco** al elemento previo al cerrar. CoreMenu: `aria-modal="true"`. **Pendiente** 📝: focus trap (snippet abajo). | 🟢 | Ninguno | 10 min | ✅ / 📝 |

**Snippet de focus trap para FE-9** (reutilizable en CoreMenu, CoachTour y CommandPalette):

```js
export function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const els = ref.current.querySelectorAll('button,[href],input,textarea,[tabindex]:not([tabindex="-1"])');
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ref, active]);
}
```

### 7.4 Prerender, contenido y detalles

| ID | Propuesta | Impacto en el flujo | Riesgo / qué vigilar | Esfuerzo | Val. |
|---|---|---|---|---|---|
| FE-1 | Corregir `SOCIAL_LINKS.github` en `theme.js:21` con tu usuario real, o quitar el botón si no tienes un perfil público | 🟡 | 📝 **Necesito tu usuario de GitHub** | 1 min | 📝 |
| FE-10 | `<kbd>` de la TopBar solo en el cliente (`!import.meta.env.SSR`) | 🟢 El shell ya no muestra "⌘K" a usuarios de Windows; el atajo aparece al montar React | Nota: `Hero.jsx:104` muestra "Ctrl K" fijo para todos. No es un bug, porque en Mac Ctrl+K también funciona (el handler acepta `ctrlKey \|\| metaKey`). | 2 líneas | ✅ (verificado en `dist/index.html`) |
| FE-11 | En el script inline, leer `?vista` fuera del `try` de localStorage, y en el `catch` usar `q` y marcar `data-boot` | 🟢 `?vista=rrhh` funciona aunque el storage esté bloqueado | 🟠 **Cambia el hash CSP** del script inline. El build regenera `deploy/security-headers.caddy` y `main.py` lo recalcula solo, así que **hay que desplegar `dist/` y el `.caddy` juntos**, como ya indica el flujo documentado. | 5 min | ✅ prerender (18 viewports), F2, F3 |
| FE-17 | `Math.max(0, …)` en el progreso del simulador | 🟢 | Ninguno | 1 línea | ✅ |
| FE-18 | Guardar el timer de "Copiado" en un ref y limpiarlo al desmontar | 🟢 | Ninguno | 4 líneas | ✅ |
| FE-C1 | La misma regex de email que el back (C-4) | 🟢 | Ninguno | 1 línea | ✅ |
| FE-C2 | **Sin cambio recomendado.** El formulario ya muestra "Revisa los datos del formulario" cuando `fields` no es un campo conocido. | — | — | — | — |

---

## 8. Impacto global

**En usuarios:** el recorrido normal no cambia (R0-R6 en verde). Cambian a mejor 5 situaciones que hoy fallan:
- Minimizar y restaurar una ventana (FE-2).
- Una pestaña abierta durante un deploy (F-1, FE-3, FE-4).
- Hacer clic en el dock con CORE abierto (FE-8).
- Navegar con teclado en la terminal (FE-6).
- El enlace de GitHub (FE-1).

**En seguridad y operación:**
- El rate limit deja de poder evadirse (C-1).
- La memoria del limitador queda acotada (C-2).
- Desaparecen los tracebacks provocables desde fuera (F-2).
- Ninguna ruta de la API devuelve HTML.
- El monitor detecta un formulario roto (S-4).

**En rendimiento:**
- Limitador: unas 190 veces más rápido bajo carga.
- Revalidaciones de `index.html` con 304 (0 bytes).
- Menos re-renders (FE-15).
- Unos 4 MB menos en `dist/` (D-4).
- Coste único: los visitantes vuelven a descargar unos 136 KB por el SW v2.

**Puntos que requieren atención operativa** (🟠):
1. **C-1:** arrancar con `python main.py` o con `--proxy-headers`.
2. **S-4 / C-5:** el log de contactos debe estar en un directorio escribible y persistente.
3. **FE-11:** desplegar `dist/` y `deploy/security-headers.caddy` juntos.
4. **D-2:** HSTS gradual.
5. **C-3:** `CLIENT_IP_HEADER` solo detrás de un CDN que garantice esa cabecera.

## 9. Orden de aplicación recomendado

1. **FE-1** (en cuanto me pases tu usuario de GitHub).
2. **Parche backend** (`01-backend.diff`) → reiniciar el servidor → `python3 auditoria/audit_tests.py` contra el nuevo servidor (ver el §11 de AUDITORIA.md).
3. **Parche frontend** (`02-frontend.diff`) → `npm run lint && npm run build` → desplegar `dist/` + `deploy/security-headers.caddy`.
4. **Configuración:** Caddy (snippet de F-1), D-2 (HSTS gradual), C-5 (notificación), D-4 (imágenes).
5. **D-1:** fijar todo esto con CI para que no haya regresiones.

---

## 10. Estado de aplicación (2026-11-02)

Los parches de `parches/` **ya están aplicados**: `git apply` sobre el código actual fallará, y se conservan solo como referencia de lo que cambió.

### Aplicado

| Bloque | IDs |
|---|---|
| Backend | M-1, M-2, M-3, S-1, S-2, S-3, S-4, C-1, C-2, C-3(a), C-4, C-5(a) `CONTACT_LOG`, C-6, A-1, A-2, F-1 … F-6 |
| Frontend | FE-2 … FE-18, FE-C1, más las partes que estaban pendientes de FE-7 (`role="dialog"`, foco de vuelta al dock) y FE-9 (focus trap en paleta, CORE y tour) |
| Caddy | D-5, D-6 (Caddy 2.11), D-7, F-1 y F-6 (404 real con la app visible), A-1 (`/api` sin barra) |
| Calidad | D-1: `tests/test_api.py` (50 pruebas) + `.github/workflows/ci.yml` (backend y frontend en **Ubuntu, macOS y Windows**, más build y smoke test de Docker) |

### Ajustes hechos al aplicar, para no romper flujos

1. **S-4 + Docker:** el health check exigía escribir junto a `main.py`, pero en el contenedor `/app` es de solo lectura, así que la API habría quedado en 503 y Caddy nunca habría arrancado. **Solución:** se implementó C-5(a) (`CONTACT_LOG=/data/…`) y se quitó el symlink del Dockerfile.
2. **S-4 en desarrollo:** con `npm run dev` no existe `dist/`, así que `/api/status` ya no exige el build cuando `APP_ENV=development`.
3. **FE-9 incompleto:** tras un clic en un área vacía de la paleta, Escape no la cerraba (pasaba lo mismo en el código original), y Ctrl+K la cerraba en vez de abrirla. **Solución:** Escape global mientras está abierta y `tabIndex=-1` en el panel. Lo detectó la prueba E2E D3.
4. **Windows:** `mimetypes` lee el registro de Windows, donde `.js` suele figurar como `text/plain`. Con `nosniff`, eso dejaría la página en blanco. **Solución:** tipos MIME fijados explícitamente, `newline="\n"` en el JSONL y `.gitattributes` que fuerza LF.

### Pendiente (requiere una decisión tuya)

| ID | Qué falta decidir |
|---|---|
| FE-1 | Tu usuario real de GitHub |
| C-5(b) | El canal de aviso de mensajes nuevos |
| D-2 | HSTS gradual, cuando el dominio tenga HTTPS |
| D-3 | El lock de dependencias Python: hace falta generarlo con `uv` o `pip-tools` por plataforma, porque `uvloop` no existe en Windows |
| D-4 | Borrar las imágenes sin uso |

### Verificación final

| Prueba | Resultado |
|---|---|
| `pytest` (50 pruebas) | ✅ 50/50 |
| `npm run lint` | ✅ |
| `npm run build` (prerender verificado en 18 viewports) | ✅ |
| Suite HTTP real (`audit_tests.py`, 57 pruebas) | ✅ 53/57: las 4 restantes son las intencionales o residuales de la §1 |
| **E2E en Chromium** ([e2e.mjs](e2e.mjs), 34 escenarios de flujo y lógica) contra `python main.py` | ✅ 34/34, 0 errores de consola |
| E2E contra el stack **Docker** (Caddy + API) | ✅ 34/34 |
| Build Docker `linux/arm64` (Mac) y `linux/amd64` (Windows y servidores) | ✅ |
| Rutas en Caddy iguales a FastAPI (200 / 404 / `no-store` / caché) | ✅ 15/15 |
