"""Error handling: concise, consistent JSON; details stay in the server log."""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.adapters.inbound.http.security import SecurityHeaders

log = logging.getLogger("portfolio")


async def validation_error(_: Request, exc: RequestValidationError):
    fields = sorted({str(e["loc"][-1]) for e in exc.errors() if e.get("loc")})
    return JSONResponse({"detail": "Datos inválidos.", "fields": fields}, status_code=422)


def unhandled_error_handler(security_headers: SecurityHeaders):
    """500 handler. Starlette runs it in ServerErrorMiddleware, OUTSIDE every user middleware, so it adds the security
    headers itself (CSP, nosniff, no-store…) instead of relying on SecurityAndLimits."""

    async def unhandled_error(request: Request, exc: Exception):
        log.error("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
        response = JSONResponse({"detail": "Error interno del servidor."}, status_code=500)
        for name, value in security_headers.for_path(request.url.path):
            response.headers.setdefault(name.decode(), value.decode())
        response.headers.setdefault("cache-control", "no-store")
        return response

    return unhandled_error


def register_exception_handlers(app: FastAPI, security_headers: SecurityHeaders) -> None:
    app.add_exception_handler(RequestValidationError, validation_error)
    app.add_exception_handler(Exception, unhandled_error_handler(security_headers))
