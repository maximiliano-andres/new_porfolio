"""CT-1/CT-2/CT-3/BE-1/BE-3 building blocks, each against its contract (no HTTP)."""
import ipaddress
import json
import logging
import os
import sys
from collections import namedtuple
from datetime import datetime, timedelta, timezone

import pytest

from app.adapters.inbound.http.proxy import parse_ip, rate_limit_key
from app.adapters.outbound import jsonl_contact_repository, webhook_notifier
from app.adapters.outbound.jsonl_contact_repository import JsonlContactRepository
from app.adapters.outbound.webhook_notifier import WebhookNotifier
from app.application.contact_retention import PurgeExpiredContacts
from app.application.notify_owner import NotifyOwner
from app.config import Settings
from app.domain.contact import ContactMessage
from app.domain.errors import ContactStorageError, ContactStorageFull

NOW = datetime(2026, 11, 5, tzinfo=timezone.utc)


# ---------- rate-limit key ----------
@pytest.mark.parametrize("value,expected", [
    ("203.0.113.9", "203.0.113.9"),
    ("2001:db8::1", "2001:db8::/64"),
    ("2001:db8:0:0:ffff:ffff:ffff:ffff", "2001:db8::/64"),
    ("2001:db8:0:1::1", "2001:db8:0:1::/64"),
    ("::ffff:198.51.100.7", "198.51.100.7"),  # IPv4-mapped counts as the IPv4
])
def test_rate_limit_key_groups_ipv6_by_64(value, expected):
    assert rate_limit_key(parse_ip(value)) == expected


def test_rate_limit_key_prefix_is_configurable():
    assert rate_limit_key(ipaddress.ip_address("2001:db8:1:2:3::1"), 48) == "2001:db8:1::/48"


@pytest.mark.parametrize("value", ["", "x", "1.2.3.4, 5.6.7.8", "256.0.0.1", "testclient", "2001:db8::/64"])
def test_parse_ip_rejects_non_ips(value):
    assert parse_ip(value) is None


# ---------- JSONL repository: size cap, disk space, retention ----------
def _msg(when, name="Ana"):
    return ContactMessage(name, "a@b.cl", "Hola", when)


def test_repository_size_cap(tmp_path):
    repo = JsonlContactRepository(tmp_path / "c.jsonl", max_bytes=200)
    repo.save(_msg(NOW))
    repo.save(_msg(NOW))
    with pytest.raises(ContactStorageFull):
        while True:
            repo.save(_msg(NOW))
    assert (tmp_path / "c.jsonl").stat().st_size < 200 + 200  # stopped at the first write past the cap


def test_repository_readiness_checks_free_disk(tmp_path, monkeypatch):
    repo = JsonlContactRepository(tmp_path / "c.jsonl", min_free_bytes=10 * 1024 * 1024)
    usage = namedtuple("usage", "total used free")
    monkeypatch.setattr(jsonl_contact_repository.shutil, "disk_usage", lambda _: usage(100, 100, 1024))
    assert not repo.is_writable()
    monkeypatch.setattr(jsonl_contact_repository.shutil, "disk_usage", lambda _: usage(100, 0, 50 * 1024 * 1024))
    assert repo.is_writable()


def test_repository_purge_is_atomic_and_keeps_recent_and_unknown_lines(tmp_path):
    path = tmp_path / "c.jsonl"
    repo = JsonlContactRepository(path)
    repo.save(_msg(NOW - timedelta(days=500), "old1"))
    repo.save(_msg(NOW - timedelta(days=400), "old2"))
    with path.open("a", encoding="utf-8", newline="\n") as f:
        f.write("not json\n")
    repo.save(_msg(NOW - timedelta(days=10), "recent"))
    assert repo.purge_received_before(NOW - timedelta(days=365)) == 2
    lines = path.read_text(encoding="utf-8").splitlines()
    assert lines[0] == "not json" and json.loads(lines[1])["name"] == "recent"
    assert [p.name for p in tmp_path.iterdir()] == ["c.jsonl"]  # no temp file left behind
    if sys.platform != "win32":
        assert oct(os.stat(path).st_mode & 0o777) == "0o600"  # still private after the rewrite
    assert repo.purge_received_before(NOW - timedelta(days=365)) == 0  # nothing left to purge
    repo.save(_msg(NOW, "after"))  # appending keeps working on the replaced file
    assert json.loads(path.read_text(encoding="utf-8").splitlines()[-1])["name"] == "after"


def test_repository_purge_without_file_or_with_fresh_head_is_a_noop(tmp_path):
    repo = JsonlContactRepository(tmp_path / "c.jsonl")
    assert repo.purge_received_before(NOW) == 0
    repo.save(_msg(NOW))
    mtime = (tmp_path / "c.jsonl").stat().st_mtime_ns
    assert repo.purge_received_before(NOW - timedelta(days=1)) == 0
    assert (tmp_path / "c.jsonl").stat().st_mtime_ns == mtime  # not rewritten


def test_repository_purge_wraps_os_errors(tmp_path):
    (tmp_path / "c.jsonl").mkdir()  # a directory where the file should be
    with pytest.raises(ContactStorageError):
        JsonlContactRepository(tmp_path / "c.jsonl").purge_received_before(NOW)


# ---------- retention use case ----------
class FakeRepo:
    def __init__(self, fail=False):
        self.cutoffs, self.fail = [], fail

    def purge_received_before(self, cutoff):
        if self.fail:
            raise ContactStorageError("read-only")
        self.cutoffs.append(cutoff)
        return 1


def test_retention_runs_at_most_once_a_day():
    clock = [NOW]
    repo = FakeRepo()
    purge = PurgeExpiredContacts(repo, 365, clock=lambda: clock[0])
    assert purge() == 1 and repo.cutoffs == [NOW - timedelta(days=365)]
    assert purge.run_if_due() == 0  # just ran
    clock[0] += timedelta(hours=23)
    assert purge.run_if_due() == 0
    clock[0] += timedelta(hours=1)
    assert purge.run_if_due() == 1 and len(repo.cutoffs) == 2


def test_retention_zero_keeps_everything_and_errors_are_logged(caplog):
    repo = FakeRepo()
    assert PurgeExpiredContacts(repo, 0, clock=lambda: NOW)() == 0 and repo.cutoffs == []
    assert PurgeExpiredContacts(FakeRepo(fail=True), 365, clock=lambda: NOW)() == 0
    assert "retention purge failed" in caplog.text


# ---------- notification ----------
def test_notify_owner_swallows_and_logs_failures(caplog):
    class Broken:
        def notify_new_message(self, received_at):
            raise OSError("https://hooks.example.com/T0/SECRET unreachable")

    with caplog.at_level(logging.WARNING):
        NotifyOwner(Broken(), clock=lambda: NOW)()
    assert "Contact notification failed: OSError" in caplog.text and "SECRET" not in caplog.text
    assert not NotifyOwner(None).enabled
    NotifyOwner(None)()  # disabled: no-op


def test_webhook_only_https():
    with pytest.raises(ValueError):
        WebhookNotifier("http://hooks.example.com/x")
    assert "secret" not in repr(WebhookNotifier("https://hooks.example.com/secret"))


def test_webhook_posts_no_personal_data_with_timeout(monkeypatch):
    sent = {}

    class Resp:
        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

        def read(self, n):
            return b""

    def fake_open(request, timeout):
        sent.update(url=request.full_url, body=request.data, method=request.get_method(), timeout=timeout)
        return Resp()

    monkeypatch.setattr(webhook_notifier._opener, "open", fake_open)
    WebhookNotifier("https://hooks.example.com/abc").notify_new_message(NOW)
    assert sent["method"] == "POST" and sent["timeout"] == 5.0 and sent["url"] == "https://hooks.example.com/abc"
    body = json.loads(sent["body"])
    assert set(body) == {"text", "content", "received_at"} and "Nuevo mensaje" in body["text"]


def test_webhook_refuses_redirects():
    handler = webhook_notifier._NoRedirect()
    assert handler.redirect_request(None, None, 302, "Found", {}, "http://evil.example") is None


# ---------- settings ----------
def test_contact_settings_from_env():
    s = Settings.from_env({
        "CONTACT_RATE_LIMIT": "3", "CONTACT_IPV6_PREFIX": "56", "CONTACT_GLOBAL_LIMIT": "0", "CONTACT_LOG_MAX_MB": "10",
        "CONTACT_RETENTION_DAYS": "180", "CONTACT_NOTIFY_WEBHOOK": " https://hooks.example.com/x ", "MIN_FREE_DISK_MB": "5",
    })
    assert (s.rate_limit, s.ipv6_prefix, s.global_rate_limit) == (3, 56, 0)
    assert s.contact_log_max_bytes == 10 * 1024 * 1024 and s.min_free_disk_bytes == 5 * 1024 * 1024
    assert s.contact_retention_days == 180 and s.contact_notify_webhook == "https://hooks.example.com/x"


def test_contact_settings_defaults():
    s = Settings.from_env({})
    assert (s.ipv6_prefix, s.global_rate_limit, s.global_rate_window_s) == (64, 100, 3600)
    assert s.contact_log_max_bytes == 50 * 1024 * 1024 and s.contact_retention_days == 365  # 12 months, as the form says
    assert s.contact_notify_webhook == ""


@pytest.mark.parametrize("env", [
    {"CONTACT_NOTIFY_WEBHOOK": "http://hooks.example.com/x"},
    {"CONTACT_NOTIFY_WEBHOOK": "hooks.example.com/x"},
    {"CONTACT_IPV6_PREFIX": "129"},
    {"CONTACT_RETENTION_DAYS": "-1"},
    {"CONTACT_LOG_MAX_MB": "fifty"},
])
def test_contact_settings_fail_fast(env):
    with pytest.raises(ValueError):
        Settings.from_env(env)
