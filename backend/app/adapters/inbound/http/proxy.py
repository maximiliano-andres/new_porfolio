"""Client IP resolution behind reverse proxies / CDNs."""
from fastapi import Request
from granian.utils.proxies import wrap_asgi_with_proxy_headers


def client_ip_resolver(*, trust_proxy: bool, client_ip_header: str):
    """Returns request → client key for the rate limiter.

    A CDN header (e.g. "cf-connecting-ip") is honoured only with TRUST_PROXY=1 and CLIENT_IP_HEADER set.
    """
    header = client_ip_header.lower()

    def client_ip(request: Request) -> str:
        if trust_proxy and header:
            value = request.headers.get(header, "").strip()
            if value:
                return value
        return request.client.host if request.client else "unknown"

    return client_ip


def with_proxy_headers(inner, trusted_hosts: str):
    """ASGI wrapper: request.client becomes the last X-Forwarded-For hop that is NOT a trusted proxy (what the proxy
    itself appended), so a spoofed first value can't dodge the rate limit. Granian's helper, same rule uvicorn used.

    With "*" every hop is trusted and the FIRST value wins — only safe when the proxy overwrites the header
    (Caddy does by default: it ignores incoming X-Forwarded-For unless `trusted_proxies` is configured).
    """
    # granian's helper is a plain function returning a coroutine; an `async def` keeps it a valid ASGI 3 app for
    # any server or test client that inspects the callable
    wrapped = wrap_asgi_with_proxy_headers(inner, trusted_hosts=trusted_hosts)

    async def proxied(scope, receive, send):
        await wrapped(scope, receive, send)

    return proxied
