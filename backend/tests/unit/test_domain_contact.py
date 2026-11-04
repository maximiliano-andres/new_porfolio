"""Domain rules, tested without FastAPI, files or network."""
import pytest

from app.domain.contact import ContactSubmission, clean_text, normalize_email


def test_clean_text_strips_bidi_and_controls_but_keeps_emoji_zwj_and_newlines():
    assert clean_text("  Ana‮ 👨‍👩‍👧\x07 ") == "Ana 👨‍👩‍👧"
    assert clean_text("Hola,\n\tok\x00") == "Hola,\n\tok"


@pytest.mark.parametrize("value", ["", "   ", "‮‭ ", "\x00\x07"])
def test_clean_text_rejects_blank(value):
    with pytest.raises(ValueError):
        clean_text(value)


@pytest.mark.parametrize("email", ["a@.", "a@b.", "a@@b.cl", "sin-arroba", "a b@c.cl", "@b.cl", "a@b..cl"])
def test_normalize_email_rejects_invalid(email):
    with pytest.raises(ValueError):
        normalize_email(email)


def test_normalize_email_trims():
    assert normalize_email("  x@y.cl ") == "x@y.cl"


def test_honeypot_marks_spam():
    assert ContactSubmission("Ana", "a@b.cl", "Hola", honeypot="bot").is_spam
    assert not ContactSubmission("Ana", "a@b.cl", "Hola").is_spam
