"""Ports: the interfaces the domain needs. Adapters in app/adapters/outbound implement them.

Swapping an adapter (e.g. JSONL → PostgreSQL, in-memory → Redis rate limiter) never touches the domain or the use cases.
"""
from typing import Protocol

from app.domain.contact import ContactMessage


class ContactRepository(Protocol):
    def save(self, message: ContactMessage) -> None:
        """Persists the message. Raises ContactStorageError on failure."""
        ...

    def is_writable(self) -> bool:
        """Readiness probe: True when save() is expected to succeed."""
        ...


class RateLimiter(Protocol):
    def check(self, key: str) -> int:
        """Registers one attempt for `key`. Returns 0 if allowed, otherwise the seconds to wait."""
        ...


class FrontendBuild(Protocol):
    def is_built(self) -> bool:
        """True when the compiled frontend is available to be served."""
        ...
