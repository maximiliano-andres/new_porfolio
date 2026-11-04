"""ContactRepository on an append-only JSON Lines file (one message per line)."""
import json
import os
import threading
from pathlib import Path

from app.domain.contact import ContactMessage
from app.domain.errors import ContactStorageError


class JsonlContactRepository:
    def __init__(self, path: Path):
        self.path = path
        self._lock = threading.Lock()

    def save(self, message: ContactMessage) -> None:
        entry = {
            "name": message.name,
            "email": message.email,
            "message": message.message,
            "received_at": message.received_at.isoformat(),
        }
        try:
            with self._lock:
                # 0o600: the file contains personal data, readable only by the server user
                fd = os.open(self.path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
                # newline="\n": identical JSONL on Linux, macOS and Windows (no \r\n translation)
                with os.fdopen(fd, "a", encoding="utf-8", newline="\n") as f:
                    f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except OSError as exc:
            raise ContactStorageError(str(exc)) from exc

    def is_writable(self) -> bool:
        target = self.path if self.path.exists() else self.path.parent
        return os.access(target, os.W_OK)
