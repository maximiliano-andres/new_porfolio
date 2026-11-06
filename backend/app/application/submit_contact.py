"""Use case: a visitor submits the contact form."""
import enum
import logging
from collections.abc import Callable
from datetime import datetime, timezone

from app.domain.contact import ContactMessage, ContactSubmission
from app.domain.errors import RateLimitExceeded
from app.domain.ports import ContactRepository, RateLimiter

log = logging.getLogger("portfolio")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


GLOBAL_KEY = "*"


class SubmitResult(enum.Enum):
    STORED = "stored"
    DISCARDED = "discarded"  # honeypot: answered like a real submission, so bots learn nothing


class SubmitContact:
    def __init__(
        self,
        repository: ContactRepository,
        rate_limiter: RateLimiter,
        clock: Callable[[], datetime] = utc_now,
        *,
        global_limiter: RateLimiter | None = None,
    ):
        self._repository = repository
        self._rate_limiter = rate_limiter
        self._global_limiter = global_limiter  # one shared quota for every client: bounds disk growth from IP rotation
        self._clock = clock

    def __call__(self, submission: ContactSubmission, client_key: str) -> SubmitResult:
        """Raises RateLimitExceeded (per client or global quota) or ContactStorageError / ContactStorageFull."""
        wait = self._rate_limiter.check(client_key)
        if wait:
            raise RateLimitExceeded(wait)
        if submission.is_spam:
            log.info("Contact honeypot triggered; message discarded")
            return SubmitResult.DISCARDED
        # after the honeypot on purpose: discarded spam costs no disk, so bots can't burn the real visitors' quota
        if self._global_limiter is not None:
            wait = self._global_limiter.check(GLOBAL_KEY)
            if wait:
                log.warning("Global contact quota reached; message refused")
                raise RateLimitExceeded(wait)
        self._repository.save(
            ContactMessage(
                name=submission.name,
                email=submission.email,
                message=submission.message,
                received_at=self._clock(),
            )
        )
        log.info("Contact message stored")  # never log the content: it is personal data
        return SubmitResult.STORED
