"""ContactNotifier that POSTs a small JSON to a webhook (Slack/Discord/ntfy/Teams-style incoming webhooks).

The payload carries NO personal data: neither the visitor's name/email nor the message body leave the server — the
owner reads them from the contact log. Only https:// URLs are accepted (checked in config.py and again here).
"""
import json
import urllib.request
from datetime import datetime
from urllib.parse import urlsplit

USER_AGENT = "portfolio-contact-notifier/1"


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """A redirect could downgrade to http:// or point elsewhere: treat any 3xx as a failure instead."""

    def redirect_request(self, *args, **kwargs):
        return None


_opener = urllib.request.build_opener(_NoRedirect)


class WebhookNotifier:
    def __init__(self, url: str, *, timeout_s: float = 5.0):
        if urlsplit(url).scheme != "https":
            raise ValueError("the contact webhook must be an https:// URL")
        self._url = url
        self._timeout_s = timeout_s

    def __repr__(self) -> str:  # never print the URL: incoming-webhook URLs embed their secret token
        return "WebhookNotifier(<redacted>)"

    def payload(self, received_at: datetime) -> bytes:
        text = f"Nuevo mensaje en el formulario de contacto del portafolio ({received_at:%Y-%m-%d %H:%M} UTC)."
        # "text" is what Slack/Mattermost/Rocket.Chat read, "content" is Discord's field
        return json.dumps({"text": text, "content": text, "received_at": received_at.isoformat()}).encode()

    def notify_new_message(self, received_at: datetime) -> None:
        request = urllib.request.Request(  # noqa: S310 — scheme is validated to be https in __init__
            self._url,
            data=self.payload(received_at),
            headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
            method="POST",
        )
        with _opener.open(request, timeout=self._timeout_s) as response:
            response.read(1024)  # non-2xx raises HTTPError; the body is irrelevant
