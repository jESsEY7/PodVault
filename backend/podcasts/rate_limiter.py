"""
podcasts.rate_limiter
~~~~~~~~~~~~~~~~~~~~~
Thread-safe token-bucket rate limiter.

Designed specifically for the iTunes Search API which enforces a hard
limit of 20 requests per 60 seconds.  Uses a threading.Lock and a
monotonic clock so it is safe to share across Django threads.

Usage::

    _itunes_limiter = RateLimiter(max_calls=20, period=60.0)

    def make_request():
        _itunes_limiter.acquire()   # blocks if tokens exhausted
        return requests.get(URL, ...)
"""

from __future__ import annotations

import logging
import threading
import time

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Token-bucket rate limiter.

    :param max_calls: Maximum number of calls allowed within ``period``.
    :param period:    Refill window in seconds.
    """

    def __init__(self, max_calls: int = 20, period: float = 60.0) -> None:
        self.max_calls = max_calls
        self.period = period
        self._lock = threading.Lock()
        self._tokens: float = float(max_calls)
        self._last_refill: float = time.monotonic()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def acquire(self) -> None:
        """
        Block the calling thread until a token is available.

        Refills tokens proportionally based on elapsed time so there is
        no thundering-herd effect when multiple threads wake simultaneously.
        """
        while True:
            with self._lock:
                self._refill()
                if self._tokens >= 1.0:
                    self._tokens -= 1.0
                    return
                # Calculate how long to wait for the next token
                wait = self._seconds_per_token()

            logger.debug(
                "[RateLimiter] Token pool empty — waiting %.2fs for refill.", wait
            )
            time.sleep(wait)

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _refill(self) -> None:
        """Add tokens proportional to elapsed time since last refill."""
        now = time.monotonic()
        elapsed = now - self._last_refill
        new_tokens = elapsed * (self.max_calls / self.period)
        self._tokens = min(self._tokens + new_tokens, float(self.max_calls))
        self._last_refill = now

    def _seconds_per_token(self) -> float:
        """Seconds it takes to earn one token at the current refill rate."""
        return self.period / self.max_calls
