"""Ports: the interfaces the domain needs. Adapters in app/adapters/outbound implement them.

Swapping an adapter (e.g. JSONL → PostgreSQL, in-memory → Redis rate limiter) never touches the domain or the use cases.
"""
from datetime import datetime
from typing import Protocol

from app.domain.contact import ContactMessage


class ContactRepository(Protocol):
    def save(self, message: ContactMessage) -> None:
        """Persists the message. Raises ContactStorageFull when the store reached its size cap, ContactStorageError
        on any other failure."""
        ...

    def purge_received_before(self, cutoff: datetime) -> int:
        """Deletes the messages received before `cutoff` (retention policy). Returns how many were removed."""
        ...

    def is_writable(self) -> bool:
        """Readiness probe: True when save() is expected to succeed (permissions and free disk space)."""
        ...


class RateLimiter(Protocol):
    def check(self, key: str) -> int:
        """Registers one attempt for `key`. Returns 0 if allowed, otherwise the seconds to wait."""
        ...


class ContactNotifier(Protocol):
    def notify_new_message(self, received_at: datetime) -> None:
        """Tells the owner that a message arrived. Never receives the message itself (personal data stays on disk).
        May raise: the caller logs the failure, the message is already stored."""
        ...


class FrontendBuild(Protocol):
    def is_built(self) -> bool:
        """True when the compiled frontend is available to be served."""
        ...
