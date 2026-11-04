"""Settings from environment variables (all optional).

  APP_ENV              "production" (default) or "development" — development enables /docs and auto-reload
  HOST, PORT           bind address (default 127.0.0.1:8000; use 0.0.0.0 only behind a proxy/firewall)
  CORS_ORIGINS         comma-separated extra origins (the Vite dev server is added only in development)
  TRUST_PROXY          "1" to take the client IP from X-Forwarded-For (only behind a trusted proxy)
  FORWARDED_ALLOW_IPS  proxies whose X-Forwarded-For is trusted, comma-separated IPs/CIDRs or "*" (default 127.0.0.1)
  CLIENT_IP_HEADER     e.g. "cf-connecting-ip": header with the client IP set by a trusted CDN (needs TRUST_PROXY=1)
  ENABLE_HSTS          "1" when the site is served exclusively over HTTPS
  CONTACT_LOG          contact messages file (default: backend/contact_messages.jsonl)
  FRONTEND_DIST        compiled frontend (default: frontend/dist)
  SECURITY_HEADERS_FILE  HTTP security policy (default: config/security-headers.json)
"""
import os
from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent

DEV_ORIGINS = ("http://localhost:5173", "http://127.0.0.1:5173")


@dataclass(frozen=True, slots=True)
class Settings:
    app_env: str = "production"
    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: tuple[str, ...] = ()
    trust_proxy: bool = False
    forwarded_allow_ips: str = "127.0.0.1"
    client_ip_header: str = ""
    enable_hsts: bool = False
    contact_log: Path = field(default_factory=lambda: BACKEND_DIR / "contact_messages.jsonl")
    frontend_dir: Path = field(default_factory=lambda: REPO_ROOT / "frontend" / "dist")
    security_headers_file: Path = field(default_factory=lambda: REPO_ROOT / "config" / "security-headers.json")
    max_body_bytes: int = 16 * 1024  # a contact message never needs more
    rate_limit: int = 5              # contact submissions…
    rate_window_s: int = 10 * 60     # …per client IP per 10 minutes

    @property
    def is_dev(self) -> bool:
        return self.app_env == "development"

    @property
    def allowed_origins(self) -> list[str]:
        return [*(DEV_ORIGINS if self.is_dev else ()), *self.cors_origins]

    @classmethod
    def from_env(cls, env: Mapping[str, str] = os.environ) -> "Settings":
        defaults = cls()
        return cls(
            app_env=env.get("APP_ENV", defaults.app_env).lower(),
            host=env.get("HOST", defaults.host),
            port=int(env.get("PORT", defaults.port)),
            cors_origins=tuple(o.strip() for o in env.get("CORS_ORIGINS", "").split(",") if o.strip()),
            trust_proxy=env.get("TRUST_PROXY") == "1",
            forwarded_allow_ips=env.get("FORWARDED_ALLOW_IPS", defaults.forwarded_allow_ips),
            client_ip_header=env.get("CLIENT_IP_HEADER", "").lower(),
            enable_hsts=env.get("ENABLE_HSTS") == "1",
            # configurable so it can live on a persistent/writable volume (Docker: /data)
            contact_log=Path(env.get("CONTACT_LOG") or defaults.contact_log),
            frontend_dir=Path(env.get("FRONTEND_DIST") or defaults.frontend_dir),
            security_headers_file=Path(env.get("SECURITY_HEADERS_FILE") or defaults.security_headers_file),
        )
