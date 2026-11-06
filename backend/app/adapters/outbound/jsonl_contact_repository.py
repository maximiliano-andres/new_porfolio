"""ContactRepository on an append-only JSON Lines file (one message per line, oldest first)."""
import contextlib
import json
import os
import shutil
import tempfile
import threading
from datetime import datetime
from pathlib import Path

from app.domain.contact import ContactMessage
from app.domain.errors import ContactStorageError, ContactStorageFull


class JsonlContactRepository:
    def __init__(self, path: Path, *, max_bytes: int = 0, min_free_bytes: int = 0):
        self.path = path
        self.max_bytes = max_bytes            # 0 = no cap
        self.min_free_bytes = min_free_bytes  # readiness: free space required on the log's filesystem
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
                    if self.max_bytes and os.fstat(f.fileno()).st_size >= self.max_bytes:
                        raise ContactStorageFull(f"contact log reached {self.max_bytes} bytes")
                    f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except OSError as exc:
            raise ContactStorageError(str(exc)) from exc

    def purge_received_before(self, cutoff: datetime) -> int:
        """Rewrites the file without the expired lines, atomically (temp file + os.replace): a crash never leaves a
        half-written log. Cheap when there is nothing to do: the file is chronological, so only the first line is read."""
        try:
            with self._lock:
                if not self.path.exists():
                    return 0
                with self.path.open(encoding="utf-8", newline="\n") as f:
                    first = f.readline()
                    if not first or not _expired(first, cutoff):
                        return 0
                    f.seek(0)
                    kept, removed = [], 0
                    for line in f:
                        if _expired(line, cutoff):
                            removed += 1
                        else:
                            kept.append(line)
                fd, tmp = tempfile.mkstemp(dir=self.path.parent, prefix=".contact-purge-")  # same FS → atomic replace
                try:
                    os.chmod(tmp, 0o600)
                    with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as out:
                        out.writelines(kept)
                        out.flush()
                        os.fsync(out.fileno())
                    os.replace(tmp, self.path)
                except BaseException:
                    with contextlib.suppress(OSError):
                        os.unlink(tmp)
                    raise
                return removed
        except OSError as exc:
            raise ContactStorageError(str(exc)) from exc

    def is_writable(self) -> bool:
        target = self.path if self.path.exists() else self.path.parent
        if not os.access(target, os.W_OK):
            return False
        try:
            # a full disk makes every save() fail with 500: readiness must say so (503) before visitors notice
            return shutil.disk_usage(self.path.parent).free >= self.min_free_bytes
        except OSError:
            return False


def _expired(line: str, cutoff: datetime) -> bool:
    """A line that can't be parsed is kept (never delete data we don't understand); blank lines are dropped."""
    if not line.strip():
        return True
    try:
        return datetime.fromisoformat(json.loads(line)["received_at"]) < cutoff
    except (ValueError, KeyError, TypeError):
        return False
