"""Portfolio server: serves the compiled Vite frontend (dist/) and the contact API.

Configuration (environment variables, all optional):
  APP_ENV        "production" (default) or "development" — development enables /docs and reload
  HOST, PORT     bind address (default 127.0.0.1:8000; use 0.0.0.0 only behind a proxy/firewall)
  CORS_ORIGINS   comma-separated extra origins (default: the Vite dev server)
  TRUST_PROXY    "1" to take the client IP from X-Forwarded-For (only behind a trusted proxy)
  ENABLE_HSTS    "1" when the site is served exclusively over HTTPS
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
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, field_validator

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "dist"
CONTACT_LOG = BASE_DIR / "contact_messages.jsonl"

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

cors_origins = ["http://localhost:5173", "http://127.0.0.1:5173"] + [
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


@app.middleware("http")
async def security_and_limits(request: Request, call_next):
    # reject oversized API bodies before they are read into memory
    if request.url.path.startswith("/api/") and request.method == "POST":
        length = request.headers.get("content-length")
        if length is None:
            return JSONResponse({"detail": "Falta Content-Length."}, status_code=411)
        if not length.isdigit() or int(length) > MAX_BODY_BYTES:
            return JSONResponse({"detail": "El mensaje es demasiado grande."}, status_code=413)

    response = await call_next(request)
    for name, value in SECURITY["headers"].items():
        response.headers.setdefault(name, value)
    if not (IS_DEV and request.url.path.startswith(("/docs", "/openapi.json"))):
        response.headers.setdefault("Content-Security-Policy", content_security_policy())
    if ENABLE_HSTS:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response


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
class ContactMessage(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=254)
    message: str = Field(min_length=1, max_length=5000)
    # honeypot: invisible to people, bots tend to fill it in
    website: str = Field(default="", max_length=200)

    @field_validator("name", "message")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("no puede estar vacío")
        return v

    @field_validator("email")
    @classmethod
    def valid_email(cls, v: str) -> str:
        v = v.strip()
        local, sep, domain = v.rpartition("@")
        if not sep or not local or "." not in domain or any(c.isspace() for c in v):
            raise ValueError("email inválido")
        return v


class StatusResponse(BaseModel):
    status: str


class RateLimiter:
    """Sliding-window limiter per client IP (in memory — enough for a single-instance portfolio)."""

    def __init__(self, limit: int, window_s: int):
        self.limit, self.window_s = limit, window_s
        self.hits: dict[str, deque] = defaultdict(deque)
        self.lock = threading.Lock()

    def check(self, key: str) -> int:
        """Returns 0 if allowed, otherwise the seconds to wait."""
        now = time.monotonic()
        with self.lock:
            q = self.hits[key]
            while q and now - q[0] > self.window_s:
                q.popleft()
            if len(q) >= self.limit:
                return int(self.window_s - (now - q[0])) + 1
            q.append(now)
            if len(self.hits) > 10_000:  # bound memory under abuse
                for k in [k for k, v in self.hits.items() if not v][:5_000]:
                    del self.hits[k]
            return 0


contact_limiter = RateLimiter(RATE_LIMIT, RATE_WINDOW_S)
contact_log_lock = threading.Lock()


def client_ip(request: Request) -> str:
    if TRUST_PROXY:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# declared return types let FastAPI serialize straight to JSON bytes via Pydantic (no extra library needed)
@app.get("/api/status")
def get_status() -> StatusResponse:
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
            with os.fdopen(fd, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except OSError:
        log.exception("Could not write the contact log")
        raise HTTPException(status_code=500, detail="No se pudo guardar el mensaje.")
    log.info("Contact message stored")  # never log the content: it is personal data
    return StatusResponse(status="ok")


@app.api_route("/api/{rest:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def api_not_found(rest: str):
    raise HTTPException(status_code=404, detail="Recurso no encontrado.")


# ---------- frontend (compiled SPA) ----------
# Only these file types are served from dist/; anything else (e.g. stray .md files) falls back to the SPA.
STATIC_TYPES = {".js", ".css", ".webp", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".txt", ".woff2", ".json", ".webmanifest"}


def static_response(file: Path, request: Request, cache: str) -> FileResponse:
    """Serves the build's precompressed copy (.br / .gz, see scripts/compress.mjs) when the client accepts it."""
    accepted = request.headers.get("accept-encoding", "")
    headers = {"Cache-Control": cache, "Vary": "Accept-Encoding"}
    media_type = mimetypes.guess_type(file.name)[0] or "application/octet-stream"
    for encoding, suffix in (("br", ".br"), ("gzip", ".gz")):
        variant = file.with_name(file.name + suffix)
        if encoding in accepted and variant.is_file():
            return FileResponse(variant, media_type=media_type, headers={**headers, "Content-Encoding": encoding})
    return FileResponse(file, media_type=media_type, headers=headers)


@app.api_route("/{path:path}", methods=["GET", "HEAD"])
def serve_frontend(path: str, request: Request):
    index = FRONTEND_DIR / "index.html"
    if not index.is_file():
        return JSONResponse(
            {"detail": "El frontend no está compilado. Ejecuta `npm run build` para generar dist/."},
            status_code=503,
        )
    if path:
        candidate = (FRONTEND_DIR / path).resolve()
        # resolve() + is_relative_to blocks path traversal (../, symlinks outside dist)
        if candidate.is_relative_to(FRONTEND_DIR) and candidate.is_file() and candidate.suffix.lower() in STATIC_TYPES:
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
    return static_response(index, request, "no-cache")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=IS_DEV,
        proxy_headers=TRUST_PROXY,
    )
