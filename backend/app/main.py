"""Composition root: builds the adapters, injects them into the use cases and assembles the FastAPI app.

ASGI entry points (Granian, Rust HTTP server):
  app.main:asgi  the app behind the X-Forwarded-For handler when TRUST_PROXY=1 (what production runs)
  app.main:app   the bare FastAPI app (tests, other ASGI servers)
Run locally from backend/:  `python -m app`  (APP_ENV=development enables auto-reload and /docs).
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.adapters.inbound.http.api import build_api_router
from app.adapters.inbound.http.errors import register_exception_handlers
from app.adapters.inbound.http.proxy import client_ip_resolver, with_proxy_headers
from app.adapters.inbound.http.security import SecurityAndLimits, SecurityPolicy
from app.adapters.inbound.http.static_files import StaticFrontend, build_frontend_router
from app.adapters.outbound.jsonl_contact_repository import JsonlContactRepository
from app.adapters.outbound.memory_rate_limiter import InMemoryRateLimiter
from app.application.submit_contact import SubmitContact
from app.application.system_status import SystemStatus
from app.config import Settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def create_app(settings: Settings) -> FastAPI:
    # ---- outbound adapters (driven) ----
    repository = JsonlContactRepository(settings.contact_log)
    rate_limiter = InMemoryRateLimiter(settings.rate_limit, settings.rate_window_s)
    frontend = StaticFrontend(settings.frontend_dir)

    # ---- use cases ----
    submit_contact = SubmitContact(repository, rate_limiter)
    system_status = SystemStatus(repository, frontend, require_frontend=not settings.is_dev)

    # ---- inbound adapter (driving): HTTP ----
    app = FastAPI(
        title="Portfolio Server",
        # API docs are useful while developing but needlessly expose the surface in production
        docs_url="/docs" if settings.is_dev else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.is_dev else None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    # No GZipMiddleware: API answers are < 1 KB, static files ship precompressed (.br/.gz) and Caddy encodes
    # /api/* at the edge. It only added per-request work (and ignored "gzip;q=0").
    # Added after CORS on purpose → outermost: security headers also reach CORS preflights and early rejections.
    app.add_middleware(
        SecurityAndLimits,
        policy=SecurityPolicy(settings.security_headers_file, settings.frontend_dir),
        is_dev=settings.is_dev,
        enable_hsts=settings.enable_hsts,
        max_body_bytes=settings.max_body_bytes,
    )
    register_exception_handlers(app)

    client_ip = client_ip_resolver(trust_proxy=settings.trust_proxy, client_ip_header=settings.client_ip_header)
    app.include_router(build_api_router(submit_contact=submit_contact, system_status=system_status, client_ip=client_ip))
    app.include_router(build_frontend_router(frontend))  # catch-all: always last
    return app


settings = Settings.from_env()
app = create_app(settings)
asgi = with_proxy_headers(app, settings.forwarded_allow_ips) if settings.trust_proxy else app


def run() -> None:
    from granian import Granian
    from granian.constants import Interfaces

    Granian(
        "app.main:asgi",
        address=settings.host,
        port=settings.port,
        interface=Interfaces.ASGI,
        websockets=False,
        reload=settings.is_dev,  # needs granian[reload] (requirements-dev.txt)
        log_access=False,
    ).serve()
