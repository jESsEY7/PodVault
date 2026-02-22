"""
podcasts.exceptions
~~~~~~~~~~~~~~~~~~~
Custom exception hierarchy for the podcast provider layer.

Each exception carries a ``provider`` attribute so callers and views can
include provider context in error responses without inspecting the message.
"""

from __future__ import annotations


class ProviderError(Exception):
    """
    Base class for all podcast-provider failures.

    Usage::

        raise ProviderError("Something went wrong", provider="itunes")
    """

    def __init__(self, message: str = "", provider: str = "unknown") -> None:
        super().__init__(message)
        self.provider = provider

    def __str__(self) -> str:
        return f"[{self.provider}] {super().__str__()}"


class RateLimitExceeded(ProviderError):
    """
    Raised when a provider returns HTTP 429 Too Many Requests and all
    back-off retries have been exhausted.
    """


class QuotaExhausted(ProviderError):
    """
    Raised when a provider's monthly query-point (or credit) limit has
    been reached and all API key rotation attempts have failed.

    Podchaser uses a monthly 'Query Point' system; this exception signals
    that every key in ``settings.PODCHASER_API_KEYS`` is spent.
    """


class ProviderUnavailable(ProviderError):
    """
    Raised for unexpected provider outages — network errors, 5xx responses,
    or malformed payloads that cannot be retried.
    """
