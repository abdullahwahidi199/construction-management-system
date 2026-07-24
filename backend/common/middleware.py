from .exceptions import json_response_for_exception


class ApiExceptionMiddleware:
    """
    Keeps API failures in a consistent JSON shape and prevents technical
    tracebacks or HTML error pages from reaching the React app.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Exception as exc:
            if not request.path.startswith("/api/"):
                raise
            return json_response_for_exception(exc, request=request)

