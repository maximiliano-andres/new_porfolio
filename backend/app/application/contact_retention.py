"""Use case: retention policy — contact messages are personal data and are kept only CONTACT_RETENTION_DAYS."""
import logging
import threading
from collections.abc import Callable
from datetime import datetime, timedelta

from app.application.submit_contact import utc_now
from app.domain.errors import ContactStorageError
from app.domain.ports import ContactRepository

log = logging.getLogger("portfolio")


class PurgeExpiredContacts:
    """Runs at startup and then at most once per `every` (triggered after a new message), so it costs nothing per request."""

    def __init__(
        self,
        repository: ContactRepository,
        retention_days: int,
        clock: Callable[[], datetime] = utc_now,
        every: timedelta = timedelta(days=1),
    ):
        self._repository = repository
        self._retention = timedelta(days=retention_days) if retention_days > 0 else None  # 0 = keep forever
        self._clock = clock
        self._every = every
        self._last_run: datetime | None = None
        self._lock = threading.Lock()

    def __call__(self) -> int:
        """Purges now. Returns how many messages were removed. Storage errors are logged, never raised."""
        if self._retention is None:
            return 0
        now = self._clock()
        with self._lock:
            self._last_run = now
        try:
            removed = self._repository.purge_received_before(now - self._retention)
        except ContactStorageError:
            log.exception("Contact retention purge failed")
            return 0
        if removed:
            log.info("Contact retention: %d expired message(s) purged", removed)
        return removed

    def run_if_due(self) -> int:
        with self._lock:
            due = self._last_run is None or self._clock() - self._last_run >= self._every
        return self() if due else 0
