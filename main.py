"""Portfolio server: serves the compiled Vite frontend (dist/) and the contact API.

Configuration (environment variables, all optional):
  APP_ENV        "production" (default) or "development" — development enables /docs and reload
  HOST, PORT     bind address (default 127.0.0.1:8000; use 0.0.0.0 only behind a proxy/firewall)
  CORS_ORIGINS   comma-separated extra origins (the Vite dev server is added only in development)
  TRUST_PROXY    "1" to take the client IP from X-Forwarded-For (only behind a trusted proxy)
  ENABLE_HSTS    "1" when the site is served exclusively over HTTPS
  CONTACT_LOG    path of the contact messages file (default: contact_messages.jsonl next to this file)
  CLIENT_IP_HEADER  e.g. "cf-connecting-ip": header with the client IP set by a trusted CDN (needs TRUST_PROXY=1)
  FORWARDED_ALLOW_IPS  proxies whose X-Forwarded-For uvicorn trusts (default 127.0.0.1)
"""
import base64
import hashlib
import json
import logging
import mimetypes
import os
import re
import threading
import time
from collections import OrderedDict, deque
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import BaseModel, Field, field_validator

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "dist"
# configurable so it can live on a persistent/writable volume (Docker: /data)
CONTACT_LOG = Path(os.getenv("CONTACT_LOG") or BASE_DIR / "contact_messages.jsonl")

APP_ENV = os.getenv("APP_ENV", "production").lower()
IS_DEV = APP_ENV == "development"
TRUST_PROXY = os.getenv("TRUST_PROXY") == "1"
ENABLE_HSTS = os.getenv("ENABLE_HSTS") == "1"

MAX_BODY_BYTES = 16 * 1024          # a contact message never needs more
RATE_LIMIT = 5                      # contact submissions…
RATE_WINDOW_S = 10 * 60             # …per client IP per 10 minutes

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("portfolio")

app = FastAPI(
    title="Portfolio Server",
    # API docs are useful while developing but needlessly expose the surface in production
    docs_url="/docs" if IS_DEV else None,
    redoc_url=None,
    openapi_url="/openapi.json" if IS_DEV else None,
)

cors_origins = (["http://localhost:5173", "http://127.0.0.1:5173"] if IS_DEV else []) + [
    o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.add_middleware(GZipMiddleware, minimum_size=1024)

# Inline styles are required by the UI (framer-motion animates style attributes).
# Scripts come from our own origin, plus the one inline script of the prerendered landing screen,
# allowed by its exact SHA-256 hash (never 'unsafe-inline').
_csp_cache: dict = {"mtime": None, "value": None}


def _inline_script_hashes() -> list[str]:
    index = FRONTEND_DIR / "index.html"
    if not index.is_file():
        return []
    html = index.read_text(encoding="utf-8")
    return [
        "'sha256-" + base64.b64encode(hashlib.sha256(body.encode("utf-8")).digest()).decode() + "'"
        for body in re.findall(r"<script>(.*?)</script>", html, re.S)
    ]


def content_security_policy() -> str:
    """Recomputed only when dist/index.html changes (e.g. after a new build)."""
    index = FRONTEND_DIR / "index.html"
    mtime = index.stat().st_mtime if index.is_file() else None
    if _csp_cache["mtime"] != mtime or _csp_cache["value"] is None:
        _csp_cache["value"] = _build_csp(_inline_script_hashes())
        _csp_cache["mtime"] = mtime
    return _csp_cache["value"]


# the policy itself lives in security-headers.json (shared with the Caddy config in deploy/)
SECURITY = json.loads((BASE_DIR / "security-headers.json").read_text(encoding="utf-8"))


def _build_csp(script_hashes: list[str]) -> str:
    directives = dict(SECURITY["csp"])
    directives["script-src"] += "".join(" " + h for h in script_hashes)
    return "; ".join(f"{name} {value}" for name, value in directives.items())


def apply_security_headers(request: Request, response):
    if request.url.path == "/api" or request.url.path.startswith("/api/"):
        response.headers.setdefault("Cache-Control", "no-store")
    for name, value in SECURITY["headers"].items():
        response.headers.setdefault(name, value)
    if not (IS_DEV and request.url.path.startswith(("/docs", "/openapi.json"))):
        response.headers.setdefault("Content-Security-Policy", content_security_policy())
    if ENABLE_HSTS:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response


@app.middleware("http")
async def security_and_limits(request: Request, call_next):
    # reject oversized API bodies before they are read into memory
    if request.url.path.startswith("/api/") and request.method == "POST":
        length = request.headers.get("content-length")
        if length is None:
            return apply_security_headers(request, JSONResponse({"detail": "Falta Content-Length."}, status_code=411))
        if not length.isdigit() or int(length) > MAX_BODY_BYTES:
            return apply_security_headers(request, JSONResponse({"detail": "El mensaje es demasiado grande."}, status_code=413))
    return apply_security_headers(request, await call_next(request))


# ---------- error handling: concise, consistent JSON; details stay in the server log ----------
@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError):
    fields = sorted({str(e["loc"][-1]) for e in exc.errors() if e.get("loc")})
    return JSONResponse({"detail": "Datos inválidos.", "fields": fields}, status_code=422)


@app.exception_handler(Exception)
async def unhandled_error(request: Request, exc: Exception):
    log.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse({"detail": "Error interno del servidor."}, status_code=500)


# ---------- contact API ----------
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$")
# bidi overrides/isolates and C0/C1 controls (except \n \t). ZWJ (U+200D) is kept: emoji sequences need it.
UNSAFE_CHARS = re.compile(r"[\u202a-\u202e\u2066-\u2069\x00-\x08\x0b-\x1f\x7f-\x9f]")


class ContactMessage(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=254)
    message: str = Field(min_length=1, max_length=5000)
    # honeypot: invisible to people, bots tend to fill it in
    website: str = Field(default="", max_length=200)

    @field_validator("name", "message")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = UNSAFE_CHARS.sub("", v).strip()
        if not v:
            raise ValueError("no puede estar vacío")
        return v

    @field_validator("email")
    @classmethod
    def valid_email(cls, v: str) -> str:
        v = v.strip()
        local, sep, domain = v.rpartition("@")
        if not EMAIL_RE.match(v):
            raise ValueError("email inválido")
        return v


class StatusResponse(BaseModel):
    status: str


class RateLimiter:
    """Sliding-window limiter per client IP (in memory — enough for a single-instance portfolio)."""

    def __init__(self, limit: int, window_s: int, max_keys: int = 10_000):
        self.limit, self.window_s, self.max_keys = limit, window_s, max_keys
        self.hits: OrderedDict[str, deque] = OrderedDict()  # least recently used first
        self.lock = threading.Lock()

    def check(self, key: str) -> int:
        """Returns 0 if allowed, otherwise the seconds to wait."""
        now = time.monotonic()
        with self.lock:
            q = self.hits.get(key)
            if q is None:
                q = self.hits[key] = deque()
            self.hits.move_to_end(key)
            while q and now - q[0] > self.window_s:
                q.popleft()
            # evict idle clients from the LRU end: O(1) amortized, memory bounded even under attack
            while self.hits:
                oldest_key, oldest = next(iter(self.hits.items()))
                if oldest_key == key or (oldest and now - oldest[-1] <= self.window_s and len(self.hits) <= self.max_keys):
                    break
                self.hits.popitem(last=False)
            if len(q) >= self.limit:
                return int(self.window_s - (now - q[0])) + 1
            q.append(now)
            return 0


contact_limiter = RateLimiter(RATE_LIMIT, RATE_WINDOW_S)
contact_log_lock = threading.Lock()


CLIENT_IP_HEADER = os.getenv("CLIENT_IP_HEADER", "").lower()  # e.g. "cf-connecting-ip" behind Cloudflare


def client_ip(request: Request) -> str:
    if TRUST_PROXY and CLIENT_IP_HEADER:
        value = request.headers.get(CLIENT_IP_HEADER, "").strip()
        if value:
            return value
    return request.client.host if request.client else "unknown"


# declared return types let FastAPI serialize straight to JSON bytes via Pydantic (no extra library needed)
@app.api_route("/api/status", methods=["GET", "HEAD"], response_model=StatusResponse)
def get_status():
    """Readiness: 503 when contact messages could not be stored (or, in production, the build is missing)."""
    log_ok = os.access(CONTACT_LOG, os.W_OK) if CONTACT_LOG.exists() else os.access(CONTACT_LOG.parent, os.W_OK)
    build_ok = IS_DEV or (FRONTEND_DIR / "index.html").is_file()  # `npm run dev` needs no dist/
    if not log_ok or not build_ok:
        return JSONResponse({"status": "degraded"}, status_code=503)
    return StatusResponse(status="ok")


@app.post("/api/contact")
def submit_contact(payload: ContactMessage, request: Request) -> StatusResponse:
    # sync handler → runs in the threadpool, so the blocking file write never stalls the event loop
    wait = contact_limiter.check(client_ip(request))
    if wait:
        raise HTTPException(
            status_code=429,
            detail="Demasiados mensajes. Intenta de nuevo más tarde.",
            headers={"Retry-After": str(wait)},
        )
    if payload.website:
        log.info("Contact honeypot triggered; message discarded")
        return StatusResponse(status="ok")  # same answer as a real submission, so bots learn nothing

    entry = {
        "name": payload.name,
        "email": payload.email,
        "message": payload.message,
        "received_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        with contact_log_lock:
            # 0o600: the log contains personal data, readable only by the server user
            fd = os.open(CONTACT_LOG, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
            # newline="\n": identical JSONL on Linux, macOS and Windows (no \r\n translation)
            with os.fdopen(fd, "a", encoding="utf-8", newline="\n") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except OSError:
        log.exception("Could not write the contact log")
        raise HTTPException(status_code=500, detail="No se pudo guardar el mensaje.")
    log.info("Contact message stored")  # never log the content: it is personal data
    return StatusResponse(status="ok")


API_METHODS = {"status": "GET, HEAD", "contact": "POST"}


@app.api_route("/api", methods=["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], include_in_schema=False)
@app.api_route("/api/{rest:path}", methods=["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], include_in_schema=False)
def api_not_found(rest: str = ""):
    allowed = API_METHODS.get(rest.strip("/"))
    if allowed:
        raise HTTPException(status_code=405, detail="Método no permitido.", headers={"Allow": allowed})
    raise HTTPException(status_code=404, detail="Recurso no encontrado.")


# ---------- frontend (compiled SPA) ----------
# Only these file types are served from dist/; anything else (e.g. stray .md files) falls back to the SPA.
STATIC_TYPES = {".js", ".css", ".webp", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".txt", ".woff2", ".json", ".webmanifest"}
# explicit types: on Windows `mimetypes` reads the registry, where .js is often "text/plain" — with nosniff the
# browser would then refuse every module script. These win over whatever the OS reports, on every platform.
for _ext, _type in {
    ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".webp": "image/webp", ".png": "image/png",
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon",
    ".txt": "text/plain", ".woff2": "font/woff2", ".json": "application/json", ".webmanifest": "application/manifest+json",
}.items():
    mimetypes.add_type(_type, _ext)


def static_response(file: Path, request: Request, cache: str) -> FileResponse:
    """Serves the build's precompressed copy (.br / .gz, see scripts/compress.mjs) when the client accepts it."""
    accepted = accepted_encodings(request.headers.get("accept-encoding", ""))
    headers = {"Cache-Control": cache, "Vary": "Accept-Encoding"}
    media_type = mimetypes.guess_type(file.name)[0] or "application/octet-stream"
    chosen, encoding = file, None
    for enc, suffix in (("br", ".br"), ("gzip", ".gz")):
        variant = file.with_name(file.name + suffix)
        if enc in accepted and variant.is_file():
            chosen, encoding = variant, enc
            break
    st = chosen.stat()
    etag = f'"{st.st_mtime_ns:x}-{st.st_size:x}"'  # one tag per encoded variant
    headers["ETag"] = etag
    if encoding:
        headers["Content-Encoding"] = encoding
    if etag in [t.strip() for t in request.headers.get("if-none-match", "").split(",")]:
        return Response(status_code=304, headers=headers)
    return FileResponse(chosen, media_type=media_type, headers=headers)


def accepted_encodings(header: str) -> set[str]:
    """Tokens with q > 0 ("gzip;q=0" means *not* acceptable)."""
    out = set()
    for part in header.split(","):
        token, _, params = part.strip().partition(";")
        q = 1.0
        for p in params.split(";"):
            k, _, v = p.strip().partition("=")
            if k == "q":
                try:
                    q = float(v)
                except ValueError:
                    q = 0.0
        if token and q > 0:
            out.add(token.strip().lower())
    return out


@app.api_route("/{path:path}", methods=["GET", "HEAD"])
def serve_frontend(path: str, request: Request):
    index = FRONTEND_DIR / "index.html"
    if not index.is_file():
        return JSONResponse(
            {"detail": "El frontend no está compilado. Ejecuta `npm run build` para generar dist/."},
            status_code=503,
        )
    if path in ("", "index.html"):
        return static_response(index, request, "no-cache")
    if "\x00" in path:
        return JSONResponse({"detail": "Recurso no encontrado."}, status_code=404)
    root = FRONTEND_DIR.resolve()  # per request: dist/ may be a symlink swapped by an atomic deploy
    try:
        candidate = (FRONTEND_DIR / path).resolve()
    except (OSError, ValueError):
        return JSONResponse({"detail": "Recurso no encontrado."}, status_code=404)
    if path:
        # resolve() + is_relative_to blocks path traversal (../, symlinks outside dist)
        if candidate.is_relative_to(root) and candidate.is_file() and candidate.suffix.lower() in STATIC_TYPES:
            # hashed build assets never change → cache for a year; everything else revalidates
            if path == "sw.js":
                cache = "no-cache"  # the browser must always see a new service worker version promptly
            elif path.startswith("assets/"):
                cache = "public, max-age=31536000, immutable"  # content-hashed by the build
            elif path.startswith("fonts/"):
                cache = "public, max-age=2592000"  # 30 days; rename the file if a font ever changes
            else:
                cache = "public, max-age=3600"
            return static_response(candidate, request, cache)
    # a missing file (old hashed chunk, image, font…) must never be answered with the HTML shell
    if path.startswith(("assets/", "fonts/", "img/")) or Path(path).suffix.lower() in STATIC_TYPES:
        return JSONResponse({"detail": "Recurso no encontrado."}, status_code=404, headers={"Cache-Control": "no-store"})
    # unknown page: same app (the visitor still sees the portfolio) but an honest 404 for crawlers
    response = static_response(index, request, "no-cache")
    if response.status_code == 200:
        response.status_code = 404
    return response


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=IS_DEV,
        proxy_headers=TRUST_PROXY,
        forwarded_allow_ips=os.getenv("FORWARDED_ALLOW_IPS", "127.0.0.1"),
        server_header=False,
    )
