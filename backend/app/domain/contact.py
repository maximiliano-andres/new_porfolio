"""Contact message: the only business entity of the portfolio, with its validation rules."""
import re
from dataclasses import dataclass
from datetime import datetime

# field limits — the frontend form mirrors them (frontend/src/services/contactApi.js)
NAME_MAX = 100
EMAIL_MIN = 3
EMAIL_MAX = 254
MESSAGE_MAX = 5000
HONEYPOT_MAX = 200

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$")
# bidi overrides/isolates and C0/C1 controls (except \n \t). ZWJ (U+200D) is kept: emoji sequences need it.
UNSAFE_CHARS = re.compile(r"[‪-‮⁦-⁩\x00-\x08\x0b-\x1f\x7f-\x9f]")


def clean_text(value: str) -> str:
    """Strips characters that could spoof or corrupt the stored text; raises ValueError if nothing is left."""
    value = UNSAFE_CHARS.sub("", value).strip()
    if not value:
        raise ValueError("no puede estar vacío")
    return value


def normalize_email(value: str) -> str:
    value = value.strip()
    if not EMAIL_RE.match(value):
        raise ValueError("email inválido")
    return value


@dataclass(frozen=True, slots=True)
class ContactSubmission:
    """What a visitor sends. `honeypot` is a field invisible to people: bots tend to fill it in."""

    name: str
    email: str
    message: str
    honeypot: str = ""

    @property
    def is_spam(self) -> bool:
        return bool(self.honeypot)


@dataclass(frozen=True, slots=True)
class ContactMessage:
    """A message accepted for storage."""

    name: str
    email: str
    message: str
    received_at: datetime
