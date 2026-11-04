"""Domain errors: raised by use cases, translated to HTTP status codes by the inbound adapter."""


class DomainError(Exception):
    """Base class for expected business failures."""


class RateLimitExceeded(DomainError):
    def __init__(self, retry_after_s: int):
        super().__init__(f"rate limit exceeded, retry after {retry_after_s}s")
        self.retry_after_s = retry_after_s


class ContactStorageError(DomainError):
    """The message could not be persisted (disk full, read-only volume, permissions…)."""
