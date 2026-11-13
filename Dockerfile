# syntax=docker/dockerfile:1.7
# Multi-stage build. Targets:
#   web → Caddy: serves dist/ (precompressed .br/.gz, HTTP/2 + HTTP/3, automatic TLS) and proxies /api/*
#   api → FastAPI on Granian (Rust HTTP server, uvloop), non-root, read-only filesystem
# The frontend is compiled once (stage "frontend") and shared by both targets.
# Base images are pinned by tag AND digest (a re-pushed tag can't change the build); the full reference is written
# in each FROM so Dependabot (.github/dependabot.yml) can bump tag + digest together. Versions: node 24, python 3.14,
# uv 0.13.7, caddy ≥ 2.11 (2.10.x answers precompressed files with "206 Partial Content" to requests without Range).

# ---------- 1. frontend: npm ci + full build (vite, SSR prerender, br/gz, CSP for Caddy) ----------
# Same layout as the repository (/build/frontend, /build/config, /build/deploy): the build scripts run unchanged
FROM node:24-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9 AS frontend
WORKDIR /build/frontend
ENV npm_config_update_notifier=false
# dependencies first: this layer is reused while package*.json do not change
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund
COPY config /build/config
COPY frontend/index.html frontend/vite.config.js ./
COPY frontend/public ./public
COPY frontend/scripts ./scripts
COPY frontend/src ./src
# frontend/scripts/deploy-headers.mjs writes /build/deploy/security-headers.caddy (CSP with the inline-script hash of THIS build)
RUN npm run build

# ---------- 2. python dependencies in an isolated venv ----------
# uv (Rust) installs the exact, hash-verified versions from backend/requirements.lock: a tampered or re-published
# wheel fails the build, and every build gets the same starlette/pydantic the tests ran against
FROM ghcr.io/astral-sh/uv:0.13.8@sha256:5cc1805e2426484abca4ad46ea783bab281fdb225fd82d8ce6d66a81254bac85 AS uv
FROM python:3.14-slim@sha256:af8a5aa14780025dbfbcfbc81bd8a91ebd87711dd5b0f48ed71090949dd7cb1d AS api-deps
COPY --from=uv /uv /usr/local/bin/uv
ENV UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never
RUN uv venv /opt/venv --python /usr/local/bin/python3
COPY backend/requirements.lock .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --python /opt/venv/bin/python --require-hashes -r requirements.lock

# ---------- 3. api: runtime image ----------
FROM python:3.14-slim@sha256:af8a5aa14780025dbfbcfbc81bd8a91ebd87711dd5b0f48ed71090949dd7cb1d AS api
ENV PATH=/opt/venv/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_ENV=production \
    TRUST_PROXY=1 \
    FORWARDED_ALLOW_IPS=* \
    CONTACT_LOG=/data/contact_messages.jsonl \
    FRONTEND_DIST=/app/dist \
    SECURITY_HEADERS_FILE=/app/config/security-headers.json
RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin app \
    && mkdir -p /data && chown app:app /data
WORKDIR /app
COPY --from=api-deps /opt/venv /opt/venv
# hexagonal package: app/{domain,application,adapters} + composition root app/main.py
COPY backend/app ./app
COPY config/security-headers.json ./config/
# dist/ inside the API too: CSP hash computation and SPA fallback keep working if Caddy is bypassed
COPY --from=frontend /build/frontend/dist ./dist
# contact messages go to CONTACT_LOG=/data/… (persistent volume); /app stays read-only
RUN python -m compileall -q /app/app
USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/status', timeout=2).status == 200 else 1)"]
# - app.main:asgi = the app behind the X-Forwarded-For handler (TRUST_PROXY=1). FORWARDED_ALLOW_IPS=*: only Caddy can
#   reach this port (no published ports) and Caddy overwrites X-Forwarded-For with the real peer address
# - 1 worker on purpose: the contact rate limiter lives in process memory (N workers = N× the limit)
# - granian never closes idle HTTP/1 keep-alive connections first, so Caddy's 2 min pool can't hit a closed one (502s)
# - no access log here (granian's default): Caddy is the edge and writes the only access log, as JSON lines on
#   stdout (`log` in deploy/Caddyfile → docker compose logs web). granian always sends "server: granian"; Caddy strips
#   it (-Server in security-headers.caddy)
CMD ["granian", "--interface", "asgi", \
     "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "1", "--loop", "uvloop", "--no-ws", \
     "--log-level", "warning", \
     "app.main:asgi"]

# ---------- 4. web: Caddy with the static build ----------
FROM caddy:2.11-alpine@sha256:ae5e525ca6773b0a4ce579c774cb39b3147e1576084139229517bdbcfe3ed812 AS web
# non-root (fixed uid/gid 10002): /data (TLS certificates) and /config (autosaved config) are the only writable paths.
# Ports 80/443 still bind: Docker sets net.ipv4.ip_unprivileged_port_start=0 in the container (docker-compose.yml also
# sets it explicitly) and compose keeps NET_BIND_SERVICE for runtimes that don't.
# Upgrading an existing deploy whose caddy-data volume was written as root: run once
#   docker compose run --rm --user root --entrypoint chown web -R 10002:10002 /data /config
RUN addgroup -S -g 10002 caddy \
    && adduser -S -D -H -u 10002 -G caddy -s /sbin/nologin caddy \
    && mkdir -p /data/caddy /config/caddy \
    && chown -R caddy:caddy /data /config
WORKDIR /srv
# same Caddyfile as a bare-metal deploy; imports are resolved relative to the Caddyfile's directory
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=frontend /build/deploy/security-headers.caddy /etc/caddy/security-headers.caddy
COPY --from=frontend /build/frontend/dist /srv/dist
ENV SITE_ROOT=/srv/dist
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
EXPOSE 80 443 443/udp
USER caddy
# the site itself, not the admin API: an empty or broken dist/ turns the container unhealthy. Loopback-only listener
# (deploy/Caddyfile, 127.0.0.1:2080) so the probe works whatever SITE_ADDRESS is (":80" locally, a domain with HTTPS)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:2080/robots.txt"]
