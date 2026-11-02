"""Live HTTP audit tests against isolated copies of main.py. Raw sockets so headers are fully controlled."""
import gzip, json, os, socket, sys, re, base64, hashlib

SRV = os.path.join(os.environ.get("AUDIT_ROOT", os.path.dirname(__file__)), "srv")
R = []


def raw(port, data: bytes, timeout=5):
    s = socket.create_connection(("127.0.0.1", port), timeout=timeout)
    s.sendall(data)
    chunks = []
    try:
        while True:
            c = s.recv(65536)
            if not c:
                break
            chunks.append(c)
    except socket.timeout:
        pass
    s.close()
    resp = b"".join(chunks)
    head, _, body = resp.partition(b"\r\n\r\n")
    lines = head.decode("latin-1").split("\r\n")
    status = int(lines[0].split()[1]) if lines and len(lines[0].split()) > 1 else 0
    hdrs = {}
    for l in lines[1:]:
        k, _, v = l.partition(":")
        hdrs[k.strip().lower()] = v.strip()
    return status, hdrs, body


def req(port, method, path, body=None, headers=None, cl=True):
    headers = dict(headers or {})
    b = body if isinstance(body, bytes) else (json.dumps(body).encode() if body is not None else b"")
    h = f"{method} {path} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n"
    if cl and (body is not None or method == "POST") and "Content-Length" not in headers:
        headers["Content-Length"] = str(len(b))
    if body is not None and "Content-Type" not in headers:
        headers["Content-Type"] = "application/json"
    for k, v in headers.items():
        h += f"{k}: {v}\r\n"
    return raw(port, h.encode("latin-1") + b"\r\n" + b)


def check(tid, endpoint, desc, ok, detail):
    R.append((tid, endpoint, desc, "PASA" if ok else "FALLA", detail))


VALID = {"name": "Auditor", "email": "audit@example.com", "message": "Prueba de auditoría"}
_B = int(os.environ.get("PORT_BASE", "8701"))
P, PX, PL = _B, _B + 1, _B + 2

# ---------------- GET /api/status ----------------
st, h, b = req(P, "GET", "/api/status")
check("S1", "GET /api/status", "Responde 200 {status: ok}", st == 200 and json.loads(b) == {"status": "ok"}, f"{st} {b[:40]!r}")
check("S2", "GET /api/status", "Incluye cabeceras de seguridad (CSP, nosniff, XFO)",
      all(k in h for k in ("content-security-policy", "x-content-type-options", "x-frame-options")), ",".join(k for k in h if k.startswith(("content-sec", "x-"))))
check("S3", "GET /api/status", "Respuesta API con Cache-Control explícito", "cache-control" in h, h.get("cache-control", "<ausente>"))
st, h, b = req(P, "HEAD", "/api/status")
check("S4", "HEAD /api/status", "HEAD de un endpoint API no devuelve el HTML del SPA",
      "text/html" not in h.get("content-type", ""), f"{st} content-type={h.get('content-type')}")
st, h, b = req(P, "POST", "/api/status", body=b"", headers={"Content-Type": "application/json"})
check("S5", "POST /api/status", "Método no permitido → 405 (no 404)", st == 405, f"{st} {b[:60]!r}")
st, h, b = req(P, "OPTIONS", "/api/status", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"})
check("S6", "OPTIONS /api/status", "Preflight de origen no permitido se rechaza", st == 400 and "access-control-allow-origin" not in h, f"{st} ACAO={h.get('access-control-allow-origin')}")
st, h, b = req(P, "OPTIONS", "/api/status", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"})
check("S7", "OPTIONS /api/status", "Preflight del origen dev permitido", st == 200 and h.get("access-control-allow-origin") == "http://localhost:5173", f"{st} ACAO={h.get('access-control-allow-origin')}")
st, h, b = req(P, "GET", "/api/status", headers={"Origin": "http://localhost:5173"})
check("S8", "GET /api/status", "En producción los orígenes localhost:5173 NO deberían estar en CORS",
      "access-control-allow-origin" not in h, f"ACAO={h.get('access-control-allow-origin')} (APP_ENV=production)")

# ---------------- POST /api/contact : body guard ----------------
_b = json.dumps(VALID).encode()
st, h, b = req(P, "POST", "/api/contact", body=hex(len(_b))[2:].encode() + b"\r\n" + _b + b"\r\n0\r\n\r\n", headers={"Transfer-Encoding": "chunked"}, cl=False)
check("C1", "POST /api/contact", "Sin Content-Length (chunked) → 411", st == 411, f"{st} {b[:60]!r}")
_c2 = h
check("C2", "POST /api/contact", "Respuestas 411/413 conservan cabeceras de seguridad",
      "x-content-type-options" in h and "content-security-policy" in h, f"nosniff={'x-content-type-options' in h} csp={'content-security-policy' in h}")
st, h, b = req(P, "POST", "/api/contact", body=b"x" * 10, headers={"Content-Length": "99999"})
check("C3", "POST /api/contact", "Content-Length > 16 KB → 413", st == 413, f"{st}")
st, h, b = req(P, "POST", "/api/contact", body=b"{}", headers={"Content-Length": "-1"})
check("C4", "POST /api/contact", "Content-Length negativo → 4xx", 400 <= st < 500, f"{st}")
st, h, b = req(P, "POST", "/api/contact", body=b"{not json", headers={})
check("C5", "POST /api/contact", "JSON malformado → 422 sin filtrar internals", st == 422, f"{st} {b[:80]!r}")
st, h, b = req(P, "POST", "/api/contact", body=b"[]")
check("C6", "POST /api/contact", "Body no-objeto → 422", st == 422, f"{st} {b[:80]!r}")

# ---------------- validation ----------------
cases = [
    ("C7", {"name": "   ", "email": "a@b.cl", "message": "x"}, 422, "nombre solo espacios → 422"),
    ("C8", {"name": "A", "email": "a@.", "message": "x"}, 422, "email 'a@.' → 422"),
    ("C9", {"name": "A", "email": "a@b.", "message": "x"}, 422, "email 'a@b.' → 422"),
    ("C10", {"name": "A", "email": "a@@b.cl", "message": "x"}, 422, "email 'a@@b.cl' → 422"),
    ("C11", {"name": "A", "email": "a@b.cl", "message": "x" * 5001}, 422, "mensaje 5001 chars → 422"),
    ("C12", {"name": 123, "email": "a@b.cl", "message": "x"}, 422, "nombre numérico → 422"),
    ("C13", {"name": "A\x00\x07", "email": "a@b.cl", "message": "x‮"}, 422, "caracteres de control/bidi en nombre/mensaje → 422"),
]
for tid, body, exp, desc in cases:
    st, h, b = req(P, "POST", "/api/contact", body=body)
    check(tid, "POST /api/contact", desc, st == exp, f"{st} {b[:70]!r}")
# NOTE: C8/C9/C13 pass validation → they consumed rate-limit quota and were stored. Count them.

# ---------------- content-type (CSRF-style simple request) ----------------
st, h, b = req(P, "POST", "/api/contact", body=json.dumps(VALID).encode(), headers={"Content-Type": "text/plain"})
check("C14", "POST /api/contact", "Content-Type text/plain (request 'simple' cross-site, sin preflight) se rechaza", st in (415, 422), f"{st} {b[:60]!r}")

# ---------------- rate limit ----------------
codes = []
for i in range(8):
    st, h, b = req(P, "POST", "/api/contact", body=VALID)
    codes.append((st, h.get("retry-after")))
check("C15", "POST /api/contact", "Límite 5 envíos/10 min por IP → 429 + Retry-After", any(c == 429 and ra for c, ra in codes), str(codes))
log_path = os.path.join(SRV, "contact_messages.jsonl")
mode = oct(os.stat(log_path).st_mode & 0o777) if os.path.exists(log_path) else "n/a"
lines = open(log_path, encoding="utf-8").read().splitlines() if os.path.exists(log_path) else []
check("C16", "POST /api/contact", "Archivo de mensajes creado con permisos 0600", mode == "0o600", f"mode={mode}, {len(lines)} líneas guardadas")
stored = [json.loads(l) for l in lines]
check("C17", "POST /api/contact", "Emails inválidos ('a@.', 'a@b.') no llegan a almacenarse",
      not any(e["email"] in ("a@.", "a@b.") for e in stored), "almacenados: " + ", ".join(e["email"] for e in stored))

# spoofed X-Forwarded-For with TRUST_PROXY=1
spoof = []
for i in range(12):
    st, h, b = req(PX, "POST", "/api/contact", body=VALID, headers={"X-Forwarded-For": f"10.0.{i}.1, 127.0.0.1"})
    spoof.append(st)
check("C18", "POST /api/contact (TRUST_PROXY=1)", "X-Forwarded-For falsificado NO evade el rate limit", 429 in spoof, f"12 envíos con XFF rotado → {spoof}")
# simulate a proxy that appends the real IP (nginx $proxy_add_x_forwarded_for): same real client, rotating spoofed first hop
spoof2 = []
for i in range(8):
    st, h, b = req(PX, "POST", "/api/contact", body=VALID, headers={"X-Forwarded-For": "203.0.113.7"})
    spoof2.append(st)
check("C19", "POST /api/contact (TRUST_PROXY=1)", "Clientes detrás de la misma IP de CDN/proxy comparten cupo", True, f"8 envíos misma XFF → {spoof2} (informativo)")

# ---------------- /api/{rest} catch-all ----------------
st, h, b = req(P, "GET", "/api/nope")
check("A1", "/api/{rest}", "Ruta API inexistente → 404 JSON", st == 404 and b.startswith(b"{"), f"{st} {b[:60]!r}")
st, h, b = req(P, "GET", "/api")
check("A2", "/api (sin slash)", "→ 404 JSON (no HTML del SPA)", st == 404, f"{st} content-type={h.get('content-type')}")
st, h, b = req(P, "HEAD", "/api/nope")
check("A3", "HEAD /api/nope", "→ 404 (no 200 HTML)", st == 404, f"{st} content-type={h.get('content-type')}")
st, h, b = req(P, "OPTIONS", "/api/nope")
check("A4", "OPTIONS /api/nope", "→ 404/405 JSON", st in (404, 405), f"{st} {b[:60]!r}")
st, h, b = req(P, "DELETE", "/api/contact")
check("A5", "DELETE /api/contact", "→ 405 Method Not Allowed", st == 405, f"{st} {b[:60]!r}")

# ---------------- /{path} SPA + static ----------------
st, h, b = req(P, "GET", "/", headers={"Accept-Encoding": "br, gzip"})
check("F1", "GET /", "200 HTML precomprimido br + no-cache", st == 200 and h.get("content-encoding") == "br" and h.get("cache-control") == "no-cache", f"{st} enc={h.get('content-encoding')} cc={h.get('cache-control')}")
st, h, html = req(P, "GET", "/")
csp = h.get("content-security-policy", "")
inline = re.findall(rb"<script>(.*?)</script>", html, re.S)
hashes = ["'sha256-" + base64.b64encode(hashlib.sha256(s).digest()).decode() + "'" for s in inline]
check("F2", "GET /", "CSP contiene el hash del script inline real", all(x in csp for x in hashes) and hashes, f"{len(hashes)} script(s) inline, hash presente={all(x in csp for x in hashes)}")
caddy = open(os.path.join(os.environ.get("REPO", "."), "deploy/security-headers.caddy")).read()
check("F3", "deploy Caddy", "Hash CSP en security-headers.caddy coincide con dist/index.html", all(x in caddy for x in hashes), hashes[0] if hashes else "")
asset = sorted(f for f in os.listdir(os.path.join(SRV, "dist/assets")) if f.endswith(".js"))[0]
st, h, b = req(P, "GET", f"/assets/{asset}", headers={"Accept-Encoding": "gzip"})
dbl = False
try:
    once = gzip.decompress(b)
    dbl = once[:2] == b"\x1f\x8b"
except Exception as e:
    once = b""
check("F4", "GET /assets/*.js", "gzip precomprimido, cache immutable, sin doble compresión", st == 200 and h.get("content-encoding") == "gzip" and "immutable" in h.get("cache-control", "") and not dbl, f"{st} enc={h.get('content-encoding')} cc={h.get('cache-control')} doble={dbl}")
st, h, b = req(P, "GET", f"/assets/{asset}", headers={"Accept-Encoding": "gzip;q=0, br;q=0, identity"})
check("F5", "GET /assets/*.js", "Respeta Accept-Encoding q=0 (no envía br/gzip rechazados)", h.get("content-encoding") in (None, ""), f"enc={h.get('content-encoding')}")
st, h, b = req(P, "GET", "/assets/old-deploy-AbC123.js")
check("F6", "GET /assets/<inexistente>.js", "Asset inexistente → 404 (no index.html 200)", st == 404, f"{st} content-type={h.get('content-type')}")
st, h, b = req(P, "GET", "/img/no-existe.webp")
check("F7", "GET /img/<inexistente>", "Imagen inexistente → 404", st == 404, f"{st} content-type={h.get('content-type')}")
st, h, b = req(P, "GET", "/%2e%2e/main.py")
check("F8", "GET /../main.py", "Path traversal bloqueado", b"FastAPI" not in b, f"{st} content-type={h.get('content-type')}")
st, h, b = req(P, "GET", "/..%2fsecurity-headers.json")
check("F9", "GET /..%2f…json", "Traversal con %2f bloqueado", b'"csp"' not in b, f"{st}")
st, h, b = req(P, "GET", "/%00")
check("F10", "GET /%00", "Byte nulo en path no causa 500", st != 500, f"{st} {b[:60]!r}")
st, h, b = req(P, "GET", "/" + "a" * 4000 + ".js")
check("F11", "GET /aaaa…(4000).js", "Nombre de archivo muy largo no causa 500", st != 500, f"{st}")
st, h, b = req(P, "GET", "/index.html.br")
check("F12", "GET /index.html.br", "Archivos .br no se sirven directamente", h.get("content-type", "").startswith("text/html") and b[:15].lower().startswith(b"<!doctype"), f"{st} ct={h.get('content-type')}")
st, h, b = req(P, "GET", "/sw.js")
check("F13", "GET /sw.js", "Service worker con Cache-Control no-cache", h.get("cache-control") == "no-cache", f"{h.get('cache-control')}")
st, h, b = req(P, "GET", "/ruta/inexistente")
check("F14", "GET /ruta/inexistente", "Rutas desconocidas → 404 (SEO: soft-404)", st == 404, f"{st} (sirve index.html)")
st, h, b = req(P, "GET", f"/assets/{asset}")
etag = h.get("etag")
st2, h2, b2 = req(P, "GET", f"/assets/{asset}", headers={"If-None-Match": etag or "x"})
check("F15", "GET /assets (condicional)", "If-None-Match → 304", st2 == 304, f"etag={etag} → {st2}")
st, h, b = req(P, "GET", "/robots.txt")
check("F16", "GET /robots.txt", "robots.txt 200 text/plain", st == 200 and "text/plain" in h.get("content-type", ""), f"{st} {b[:40]!r}")
st, h, b = req(PL, "GET", f"/assets/{asset}")
check("F17", "GET /assets (dist como symlink)", "Con dist/ como symlink los assets se sirven como JS", "javascript" in h.get("content-type", ""), f"{st} ct={h.get('content-type')}")

# ---------------- regresión: el flujo actual debe seguir funcionando ----------------
st, h, b = req(PX, "POST", "/api/contact", body=VALID, headers={"X-Forwarded-For": "198.51.100.77"})
check("R0", "POST /api/contact", "(reinicio de cupo) envío normal vía proxy", st in (200, 429), f"{st}")
real = []
for i in range(8):
    st, h, b = req(PX, "POST", "/api/contact", body=VALID, headers={"X-Forwarded-For": f"10.9.{i}.1, 203.0.113.9"})
    real.append(st)
check("C18b", "POST /api/contact (TRUST_PROXY=1)", "Proxy que AÑADE la IP real (nginx): XFF falso al inicio no evade el límite", 429 in real, str(real))
st, h, b = req(PX, "POST", "/api/contact", body={"name": "Ana 👨‍👩‍👧", "email": "ana.perez+rrhh@mail.empresa.co.uk", "message": "Hola,\n\tsaludos 👍🏽"}, headers={"X-Forwarded-For": "192.0.2.50"})
lines2 = open(os.path.join(os.path.dirname(SRV), "srv_proxy", "contact_messages.jsonl"), encoding="utf-8").read().splitlines()
last = json.loads(lines2[-1]) if lines2 else {}
check("R1", "POST /api/contact", "Email válido con subdominio y '+' aceptado; emoji ZWJ, \\n y \\t intactos",
      st == 200 and last.get("name") == "Ana 👨‍👩‍👧" and last.get("message") == "Hola,\n\tsaludos 👍🏽", f"{st} guardado={last.get('name')!r}")
st, h, b = req(P, "GET", "/?vista=rrhh")
check("R2", "GET /?vista=rrhh", "Enlace para reclutadores sigue respondiendo 200 HTML", st == 200 and b"data-shell-root" in b, f"{st}")
st, h, b = req(P, "GET", "/index.html")
check("R3", "GET /index.html", "index.html directo sigue en 200", st == 200, f"{st}")
st, h, b = req(P, "GET", "/ruta/inexistente")
check("R4", "GET /ruta/inexistente", "El visitante sigue viendo la app (HTML) aunque la URL no exista", b"data-shell-root" in b, f"{st} html={b'data-shell-root' in b}")
st, h, b = req(P, "GET", "/fonts/" + sorted(os.listdir(os.path.join(SRV, "dist/fonts")))[0])
check("R5", "GET /fonts/*", "Fuentes existentes siguen sirviéndose con caché 30 días", st == 200 and "2592000" in h.get("cache-control", ""), f"{st} {h.get('cache-control')}")
st, h, b = req(P, "GET", "/api/status")
check("R6", "GET /api/status", "Respuesta sana idéntica: 200 {status: ok}", st == 200 and json.loads(b) == {"status": "ok"}, f"{st} {b!r}")

w = max(len(r[2]) for r in R)
for r in R:
    print(" | ".join(r))
print("\nTOTAL", len(R), "FALLAS", sum(r[3] == "FALLA" for r in R))
