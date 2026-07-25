import logging
import hashlib
from math import ceil

from django.conf import settings
from django.core.cache import DEFAULT_CACHE_ALIAS, caches
from django.utils import timezone
from rest_framework.exceptions import APIException
from rest_framework.throttling import BaseThrottle

from common.ip import get_client_ip

logger = logging.getLogger("cms.auth.rate_limit")


class AuthRateLimitExceeded(APIException):
    status_code = 429
    default_code = "rate_limited"

    def __init__(self, wait=None, detail=None):
        retry_after = int(ceil(wait or getattr(settings, "LOGIN_BLOCK_TIME", 900)))
        self.wait = retry_after
        super().__init__(
            detail
            or {
                "detail": "Too many login attempts. Please try again in 15 minutes.",
                "retry_after": retry_after,
                "code": self.default_code,
            }
        )


def get_tenant_identifier(request):
    tenant = getattr(request, "tenant", None)
    if tenant is not None:
        return str(getattr(tenant, "pk", None) or getattr(tenant, "id", None) or tenant)
    tenant_id = getattr(request, "tenant_id", None)
    if tenant_id:
        return str(tenant_id)
    return "default"


class BaseAuthenticationThrottle(BaseThrottle):
    """
    Shared auth-endpoint throttle using Django's default cache. In production
    this must be Redis so all Gunicorn workers share the same counters.
    """

    scope = "auth"

    @property
    def cache(self):
        return caches[DEFAULT_CACHE_ALIAS]

    def get_cache_prefix(self, request):
        tenant = get_tenant_identifier(request)
        client_ip = get_client_ip(request)
        identity = hashlib.sha256(f"{tenant}:{client_ip}".encode("utf-8")).hexdigest()
        return f"auth_throttle:{self.scope}:{identity}"

    def get_block_key(self, request):
        return f"{self.get_cache_prefix(request)}:blocked"

    def allow_request(self, request, view):
        self.request = request
        self.view = view
        self.block_key = self.get_block_key(request)
        retry_after = self.cache.ttl(self.block_key) if hasattr(self.cache, "ttl") else None
        if retry_after is not None and retry_after <= 0:
            retry_after = None

        if retry_after is None:
            retry_after = self.cache.get(self.block_key)
        if retry_after:
            self.wait_duration = int(retry_after)
            self.log_rate_limited_attempt(request)
            return False

        self.wait_duration = int(getattr(settings, "LOGIN_BLOCK_TIME", 900))
        return True

    def wait(self):
        return int(getattr(self, "wait_duration", getattr(settings, "LOGIN_BLOCK_TIME", 900)))

    def block(self):
        block_time = int(getattr(settings, "LOGIN_BLOCK_TIME", 900))
        self.cache.set(self.block_key, block_time, timeout=block_time)
        self.wait_duration = block_time

    def clear(self, request):
        prefix = self.get_cache_prefix(request)
        self.cache.delete_many(
            [
                f"{prefix}:minute",
                f"{prefix}:hour",
                f"{prefix}:blocked",
            ]
        )

    def _increment(self, key, timeout):
        if self.cache.add(key, 1, timeout=timeout):
            return 1
        try:
            return self.cache.incr(key)
        except ValueError:
            self.cache.add(key, 1, timeout=timeout)
            return 1

    def log_rate_limited_attempt(self, request):
        data = getattr(request, "data", {}) if request.method in {"POST", "PUT", "PATCH"} else {}
        username = data.get("username") or data.get("email") if isinstance(data, dict) else ""
        logger.warning(
            "Rate-limited login attempt timestamp=%s ip=%s username=%s tenant=%s user_agent=%s endpoint=%s",
            timezone.now().isoformat(),
            get_client_ip(request),
            username or "",
            get_tenant_identifier(request),
            request.META.get("HTTP_USER_AGENT", ""),
            request.get_full_path(),
        )


class LoginFailedRateThrottle(BaseAuthenticationThrottle):
    scope = "login_failed"

    def record_failure(self, request):
        self.block_key = self.get_block_key(request)
        prefix = self.get_cache_prefix(request)
        minute_count = self._increment(f"{prefix}:minute", timeout=60)
        hour_count = self._increment(f"{prefix}:hour", timeout=3600)

        if (
            minute_count >= int(getattr(settings, "LOGIN_RATE_LIMIT_PER_MINUTE", 5))
            or hour_count >= int(getattr(settings, "LOGIN_RATE_LIMIT_PER_HOUR", 20))
        ):
            self.block()

    def reset(self, request):
        self.clear(request)


class TokenRefreshRateThrottle(BaseAuthenticationThrottle):
    scope = "token_refresh"


class PasswordResetRateThrottle(BaseAuthenticationThrottle):
    scope = "password_reset"


class OTPVerificationRateThrottle(BaseAuthenticationThrottle):
    scope = "otp_verification"
