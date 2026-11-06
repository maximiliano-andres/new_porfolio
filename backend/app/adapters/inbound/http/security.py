"""HTTP security: policy from config/security-headers.json (shared with Caddy) and a pure ASGI middleware."""
import base64
import hashlib
import json
import re
from pathlib import Path

from fastapi.responses import JSONResponse


# keep in sync with frontend/scripts/deploy-headers.mjs
INLINE_SCRIPT_RE = re.compile(r"<script\b([^>]*)>(.*?)</script\s*>", re.S | re.I)
SRC_ATTR_RE = re.compile(r"\ssrc\s*=", re.I)


class SecurityPolicy:
    """Security headers + Content-Security-Policy (+ the HSTS value, applied only when enabled).

    Inline styles are required by the UI (framer-motion animates style attributes). Scripts come from our own
    origin, plus the inline scripts of dist/index.html (today: the prerendered landing screen's head script), each
    allowed by its exact SHA-256 hash (never 'unsafe-inline'). Every inline <script> without src is hashed, whatever
    its attributes (type=module, JSON-LD…) — the same rule as frontend/scripts/deploy-headers.mjs, so Caddy and the
    backend always agree. The CSP is recomputed only when dist/index.html changes (e.g. after a new build).
    """

    def __init__(self, policy_file: Path, frontend_dir: Path):
        policy = json.loads(policy_file.read_text(encoding="utf-8"))
        self._csp_directives: dict[str, str] = dict(policy["csp"])
        self.headers = [(name.lower().encode(), value.encode()) for name, value in policy["headers"].items()]
        self.hsts: str = policy.get("hsts", "max-age=300")
        self._index = frontend_dir / "index.html"
        self._cache: dict = {"mtime": None, "value": None}

    def _inline_script_hashes(self) -> list[str]:
        if not self._index.is_file():
            return []
        html = self._index.read_text(encoding="utf-8")
        return [
            "'sha256-" + base64.b64encode(hashlib.sha256(body.encode("utf-8")).digest()).decode() + "'"
            for attrs, body in INLINE_SCRIPT_RE.findall(html)
            if not SRC_ATTR_RE.search(attrs)
        ]

    def content_security_policy(self) -> str:
        mtime = self._index.stat().st_mtime if self._index.is_file() else None
        if self._cache["mtime"] != mtime or self._cache["value"] is None:
            directives = dict(self._csp_directives)
            directives["script-src"] += "".join(" " + h for h in self._inline_script_hashes())
            self._cache["value"] = "; ".join(f"{name} {value}" for name, value in directives.items())
            self._cache["mtime"] = mtime
        return self._cache["value"]


class SecurityHeaders:
    """The headers every response gets. Shared by the middleware and the 500 handler (which runs outside it)."""

    def __init__(self, policy: SecurityPolicy, *, is_dev: bool, enable_hsts: bool):
        self.policy = policy
        self.is_dev = is_dev
        self.enable_hsts = enable_hsts

    def for_path(self, path: str) -> list[tuple[bytes, bytes]]:
        is_api = path == "/api" or path.startswith("/api/")
        extra = [(b"cache-control", b"no-store")] if is_api else []
        extra += self.policy.headers
        if not (self.is_dev and path.startswith(("/docs", "/openapi.json"))):
            extra.append((b"content-security-policy", self.policy.content_security_policy().encode()))
        if self.enable_hsts:
            # same gradual value as Caddy (config/security-headers.json "hsts"); Caddy overrides it when in front
            extra.append((b"strict-transport-security", self.policy.hsts.encode()))
        return extra


class SecurityAndLimits:
    """Security headers on every response + early 411/413 for API bodies, as a pure ASGI middleware.

    Replaces an @app.middleware("http") (BaseHTTPMiddleware), whose extra task and body streaming per request
    cost ~25 % of /api/status throughput (measured: 1 540 → 2 073 req/s on uvicorn, 1 839 → 2 467 on granian).
    """

    def __init__(self, app, *, headers: SecurityHeaders, max_body_bytes: int):
        self.app = app
        self.headers = headers
        self.max_body_bytes = max_body_bytes

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        path = scope["path"]
        extra = self.headers.for_path(path)

        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                present = {name.lower() for name, _ in headers}
                headers += [(name, value) for name, value in extra if name not in present]  # setdefault semantics
                message = {**message, "headers": headers}
            await send(message)

        # reject oversized API bodies before they are read into memory
        if scope["method"] == "POST" and path.startswith("/api/"):
            length = next((v for k, v in scope["headers"] if k == b"content-length"), None)
            if length is None:
                reject = JSONResponse({"detail": "Falta Content-Length."}, status_code=411)
            elif not length.isdigit() or int(length) > self.max_body_bytes:
                reject = JSONResponse({"detail": "El mensaje es demasiado grande."}, status_code=413)
            else:
                reject = None
            if reject is not None:
                return await reject(scope, receive, send_with_headers)
        await self.app(scope, receive, send_with_headers)
