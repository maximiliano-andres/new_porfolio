"""Use case: readiness probe (Docker HEALTHCHECK, uptime monitors)."""
from app.domain.ports import ContactRepository, FrontendBuild


class SystemStatus:
    def __init__(self, repository: ContactRepository, frontend: FrontendBuild, *, require_frontend: bool):
        self._repository = repository
        self._frontend = frontend
        self._require_frontend = require_frontend  # False in development: `npm run dev` needs no dist/

    def is_ready(self) -> bool:
        """False when contact messages could not be stored, or the required build is missing."""
        build_ok = not self._require_frontend or self._frontend.is_built()
        return self._repository.is_writable() and build_ok
