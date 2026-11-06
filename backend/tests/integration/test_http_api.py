"""HTTP adapter end to end (FastAPI TestClient): API, security headers, proxies and the compiled SPA."""
import base64
import hashlib
import json
import os
import sys

import pytest
from fastapi.testclient import TestClient

from app.adapters.inbound.http.proxy import with_proxy_headers
from app.main import create_app
from tests.conftest import INLINE, VALID

IS_WINDOWS = sys.platform == "win32"


# ---------------- GET /api/status ----------------
def test_status_ok(client):
    r = client.get("/api/status")
    assert r.status_code == 200 and r.json() == {"status": "ok"}
    assert r.headers["cache-control"] == "no-store"
    assert "content-security-policy" in r.headers


def test_status_head_is_json_not_spa(client):
    r = client.head("/api/status")
    assert r.status_code == 200 and r.headers["content-type"].startswith("application/json")


def test_status_degraded_without_build(make_client, tmp_path):
    assert make_client(frontend_dir=tmp_path / "missing").get("/api/status").status_code == 503


def test_status_ok_without_build_in_development(make_client, tmp_path):
    client = make_client(frontend_dir=tmp_path / "missing", app_env="development")
    assert client.get("/api/status").status_code == 200


def test_status_degraded_when_log_not_writable(make_client, tmp_path):
    assert make_client(contact_log=tmp_path / "no-such-dir" / "c.jsonl").get("/api/status").status_code == 503


# ---------------- POST /api/contact ----------------
def test_contact_stores_message(client, settings, stored):
    r = client.post("/api/contact", json=VALID)
    assert r.status_code == 200 and r.json() == {"status": "ok"}
    [entry] = stored()
    assert entry["email"] == "ana@example.com" and entry["received_at"]
    assert list(entry) == ["name", "email", "message", "received_at"]
    raw = settings.contact_log.read_bytes()
    assert raw.endswith(b"}\n") and b"\r\n" not in raw  # same JSONL on every OS


@pytest.mark.skipif(IS_WINDOWS, reason="POSIX permissions")
def test_contact_log_is_private(client, settings):
    client.post("/api/contact", json=VALID)
    assert oct(os.stat(settings.contact_log).st_mode & 0o777) == "0o600"


def test_contact_storage_failure_is_500(make_client, tmp_path):
    r = make_client(contact_log=tmp_path / "no-such-dir" / "c.jsonl").post("/api/contact", json=VALID)
    assert r.status_code == 500 and r.json() == {"detail": "No se pudo guardar el mensaje."}


@pytest.mark.parametrize("email", ["a@.", "a@b.", "a@@b.cl", "sin-arroba", "a b@c.cl", "@b.cl", "a@b..cl"])
def test_contact_rejects_invalid_email(client, stored, email):
    r = client.post("/api/contact", json={**VALID, "email": email})
    assert r.status_code == 422 and r.json()["fields"] == ["email"]
    assert stored() == []


@pytest.mark.parametrize("email", ["ana.perez+rrhh@mail.empresa.co.uk", "x@y.cl", "ÑANDÚ@correo.cl"])
def test_contact_accepts_valid_email(client, email):
    assert client.post("/api/contact", json={**VALID, "email": email}).status_code == 200


def test_contact_strips_bidi_and_controls_keeps_emoji_and_newlines(client, stored):
    r = client.post("/api/contact", json={"name": "Ana\u202e 👨\u200d👩\u200d👧\x07", "email": "a@b.cl", "message": "Hola,\n\tok 👍🏽\x00"})
    assert r.status_code == 200
    [entry] = stored()
    assert entry["name"] == "Ana 👨\u200d👩\u200d👧" and entry["message"] == "Hola,\n\tok 👍🏽"


def test_contact_blank_after_cleanup_is_invalid(client):
    r = client.post("/api/contact", json={**VALID, "name": "\u202e\u202d "})
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


def test_contact_honeypot_answers_ok_but_discards(client, stored):
    assert client.post("/api/contact", json={**VALID, "website": "spam.example"}).status_code == 200
    assert stored() == []


def test_contact_rate_limit(client):
    codes = [client.post("/api/contact", json=VALID).status_code for _ in range(6)]
    assert codes == [200] * 5 + [429]
    r = client.post("/api/contact", json=VALID)
    assert int(r.headers["retry-after"]) > 0


def test_contact_spoofed_forwarded_for_does_not_bypass_limit(make_client):
    client = make_client(trust_proxy=True)
    codes = [
        client.post("/api/contact", json=VALID, headers={"X-Forwarded-For": f"10.0.{i}.1"}).status_code
        for i in range(6)
    ]
    assert codes[-1] == 429


def test_contact_cdn_header_only_when_configured(make_client):
    client = make_client(trust_proxy=True, client_ip_header="cf-connecting-ip")
    codes = [
        client.post("/api/contact", json=VALID, headers={"CF-Connecting-IP": f"203.0.113.{i}"}).status_code
        for i in range(6)
    ]
    assert codes == [200] * 6  # distinct real visitors behind the CDN keep separate quotas


def test_proxy_entrypoint_uses_last_untrusted_hop(settings):
    # the server runs app.main:asgi; behind a proxy (TestClient's peer is "testclient") the proxy APPENDS the real IP,
    # so rotating the first X-Forwarded-For value must not open new quotas
    proxied = TestClient(with_proxy_headers(create_app(settings), "testclient"))
    codes = [
        proxied.post("/api/contact", json=VALID, headers={"X-Forwarded-For": f"10.0.{i}.1, 198.51.100.7"}).status_code
        for i in range(6)
    ]
    assert codes == [200] * 5 + [429]


def test_proxy_entrypoint_untrusted_peer_ignores_forwarded_for(settings):
    direct = TestClient(with_proxy_headers(create_app(settings), "127.0.0.1"))
    codes = [
        direct.post("/api/contact", json=VALID, headers={"X-Forwarded-For": f"10.0.{i}.1"}).status_code
        for i in range(6)
    ]
    assert codes[-1] == 429  # a client that is not the proxy can't choose its own IP


def test_security_headers_on_early_rejections(client, settings):
    r = client.post("/api/contact", content=b"x" * (settings.max_body_bytes + 1), headers={"Content-Type": "application/json"})
    assert r.status_code == 413
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["cache-control"] == "no-store"
    assert "content-security-policy" in r.headers


def test_hsts_only_when_enabled(client, make_client, settings):
    assert "strict-transport-security" not in client.get("/api/status").headers
    # same gradual value Caddy sends (config/security-headers.json "hsts"), not a hard-coded 1-year max-age
    expected = json.loads(settings.security_headers_file.read_text(encoding="utf-8"))["hsts"]
    assert make_client(enable_hsts=True).get("/api/status").headers["strict-transport-security"] == expected


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


def test_cors_dev_origin_allowed_in_development(make_client):
    r = make_client(app_env="development").get("/api/status", headers={"Origin": "http://localhost:5173"})
    assert r.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_docs_only_in_development(client, make_client):
    assert client.get("/docs").status_code == 404
    assert make_client(app_env="development").get("/docs").status_code == 200


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


@pytest.mark.parametrize("path", ["/assets/old-deploy-XYZ.js", "/img/no.webp", "/fonts/no.woff2", "/favicon.ico", "/cv/viejo.pdf"])
def test_missing_static_file_is_404_not_html(client, path):
    r = client.get(path)
    assert r.status_code == 404 and not r.headers.get("content-type", "").startswith("text/html")


def test_unknown_page_still_renders_app_with_404(client):
    r = client.get("/ruta/inexistente")
    assert r.status_code == 404 and b"data-shell-root" in r.content


def test_frontend_not_built_is_503_json(make_client, tmp_path):
    r = make_client(frontend_dir=tmp_path / "missing").get("/")
    assert r.status_code == 503 and r.headers["content-type"].startswith("application/json")


@pytest.mark.parametrize("path", ["/%00", "/a%00.js", "/%2e%2e/main.py", "/..%2fmain.py", "/..%5cmain.py", "/README.md", "/index.html.br"])
def test_hostile_paths(client, path):
    r = client.get(path)
    assert r.status_code in (200, 404)
    assert b"FastAPI" not in r.content and b"# private" not in r.content and r.content != b"fake-brotli"


def test_dist_as_symlink(dist, tmp_path, make_client):
    link = tmp_path / "current"
    try:
        link.symlink_to(dist, target_is_directory=True)
    except (OSError, NotImplementedError):
        pytest.skip("symlinks not permitted (Windows without developer mode)")
    r = make_client(frontend_dir=link).get("/assets/app-abc123.js", headers={"Accept-Encoding": "identity"})
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/javascript")


def test_cv_pdf_is_served_as_pdf(client, dist):
    (dist / "cv").mkdir()
    (dist / "cv" / "CV.pdf").write_bytes(b"%PDF-1.7 fake")
    r = client.get("/cv/CV.pdf")
    assert r.status_code == 200 and r.headers["content-type"] == "application/pdf" and r.content.startswith(b"%PDF")
    # unversioned file name: always revalidated, same policy as deploy/Caddyfile (DEP-8)
    assert r.headers["cache-control"] == "no-cache"


def test_missing_cv_is_json_404_no_store(client):
    r = client.get("/cv/viejo.pdf")
    assert r.status_code == 404 and r.headers["content-type"].startswith("application/json")
    assert r.headers["cache-control"] == "no-store"


def test_null_byte_404_is_not_cached(client):
    r = client.get("/%00")
    assert r.status_code == 404 and r.headers["cache-control"] == "no-store"


# ---------------- 500: security headers even outside the middleware (SRV-5) ----------------
def test_unhandled_error_keeps_security_headers(settings):
    app = create_app(settings)

    def boom():
        raise RuntimeError("boom")

    app.add_api_route("/api/boom", boom)
    app.router.routes.insert(0, app.router.routes.pop())  # before the /api catch-all
    r = TestClient(app, raise_server_exceptions=False).get("/api/boom")
    assert r.status_code == 500 and r.json() == {"detail": "Error interno del servidor."}
    assert r.headers["x-content-type-options"] == "nosniff"
    assert "content-security-policy" in r.headers and r.headers["x-frame-options"] == "DENY"
    assert r.headers["cache-control"] == "no-store"


# ---------------- abuse: IPv6 rotation, global cap, log size (CT-1) ----------------
def test_ipv6_rotation_inside_a_64_shares_one_quota(settings):
    # the AUDITORIA-3 reproduction: 30 POSTs rotating 2001:db8::{i} used to give 30 times 200
    proxied = TestClient(with_proxy_headers(create_app(settings), "testclient"))
    codes = [
        proxied.post("/api/contact", json=VALID, headers={"X-Forwarded-For": f"2001:db8::{i:x}"}).status_code
        for i in range(30)
    ]
    assert codes == [200] * 5 + [429] * 25
    # another /64 is another subscriber: its own quota
    assert proxied.post("/api/contact", json=VALID, headers={"X-Forwarded-For": "2001:db8:0:1::1"}).status_code == 200


def test_ipv6_rotation_through_cdn_header(make_client):
    client = make_client(trust_proxy=True, client_ip_header="cf-connecting-ip")
    codes = [
        client.post("/api/contact", json=VALID, headers={"CF-Connecting-IP": f"2001:db8:aa:bb:{i:x}::1"}).status_code
        for i in range(30)
    ]
    assert codes == [200] * 5 + [429] * 25


@pytest.mark.parametrize("bogus", ["not-an-ip", "1.2.3.4, 5.6.7.8", "999.1.1.1", ""])
def test_cdn_header_must_be_a_valid_ip(make_client, bogus):
    client = make_client(trust_proxy=True, client_ip_header="cf-connecting-ip")
    codes = [
        client.post("/api/contact", json=VALID, headers={"CF-Connecting-IP": f"{bogus}{i}" if bogus else ""}).status_code
        for i in range(6)
    ]
    assert codes == [200] * 5 + [429]  # made-up values fall back to the peer: one quota, not one per value


def test_global_quota_caps_ip_rotation(make_client, stored):
    client = make_client(trust_proxy=True, client_ip_header="cf-connecting-ip", global_rate_limit=3)
    codes = [
        client.post("/api/contact", json=VALID, headers={"CF-Connecting-IP": f"203.0.113.{i}"}).status_code
        for i in range(5)
    ]
    assert codes == [200, 200, 200, 429, 429] and len(stored()) == 3
    r = client.post("/api/contact", json=VALID, headers={"CF-Connecting-IP": "198.51.100.1"})
    assert r.status_code == 429 and int(r.headers["retry-after"]) > 0
    # honeypot spam is discarded before the global quota: bots can't burn the real visitors' quota
    spam = client.post("/api/contact", json={**VALID, "website": "x"}, headers={"CF-Connecting-IP": "198.51.100.2"})
    assert spam.status_code == 200


def test_contact_log_size_cap_is_503_with_clear_detail(make_client, settings, stored):
    settings.contact_log.write_text('{"received_at": "2099-01-01T00:00:00+00:00"}\n' * 40, encoding="utf-8")
    size = settings.contact_log.stat().st_size
    r = make_client(contact_log_max_bytes=size).post("/api/contact", json=VALID)
    assert r.status_code == 503 and "lleno" in r.json()["detail"]
    assert r.headers["retry-after"] and settings.contact_log.stat().st_size == size  # nothing written
    assert make_client(contact_log_max_bytes=size + 10_000).post("/api/contact", json=VALID).status_code == 200


def test_status_degraded_when_disk_almost_full(make_client):
    assert make_client(min_free_disk_bytes=1 << 62).get("/api/status").status_code == 503


# ---------------- retention (CT-2) and notification (CT-3) ----------------
def test_expired_messages_are_purged_at_startup(make_client, settings, stored):
    old = {"name": "Old", "email": "o@b.cl", "message": "m", "received_at": "2020-01-01T00:00:00+00:00"}
    new = {"name": "New", "email": "n@b.cl", "message": "m", "received_at": "2099-01-01T00:00:00+00:00"}
    settings.contact_log.write_text(json.dumps(old) + "\n" + json.dumps(new) + "\n", encoding="utf-8")
    with make_client(contact_retention_days=365):  # `with` runs the lifespan (startup)
        pass
    assert [e["name"] for e in stored()] == ["New"]


def test_notification_runs_in_background_and_failures_never_fail_the_request(make_client, monkeypatch, caplog):
    calls = []

    class FakeNotifier:
        def __init__(self, url):
            self.url = url

        def notify_new_message(self, received_at):
            calls.append(received_at)
            raise TimeoutError("webhook down")

    monkeypatch.setattr("app.main.WebhookNotifier", FakeNotifier)
    client = make_client(contact_notify_webhook="https://hooks.example.com/secret-token")
    r = client.post("/api/contact", json=VALID)
    assert r.status_code == 200 and len(calls) == 1
    assert "Contact notification failed: TimeoutError" in caplog.text
    assert "secret-token" not in caplog.text and "Hola" not in caplog.text
    # honeypot: nothing stored, nobody notified
    client.post("/api/contact", json={**VALID, "website": "x"})
    assert len(calls) == 1


def test_csp_hashes_every_inline_script_with_or_without_attributes(make_client, dist):
    ld = '{"@type":"Person"}'
    (dist / "index.html").write_text(
        f'<html><head><script>{INLINE}</script><script type="application/ld+json">{ld}</script>'
        '<script type="module" crossorigin src="/assets/app-abc123.js"></script></head></html>',
        encoding="utf-8",
    )
    csp = make_client().get("/").headers["content-security-policy"]
    for body in (INLINE, ld):
        assert "'sha256-" + base64.b64encode(hashlib.sha256(body.encode()).digest()).decode() + "'" in csp
    assert csp.count("'sha256-") == 2  # the src= script is external: no hash
