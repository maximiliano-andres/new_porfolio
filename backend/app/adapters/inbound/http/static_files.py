"""Compiled SPA (frontend/dist): static files with precompressed .br/.gz variants, ETags and an honest 404."""
import mimetypes
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import FileResponse, JSONResponse, Response

# Only these file types are served from dist/; anything else (e.g. stray .md files) falls back to the SPA.
STATIC_TYPES = {
    ".js", ".css", ".webp", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".txt", ".woff2", ".json", ".webmanifest", ".pdf",
}
# explicit types: on Windows `mimetypes` reads the registry, where .js is often "text/plain" — with nosniff the
# browser would then refuse every module script. These win over whatever the OS reports, on every platform.
for _ext, _type in {
    ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".webp": "image/webp", ".png": "image/png",
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon",
    ".txt": "text/plain", ".woff2": "font/woff2", ".json": "application/json", ".webmanifest": "application/manifest+json",
    ".pdf": "application/pdf",
}.items():
    mimetypes.add_type(_type, _ext)


class StaticFrontend:
    """FrontendBuild port implementation + the files it serves."""

    def __init__(self, frontend_dir: Path):
        self.dir = frontend_dir

    @property
    def index(self) -> Path:
        return self.dir / "index.html"

    def is_built(self) -> bool:
        return self.index.is_file()


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


def static_response(file: Path, request: Request, cache: str) -> FileResponse:
    """Serves the build's precompressed copy (.br / .gz, see frontend/scripts/compress.mjs) when the client accepts it."""
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


def cache_policy(path: str) -> str:
    if path == "sw.js":
        return "no-cache"  # the browser must always see a new service worker version promptly
    if path.startswith("assets/"):
        return "public, max-age=31536000, immutable"  # content-hashed by the build
    if path.startswith("fonts/"):
        return "public, max-age=2592000"  # 30 days; rename the file if a font ever changes
    if path.startswith("cv/"):
        return "no-cache"  # unversioned file name (CV_….pdf): an updated CV must be seen at once (same as Caddy)
    return "public, max-age=3600"


def not_found() -> JSONResponse:
    """Honest 404 for files: JSON (never the HTML shell) and never cached, so a later deploy can fill the gap."""
    return JSONResponse({"detail": "Recurso no encontrado."}, status_code=404, headers={"Cache-Control": "no-store"})


def build_frontend_router(frontend: StaticFrontend) -> APIRouter:
    """Catch-all route: must be registered after the API router."""
    router = APIRouter()

    @router.api_route("/{path:path}", methods=["GET", "HEAD"])
    def serve_frontend(path: str, request: Request):
        index = frontend.index
        if not index.is_file():
            return JSONResponse(
                {"detail": "El frontend no está compilado. Ejecuta `npm run build` en frontend/ para generar dist/."},
                status_code=503,
            )
        if path in ("", "index.html"):
            return static_response(index, request, "no-cache")
        if "\x00" in path:
            return not_found()
        root = frontend.dir.resolve()  # per request: dist/ may be a symlink swapped by an atomic deploy
        try:
            candidate = (frontend.dir / path).resolve()
        except (OSError, ValueError):
            return not_found()
        # resolve() + is_relative_to blocks path traversal (../, symlinks outside dist)
        if candidate.is_relative_to(root) and candidate.is_file() and candidate.suffix.lower() in STATIC_TYPES:
            return static_response(candidate, request, cache_policy(path))
        # a missing file (old hashed chunk, image, font…) must never be answered with the HTML shell
        if path.startswith(("assets/", "fonts/", "img/", "cv/")) or Path(path).suffix.lower() in STATIC_TYPES:
            return not_found()
        # unknown page: same app (the visitor still sees the portfolio) but an honest 404 for crawlers
        response = static_response(index, request, "no-cache")
        if response.status_code == 200:
            response.status_code = 404
        return response

    return router
