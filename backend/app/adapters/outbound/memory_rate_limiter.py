"""RateLimiter kept in process memory — enough for a single-instance portfolio (that is why the API runs 1 worker).

A multi-instance deployment would implement the same port on Redis without touching the use case.
"""
import threading
import time
from collections import OrderedDict, deque


class InMemoryRateLimiter:
    """Sliding window per key (client IP), with LRU eviction so memory stays bounded even under attack."""

    def __init__(self, limit: int, window_s: int, max_keys: int = 10_000):
        self.limit, self.window_s, self.max_keys = limit, window_s, max_keys
        self.hits: OrderedDict[str, deque] = OrderedDict()  # least recently used first
        self.lock = threading.Lock()

    def check(self, key: str) -> int:
        """Returns 0 if allowed, otherwise the seconds to wait."""
        now = time.monotonic()
        with self.lock:
            q = self.hits.get(key)
            if q is None:
                q = self.hits[key] = deque()
            self.hits.move_to_end(key)
            while q and now - q[0] > self.window_s:
                q.popleft()
            # evict idle clients from the LRU end: O(1) amortized
            while self.hits:
                oldest_key, oldest = next(iter(self.hits.items()))
                if oldest_key == key or (oldest and now - oldest[-1] <= self.window_s and len(self.hits) <= self.max_keys):
                    break
                self.hits.popitem(last=False)
            if len(q) >= self.limit:
                return int(self.window_s - (now - q[0])) + 1
            q.append(now)
            return 0
