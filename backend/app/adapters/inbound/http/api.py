"""JSON API routes (/api/*). Translates HTTP ↔ use cases and domain errors ↔ status codes."""
import logging
from collections.abc import Callable

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import JSONResponse

from app.adapters.inbound.http.schemas import ContactRequest, StatusResponse
from app.application.contact_retention import PurgeExpiredContacts
from app.application.notify_owner import NotifyOwner
from app.application.submit_contact import SubmitContact, SubmitResult
from app.application.system_status import SystemStatus
from app.domain.errors import ContactStorageError, ContactStorageFull, RateLimitExceeded

log = logging.getLogger("portfolio")

API_METHODS = {"status": "GET, HEAD", "contact": "POST"}
ALL_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]


def build_api_router(
    *,
    submit_contact: SubmitContact,
    system_status: SystemStatus,
    client_ip: Callable[[Request], str],
    notify_owner: NotifyOwner,
    purge_expired: PurgeExpiredContacts,
) -> APIRouter:
    router = APIRouter()

    # declared return types let FastAPI serialize straight to JSON bytes via Pydantic (no extra library needed)
    @router.api_route("/api/status", methods=["GET", "HEAD"], response_model=StatusResponse)
    def get_status():
        """Readiness: 503 when contact messages could not be stored (or, in production, the build is missing)."""
        if not system_status.is_ready():
            return JSONResponse({"status": "degraded"}, status_code=503)
        return StatusResponse(status="ok")

    @router.post("/api/contact")
    def post_contact(payload: ContactRequest, request: Request, background: BackgroundTasks) -> StatusResponse:
        # sync handler → runs in the threadpool, so the blocking file write never stalls the event loop
        try:
            result = submit_contact(payload.to_domain(), client_ip(request))
        except RateLimitExceeded as exc:
            raise HTTPException(
                status_code=429,
                detail="Demasiados mensajes. Intenta de nuevo más tarde.",
                headers={"Retry-After": str(exc.retry_after_s)},
            ) from None
        except ContactStorageFull:
            log.error("Contact log is full (CONTACT_LOG_MAX_MB): message refused; archive or purge the log")
            raise HTTPException(
                status_code=503,
                detail="El buzón de mensajes está lleno por ahora. Escríbeme por LinkedIn o inténtalo más tarde.",
                headers={"Retry-After": "3600"},
            ) from None
        except ContactStorageError:
            log.exception("Could not write the contact log")
            raise HTTPException(status_code=500, detail="No se pudo guardar el mensaje.") from None
        if result is SubmitResult.STORED:
            # after the response is sent: a slow or failing webhook never delays nor fails the visitor's request
            if notify_owner.enabled:
                background.add_task(notify_owner)
            background.add_task(purge_expired.run_if_due)  # at most once a day; no-op otherwise
        # stored or discarded by the honeypot: the same answer, so bots learn nothing
        return StatusResponse(status="ok")

    # any other /api path answers JSON 404/405 — never the SPA's HTML
    @router.api_route("/api", methods=ALL_METHODS, include_in_schema=False)
    @router.api_route("/api/{rest:path}", methods=ALL_METHODS, include_in_schema=False)
    def api_not_found(rest: str = ""):
        allowed = API_METHODS.get(rest.strip("/"))
        if allowed:
            raise HTTPException(status_code=405, detail="Método no permitido.", headers={"Allow": allowed})
        raise HTTPException(status_code=404, detail="Recurso no encontrado.")

    return router
