"""Use case: let the owner know a new contact message arrived (runs in the background, after the answer)."""
import logging
from collections.abc import Callable
from datetime import datetime

from app.application.submit_contact import utc_now
from app.domain.ports import ContactNotifier

log = logging.getLogger("portfolio")


class NotifyOwner:
    def __init__(self, notifier: ContactNotifier | None, clock: Callable[[], datetime] = utc_now):
        self._notifier = notifier  # None: notifications disabled (CONTACT_NOTIFY_WEBHOOK empty)
        self._clock = clock

    @property
    def enabled(self) -> bool:
        return self._notifier is not None

    def __call__(self) -> None:
        """Never raises: the message is already stored, a failed notification only gets logged."""
        if self._notifier is None:
            return
        try:
            self._notifier.notify_new_message(self._clock())
        except Exception as exc:  # any adapter failure (network, TLS, HTTP status…)
            # only the exception type and its short text: never the URL (it often embeds a secret token)
            log.warning("Contact notification failed: %s", type(exc).__name__)
