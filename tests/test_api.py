"""Backend tests (pytest + FastAPI TestClient). Platform independent: run on Linux, macOS and Windows in CI.

Each test gets an isolated fake build (dist/), contact log and rate limiter, so nothing touches the real project.
"""
import base64
import gzip
import hashlib
import json
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import main  # noqa: E402

INLINE = "document.documentElement.dataset.x='1'"
VALID = {"name": "Ana", "email": "ana@example.com", "message": "Hola"}
IS_WINDOWS = sys.platform == "win32"


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
def client(dist, tmp_path, monkeypatch):
    monkeypatch.setattr(main, "FRONTEND_DIR", dist)
    monkeypatch.setattr(main, "CONTACT_LOG", tmp_path / "data" / "contact.jsonl")
    (tmp_path / "data").mkdir()
    monkeypatch.setattr(main, "contact_limiter", main.RateLimiter(main.RATE_LIMIT, main.RATE_WINDOW_S))
    monkeypatch.setattr(main, "_csp_cache", {"mtime": None, "value": None})
    return TestClient(main.app)


def stored(tmp_path):
    path = tmp_path / "data" / "contact.jsonl"
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()] if path.exists() else []


# ---------------- GET /api/status ----------------
def test_status_ok(client):
    r = client.get("/api/status")
    assert r.status_code == 200 and r.json() == {"status": "ok"}
    assert r.headers["cache-control"] == "no-store"
    assert "content-security-policy" in r.headers


def test_status_head_is_json_not_spa(client):
    r = client.head("/api/status")
    assert r.status_code == 200 and r.headers["content-type"].startswith("application/json")


def test_status_degraded_without_build(client, monkeypatch, tmp_path):
    monkeypatch.setattr(main, "FRONTEND_DIR", tmp_path / "missing")
    assert client.get("/api/status").status_code == 503


def test_status_ok_without_build_in_development(client, monkeypatch, tmp_path):
    monkeypatch.setattr(main, "FRONTEND_DIR", tmp_path / "missing")
    monkeypatch.setattr(main, "IS_DEV", True)
    assert client.get("/api/status").status_code == 200


# ---------------- POST /api/contact ----------------
def test_contact_stores_message(client, tmp_path):
    r = client.post("/api/contact", json=VALID)
    assert r.status_code == 200 and r.json() == {"status": "ok"}
    [entry] = stored(tmp_path)
    assert entry["email"] == "ana@example.com" and entry["received_at"]
    raw = (tmp_path / "data" / "contact.jsonl").read_bytes()
    assert raw.endswith(b"}\n") and b"\r\n" not in raw  # same JSONL on every OS


@pytest.mark.skipif(IS_WINDOWS, reason="POSIX permissions")
def test_contact_log_is_private(client, tmp_path):
    client.post("/api/contact", json=VALID)
    assert oct(os.stat(tmp_path / "data" / "contact.jsonl").st_mode & 0o777) == "0o600"


@pytest.mark.parametrize("email", ["a@.", "a@b.", "a@@b.cl", "sin-arroba", "a b@c.cl", "@b.cl", "a@b..cl"])
def test_contact_rejects_invalid_email(client, tmp_path, email):
    r = client.post("/api/contact", json={**VALID, "email": email})
    assert r.status_code == 422 and r.json()["fields"] == ["email"]
    assert stored(tmp_path) == []


@pytest.mark.parametrize("email", ["ana.perez+rrhh@mail.empresa.co.uk", "x@y.cl", "ÑANDÚ@correo.cl"])
def test_contact_accepts_valid_email(client, email):
    assert client.post("/api/contact", json={**VALID, "email": email}).status_code == 200


def test_contact_strips_bidi_and_controls_keeps_emoji_and_newlines(client, tmp_path):
    r = client.post("/api/contact", json={"name": "Ana‮ 👨‍👩‍👧\x07", "email": "a@b.cl", "message": "Hola,\n\tok 👍🏽\x00"})
    assert r.status_code == 200
    [entry] = stored(tmp_path)
    assert entry["name"] == "Ana 👨‍👩‍👧" and entry["message"] == "Hola,\n\tok 👍🏽"


def test_contact_blank_after_cleanup_is_invalid(client):
    r = client.post("/api/contact", json={**VALID, "name": "‮‭ "})
    assert r.status_code == 422 and r.json()["fields"] == ["name"]


def test_contact_limits(client):
    assert client.post("/api/contact", json={**VALID, "message": "x" * 5001}).status_code == 422
    assert client.post("/api/contact", json={**VALID, "name": 123}).status_code == 422
    assert client.post("/api/contact", content=b"{no json", headers={"Content-Type": "application/json"}).status_code == 422
    # text/plain = "simple" cross-site request without CORS preflight → must be rejected
    assert client.post("/api/contact", content=json.dumps(VALID), headers={"Content-Type": "text/plain"}).status_code == 422


def test_contact_body_size_guards_keep_security_headers(client):
    r = client.post("/api/contact", content=b"x", headers={"Content-Length": "99999", "Content-Type": "application/json"})
    assert r.status_code == 413
    assert r.headers["x-content-type-options"] == "nosniff" and "content-security-policy" in r.headers
    r = client.post("/api/contact", content=iter([json.dumps(VALID).encode()]), headers={"Content-Type": "application/json"})
    assert r.status_code == 411


def test_contact_honeypot_answers_ok_but_discards(client, tmp_path):
    assert client.post("/api/contact", json={**VALID, "website": "spam.example"}).status_code == 200
    assert stored(tmp_path) == []


def test_contact_rate_limit(client):
    codes = [client.post("/api/contact", json=VALID).status_code for _ in range(6)]
    assert codes == [200] * 5 + [429]
    r = client.post("/api/contact", json=VALID)
    assert int(r.headers["retry-after"]) > 0


def test_contact_spoofed_forwarded_for_does_not_bypass_limit(client, monkeypatch):
    monkeypatch.setattr(main, "TRUST_PROXY", True)
    codes = [
        client.post("/api/contact", json=VALID, headers={"X-Forwarded-For": f"10.0.{i}.1"}).status_code
        for i in range(6)
    ]
    assert codes[-1] == 429


def test_contact_cdn_header_only_when_configured(client, monkeypatch):
    monkeypatch.setattr(main, "TRUST_PROXY", True)
    monkeypatch.setattr(main, "CLIENT_IP_HEADER", "cf-connecting-ip")
    codes = [
        client.post("/api/contact", json=VALID, headers={"CF-Connecting-IP": f"203.0.113.{i}"}).status_code
        for i in range(6)
    ]
    assert codes == [200] * 6  # distinct real visitors behind the CDN keep separate quotas


def test_rate_limiter_memory_is_bounded():
    rl = main.RateLimiter(5, 600, max_keys=1000)
    for i in range(5000):
        rl.check(f"ip{i}")
    assert len(rl.hits) <= 1000
    same = main.RateLimiter(5, 600)
    assert [same.check("1.1.1.1") for _ in range(6)][-1] > 0


# ---------------- /api/{rest} ----------------
@pytest.mark.parametrize("method,path,code", [
    ("GET", "/api/nope", 404), ("GET", "/api", 404), ("HEAD", "/api/nope", 404),
    ("POST", "/api/status", 405), ("DELETE", "/api/contact", 405), ("GET", "/api/contact", 405),
])
def test_api_never_returns_the_spa(client, method, path, code):
    r = client.request(method, path)
    assert r.status_code == code
    assert not r.headers.get("content-type", "").startswith("text/html")
    if code == 405:
        assert r.headers["allow"]


def test_cors_dev_origin_not_allowed_in_production(client):
    r = client.get("/api/status", headers={"Origin": "http://localhost:5173"})
    assert "access-control-allow-origin" not in r.headers


# ---------------- /{path}: SPA + static ----------------
def test_index_has_csp_hash_and_precompressed(client):
    r = client.get("/", headers={"Accept-Encoding": "br"})
    assert r.status_code == 200 and r.headers["content-encoding"] == "br" and r.headers["cache-control"] == "no-cache"
    digest = base64.b64encode(hashlib.sha256(INLINE.encode()).digest()).decode()
    assert f"'sha256-{digest}'" in r.headers["content-security-policy"]


def test_recruiter_link_and_index_still_200(client):
    assert client.get("/?vista=rrhh").status_code == 200
    assert client.get("/index.html").status_code == 200


def test_asset_mime_and_cache(client):
    r = client.get("/assets/app-abc123.js", headers={"Accept-Encoding": "identity"})
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/javascript")  # never text/plain (Windows registry)
    assert "immutable" in r.headers["cache-control"]
    f = client.get("/fonts/inter.woff2")
    assert f.headers["content-type"] == "font/woff2" and "2592000" in f.headers["cache-control"]
    assert client.get("/sw.js").headers["cache-control"] == "no-cache"


def test_accept_encoding_q0_is_respected(client):
    r = client.get("/assets/app-abc123.js", headers={"Accept-Encoding": "gzip;q=0, identity"})
    assert r.headers.get("content-encoding") in (None, "")
    r = client.get("/assets/app-abc123.js", headers={"Accept-Encoding": "gzip"})
    assert r.headers["content-encoding"] == "gzip"


def test_conditional_request_304(client):
    etag = client.get("/assets/app-abc123.js").headers["etag"]
    assert client.get("/assets/app-abc123.js", headers={"If-None-Match": etag}).status_code == 304


@pytest.mark.parametrize("path", ["/assets/old-deploy-XYZ.js", "/img/no.webp", "/fonts/no.woff2", "/favicon.ico"])
def test_missing_static_file_is_404_not_html(client, path):
    r = client.get(path)
    assert r.status_code == 404 and not r.headers.get("content-type", "").startswith("text/html")


def test_unknown_page_still_renders_app_with_404(client):
    r = client.get("/ruta/inexistente")
    assert r.status_code == 404 and b"data-shell-root" in r.content


@pytest.mark.parametrize("path", ["/%00", "/a%00.js", "/%2e%2e/main.py", "/..%2fmain.py", "/..%5cmain.py", "/README.md", "/index.html.br"])
def test_hostile_paths(client, path):
    r = client.get(path)
    assert r.status_code in (200, 404)
    assert b"FastAPI" not in r.content and b"# private" not in r.content and r.content != b"fake-brotli"


def test_dist_as_symlink(dist, tmp_path, monkeypatch):
    link = tmp_path / "current"
    try:
        link.symlink_to(dist, target_is_directory=True)
    except (OSError, NotImplementedError):
        pytest.skip("symlinks not permitted (Windows without developer mode)")
    monkeypatch.setattr(main, "FRONTEND_DIR", link)
    monkeypatch.setattr(main, "_csp_cache", {"mtime": None, "value": None})
    r = TestClient(main.app).get("/assets/app-abc123.js", headers={"Accept-Encoding": "identity"})
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/javascript")
