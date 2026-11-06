"""Client IP resolution behind reverse proxies / CDNs, and the rate-limit key derived from it."""
import ipaddress

from fastapi import Request
from granian.utils.proxies import wrap_asgi_with_proxy_headers


IPAddress = ipaddress.IPv4Address | ipaddress.IPv6Address


def parse_ip(value: str) -> IPAddress | None:
    """A valid IP or None. An IPv4-mapped IPv6 (::ffff:1.2.3.4) counts as the IPv4 it carries."""
    try:
        ip = ipaddress.ip_address(value.strip())
    except ValueError:
        return None
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        return ip.ipv4_mapped
    return ip


def rate_limit_key(ip: IPAddress, ipv6_prefix: int = 64) -> str:
    """IPv4: the address. IPv6: its /64 (by default) — one subscriber or VPS gets a whole /64, so rotating addresses
    inside it must not open new quotas."""
    if isinstance(ip, ipaddress.IPv6Address):
        return str(ipaddress.ip_network(f"{ip}/{ipv6_prefix}", strict=False))
    return str(ip)


def client_ip_resolver(*, trust_proxy: bool, client_ip_header: str, ipv6_prefix: int = 64):
    """Returns request → client key for the rate limiter.

    A CDN header (e.g. "cf-connecting-ip") is honoured only with TRUST_PROXY=1 and CLIENT_IP_HEADER set, and only when
    its value is a valid IP: anything else (garbage, a list, an empty value) falls back to the peer address, so made-up
    values can't mint new quotas.
    """
    header = client_ip_header.lower()

    def client_ip(request: Request) -> str:
        if trust_proxy and header:
            ip = parse_ip(request.headers.get(header, ""))
            if ip is not None:
                return rate_limit_key(ip, ipv6_prefix)
        peer = request.client.host if request.client else "unknown"
        ip = parse_ip(peer)
        return rate_limit_key(ip, ipv6_prefix) if ip is not None else peer

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
