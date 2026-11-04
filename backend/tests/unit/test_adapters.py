"""Outbound adapters and configuration, each against its contract."""
import json
from datetime import datetime, timezone
from pathlib import Path

import pytest

from app.adapters.inbound.http.static_files import accepted_encodings
from app.adapters.outbound.jsonl_contact_repository import JsonlContactRepository
from app.adapters.outbound.memory_rate_limiter import InMemoryRateLimiter
from app.config import Settings
from app.domain.contact import ContactMessage
from app.domain.errors import ContactStorageError


def test_rate_limiter_memory_is_bounded():
    rl = InMemoryRateLimiter(5, 600, max_keys=1000)
    for i in range(5000):
        rl.check(f"ip{i}")
    assert len(rl.hits) <= 1000
    same = InMemoryRateLimiter(5, 600)
    assert [same.check("1.1.1.1") for _ in range(6)][-1] > 0


def test_jsonl_repository_appends_one_line_per_message(tmp_path):
    repo = JsonlContactRepository(tmp_path / "c.jsonl")
    when = datetime(2026, 1, 1, tzinfo=timezone.utc)
    repo.save(ContactMessage("Ñandú", "a@b.cl", "Hola 👋", when))
    repo.save(ContactMessage("Bob", "b@b.cl", "Hi", when))
    lines = (tmp_path / "c.jsonl").read_text(encoding="utf-8").splitlines()
    assert [json.loads(line)["name"] for line in lines] == ["Ñandú", "Bob"]
    assert json.loads(lines[0])["received_at"] == "2026-01-01T00:00:00+00:00"
    assert repo.is_writable()


def test_jsonl_repository_wraps_os_errors(tmp_path):
    repo = JsonlContactRepository(tmp_path / "missing" / "c.jsonl")
    assert not repo.is_writable()
    with pytest.raises(ContactStorageError):
        repo.save(ContactMessage("A", "a@b.cl", "m", datetime.now(timezone.utc)))


@pytest.mark.parametrize("header,expected", [
    ("br, gzip", {"br", "gzip"}),
    ("gzip;q=0, identity", {"identity"}),
    ("gzip;q=bad", set()),
    ("", set()),
])
def test_accepted_encodings(header, expected):
    assert accepted_encodings(header) == expected


def test_settings_from_env():
    s = Settings.from_env({
        "APP_ENV": "Development", "PORT": "9000", "CORS_ORIGINS": " https://a.cl , ,https://b.cl",
        "TRUST_PROXY": "1", "CLIENT_IP_HEADER": "CF-Connecting-IP", "CONTACT_LOG": "/data/c.jsonl",
        "FRONTEND_DIST": "/app/dist",
    })
    assert s.is_dev and s.port == 9000 and s.trust_proxy and s.client_ip_header == "cf-connecting-ip"
    assert s.allowed_origins == ["http://localhost:5173", "http://127.0.0.1:5173", "https://a.cl", "https://b.cl"]
    assert s.contact_log == Path("/data/c.jsonl") and s.frontend_dir == Path("/app/dist")


def test_settings_defaults_point_inside_the_repo():
    s = Settings.from_env({})
    assert not s.is_dev and not s.trust_proxy and s.allowed_origins == []
    assert s.security_headers_file.is_file()  # config/security-headers.json
    assert s.frontend_dir.parts[-2:] == ("frontend", "dist")
