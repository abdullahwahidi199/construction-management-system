from threading import local

from .utils import create_audit_log, get_client_ip

_state = local()


def get_current_request():
    return getattr(_state, "request", None)


class AuditRequestMiddleware:
    """
    Stores request context for model-signal audit logs and records failed
    mutating API requests that do not reach model persistence.
    """

    MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _state.request = request
        try:
            response = self.get_response(request)
            if (
                request.method in self.MUTATING_METHODS
                and getattr(response, "status_code", 200) >= 400
                and not request.path.startswith("/api/audit/")
            ):
                user = request.user if getattr(request, "user", None) and request.user.is_authenticated else None
                create_audit_log(
                    user=user,
                    action="request_failed",
                    status="failed",
                    description=f"{request.method} {request.path} failed with HTTP {response.status_code}",
                    request=request,
                    extra_metadata={
                        "status_code": response.status_code,
                        "ip_address": get_client_ip(request),
                    },
                )
            return response
        finally:
            _state.request = None

