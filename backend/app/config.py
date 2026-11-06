"""Settings from environment variables (all optional).

  APP_ENV              "production" (default) or "development" — development enables /docs and auto-reload
  HOST, PORT           bind address (default 127.0.0.1:8000; use 0.0.0.0 only behind a proxy/firewall)
  CORS_ORIGINS         comma-separated extra origins (the Vite dev server is added only in development)
  TRUST_PROXY          "1" to take the client IP from X-Forwarded-For (only behind a trusted proxy)
  FORWARDED_ALLOW_IPS  proxies whose X-Forwarded-For is trusted, comma-separated IPs/CIDRs or "*" (default 127.0.0.1)
  CLIENT_IP_HEADER     e.g. "cf-connecting-ip": header with the client IP set by a trusted CDN (needs TRUST_PROXY=1)
  ENABLE_HSTS          "1" when the site is served exclusively over HTTPS and the backend is reached WITHOUT Caddy
                       (Caddy already sends Strict-Transport-Security on every response, /api/* included). The value
                       comes from "hsts" in config/security-headers.json, shared with Caddy (gradual: max-age=300)
  CONTACT_LOG          contact messages file (default: backend/contact_messages.jsonl)
  CONTACT_RATE_LIMIT   messages per client per CONTACT_RATE_WINDOW_S seconds (default 5 per 600 s)
  CONTACT_IPV6_PREFIX  IPv6 clients share one quota per prefix (default /64: what a single subscriber/VPS gets)
  CONTACT_GLOBAL_LIMIT stored messages per hour for ALL clients together; above it → 429 (default 100, 0 = off)
  CONTACT_LOG_MAX_MB   contact log size cap; above it new messages get 503 (default 50, 0 = off)
  CONTACT_RETENTION_DAYS  messages older than this are purged at startup and at most once a day (default 365, 0 = keep)
  CONTACT_NOTIFY_WEBHOOK  optional https:// URL that gets a POST (no personal data) for each new message; empty = off
  MIN_FREE_DISK_MB     /api/status answers 503 when the contact log's disk has less free space (default 100)
  FRONTEND_DIST        compiled frontend (default: frontend/dist)
  SECURITY_HEADERS_FILE  HTTP security policy (default: config/security-headers.json)
"""
import os
from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit

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
    ipv6_prefix: int = 64            # IPv6 clients are grouped by network: one /64 = one quota
    global_rate_limit: int = 100     # stored messages for everyone together…
    global_rate_window_s: int = 60 * 60  # …per hour (bounds disk growth whatever the number of IPs)
    contact_log_max_bytes: int = 50 * 1024 * 1024
    contact_retention_days: int = 365  # the privacy notice in the contact form promises 12 months
    contact_notify_webhook: str = ""
    min_free_disk_bytes: int = 100 * 1024 * 1024

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
            rate_limit=_int(env, "CONTACT_RATE_LIMIT", defaults.rate_limit, minimum=1),
            rate_window_s=_int(env, "CONTACT_RATE_WINDOW_S", defaults.rate_window_s, minimum=1),
            ipv6_prefix=_int(env, "CONTACT_IPV6_PREFIX", defaults.ipv6_prefix, minimum=1, maximum=128),
            global_rate_limit=_int(env, "CONTACT_GLOBAL_LIMIT", defaults.global_rate_limit),
            contact_log_max_bytes=_int(env, "CONTACT_LOG_MAX_MB", defaults.contact_log_max_bytes // MB) * MB,
            contact_retention_days=_int(env, "CONTACT_RETENTION_DAYS", defaults.contact_retention_days),
            contact_notify_webhook=_webhook_url(env.get("CONTACT_NOTIFY_WEBHOOK", "")),
            min_free_disk_bytes=_int(env, "MIN_FREE_DISK_MB", defaults.min_free_disk_bytes // MB) * MB,
        )


MB = 1024 * 1024


def _int(env: Mapping[str, str], name: str, default: int, *, minimum: int = 0, maximum: int | None = None) -> int:
    raw = env.get(name, "").strip()
    if not raw:
        return default
    value = int(raw)  # a typo fails at startup, not silently
    if value < minimum or (maximum is not None and value > maximum):
        raise ValueError(f"{name}={raw} is out of range")
    return value


def _webhook_url(raw: str) -> str:
    """Only https:// URLs: the notification must never travel in clear text. Fails at startup otherwise."""
    url = raw.strip()
    if not url:
        return ""
    parts = urlsplit(url)
    if parts.scheme != "https" or not parts.hostname:
        raise ValueError("CONTACT_NOTIFY_WEBHOOK must be an https:// URL")
    return url
