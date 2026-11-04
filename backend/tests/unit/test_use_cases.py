"""Use cases with in-memory test doubles for the ports: the business flow, isolated from every adapter."""
from datetime import datetime, timezone

import pytest

from app.application.submit_contact import SubmitContact, SubmitResult
from app.application.system_status import SystemStatus
from app.domain.contact import ContactMessage, ContactSubmission
from app.domain.errors import ContactStorageError, RateLimitExceeded

NOW = datetime(2026, 1, 1, tzinfo=timezone.utc)
SUBMISSION = ContactSubmission("Ana", "ana@example.com", "Hola")


class FakeRepository:
    def __init__(self, *, fail=False, writable=True):
        self.saved: list[ContactMessage] = []
        self.fail, self.writable = fail, writable

    def save(self, message):
        if self.fail:
            raise ContactStorageError("disk full")
        self.saved.append(message)

    def is_writable(self):
        return self.writable


class FakeLimiter:
    def __init__(self, wait=0):
        self.wait, self.keys = wait, []

    def check(self, key):
        self.keys.append(key)
        return self.wait


class FakeFrontend:
    def __init__(self, built):
        self.built = built

    def is_built(self):
        return self.built


def test_stores_message_with_timestamp():
    repo, limiter = FakeRepository(), FakeLimiter()
    assert SubmitContact(repo, limiter, clock=lambda: NOW)(SUBMISSION, "1.2.3.4") is SubmitResult.STORED
    assert repo.saved == [ContactMessage("Ana", "ana@example.com", "Hola", NOW)]
    assert limiter.keys == ["1.2.3.4"]


def test_rate_limited_before_anything_is_stored():
    repo = FakeRepository()
    with pytest.raises(RateLimitExceeded) as exc:
        SubmitContact(repo, FakeLimiter(wait=42))(SUBMISSION, "ip")
    assert exc.value.retry_after_s == 42 and repo.saved == []


def test_honeypot_discards_but_still_counts_against_the_limit():
    repo, limiter = FakeRepository(), FakeLimiter()
    spam = ContactSubmission("Bot", "b@b.cl", "buy", honeypot="x")
    assert SubmitContact(repo, limiter)(spam, "ip") is SubmitResult.DISCARDED
    assert repo.saved == [] and limiter.keys == ["ip"]


def test_storage_errors_propagate():
    with pytest.raises(ContactStorageError):
        SubmitContact(FakeRepository(fail=True), FakeLimiter())(SUBMISSION, "ip")


@pytest.mark.parametrize("writable,built,require,ready", [
    (True, True, True, True),
    (False, True, True, False),
    (True, False, True, False),
    (True, False, False, True),   # development: no build needed
])
def test_system_status(writable, built, require, ready):
    status = SystemStatus(FakeRepository(writable=writable), FakeFrontend(built), require_frontend=require)
    assert status.is_ready() is ready
