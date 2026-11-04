"""Shared fixtures. Each test gets an isolated fake build (dist/), contact log and app instance (fresh rate limiter),
so nothing touches the real project. Platform independent: runs on Linux, macOS and Windows in CI.
"""
import gzip
import json
from dataclasses import replace

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app

INLINE = "document.documentElement.dataset.x='1'"
VALID = {"name": "Ana", "email": "ana@example.com", "message": "Hola"}


@pytest.fixture
def dist(tmp_path):
    d = tmp_path / "dist"
    (d / "assets").mkdir(parents=True)
    (d / "fonts").mkdir()
    (d / "index.html").write_text(f'<!doctype html><html><head><script>{INLINE}</script></head><body><div data-shell-root></div></body></html>', encoding="utf-8")
    (d / "index.html.br").write_bytes(b"fake-brotli")
    (d / "assets" / "app-abc123.js").write_text("export default 1;", encoding="utf-8")
    (d / "assets" / "app-abc123.js.gz").write_bytes(gzip.compress(b"export default 1;"))
    (d / "fonts" / "inter.woff2").write_bytes(b"wOF2")
    (d / "sw.js").write_text("self.addEventListener('fetch',()=>{})", encoding="utf-8")
    (d / "robots.txt").write_text("User-agent: *\n", encoding="utf-8")
    (d / "README.md").write_text("# private", encoding="utf-8")
    return d


@pytest.fixture
def settings(dist, tmp_path):
    (tmp_path / "data").mkdir()
    return Settings(frontend_dir=dist, contact_log=tmp_path / "data" / "contact.jsonl")


@pytest.fixture
def make_client(settings):
    """make_client(**overrides) → TestClient over a fresh app built with those settings."""

    def build(**overrides):
        return TestClient(create_app(replace(settings, **overrides)))

    return build


@pytest.fixture
def client(make_client):
    return make_client()


@pytest.fixture
def stored(settings):
    """Messages persisted so far by the app under test."""

    def read():
        path = settings.contact_log
        return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()] if path.exists() else []

    return read
