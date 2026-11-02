# syntax=docker/dockerfile:1.7
# Multi-stage build. Targets:
#   web → Caddy: serves dist/ (precompressed .br/.gz, HTTP/2 + HTTP/3, automatic TLS) and proxies /api/*
#   api → FastAPI on Uvicorn (uvloop + httptools), non-root, read-only filesystem
# The frontend is compiled once (stage "frontend") and shared by both targets.

ARG NODE_VERSION=24
ARG PYTHON_VERSION=3.14
# ≥ 2.11: 2.10.x answers precompressed files with "206 Partial Content" to requests without Range
ARG CADDY_VERSION=2.11

# ---------- 1. frontend: npm ci + full build (vite, SSR prerender, br/gz, CSP for Caddy) ----------
FROM node:${NODE_VERSION}-slim AS frontend
WORKDIR /build
ENV npm_config_update_notifier=false
# dependencies first: this layer is reused while package*.json do not change
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund
COPY index.html vite.config.js security-headers.json ./
COPY public ./public
COPY scripts ./scripts
COPY src ./src
# scripts/deploy-headers.mjs writes deploy/security-headers.caddy (CSP with the inline-script hash of THIS build)
RUN mkdir -p deploy && npm run build

# ---------- 2. python dependencies in an isolated venv ----------
FROM python:${PYTHON_VERSION}-slim AS api-deps
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
RUN python -m venv /opt/venv
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    /opt/venv/bin/pip install -r requirements.txt

# ---------- 3. api: runtime image ----------
FROM python:${PYTHON_VERSION}-slim AS api
ENV PATH=/opt/venv/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_ENV=production \
    TRUST_PROXY=1 \
    CONTACT_LOG=/data/contact_messages.jsonl
RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin app \
    && mkdir -p /data && chown app:app /data
WORKDIR /app
COPY --from=api-deps /opt/venv /opt/venv
COPY main.py security-headers.json ./
# dist/ inside the API too: CSP hash computation and SPA fallback keep working if Caddy is bypassed
COPY --from=frontend /build/dist ./dist
# contact messages go to CONTACT_LOG=/data/… (persistent volume); /app stays read-only
RUN python -m compileall -q /app/main.py
USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/status', timeout=2).status == 200 else 1)"]
# - 1 worker on purpose: the contact rate limiter lives in process memory (N workers = N× the limit)
# - --proxy-headers + --forwarded-allow-ips='*': only Caddy can reach this port (no published ports)
# - keep-alive above Caddy's 2 min idle pool, so the proxy never reuses a connection uvicorn just closed (502s)
# - no access log here: Caddy is the edge and logs requests once
CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", "--port", "8000", \
     "--loop", "uvloop", "--http", "httptools", \
     "--proxy-headers", "--forwarded-allow-ips", "*", \
     "--timeout-keep-alive", "125", \
     "--no-access-log", "--no-server-header"]

# ---------- 4. web: Caddy with the static build ----------
FROM caddy:${CADDY_VERSION}-alpine AS web
WORKDIR /srv
# same Caddyfile as a bare-metal deploy; imports are resolved relative to the Caddyfile's directory
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=frontend /build/deploy/security-headers.caddy /etc/caddy/security-headers.caddy
COPY --from=frontend /build/dist /srv/dist
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
EXPOSE 80 443 443/udp
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:2019/config/"]
