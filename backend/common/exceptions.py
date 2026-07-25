import logging
from math import ceil

from django.core.exceptions import ObjectDoesNotExist, PermissionDenied as DjangoPermissionDenied
from django.db import DatabaseError, IntegrityError
from django.http import Http404, JsonResponse
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    MethodNotAllowed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    Throttled,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("cms.errors")


STATUS_MESSAGES = {
    400: "Please check the submitted information.",
    401: "Authentication is required.",
    403: "You don't have permission to perform this action.",
    404: "The requested item could not be found.",
    405: "This action is not available.",
    409: "This request conflicts with the current state of the record.",
    422: "Please check the submitted information.",
    429: "Too many requests. Please wait a moment and try again.",
    500: "Something went wrong. Please try again later.",
    503: "The service is temporarily unavailable. Please try again later.",
}


def _clean_detail(value):
    if value is None:
        return ""
    if isinstance(value, dict):
        return {str(key): _clean_detail(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_clean_detail(item) for item in value]
    return str(value)


def _code_for(status_code):
    return {
        400: "validation_error",
        401: "authentication_required",
        403: "permission_denied",
        404: "not_found",
        405: "method_not_allowed",
        409: "conflict",
        422: "validation_error",
        429: "rate_limited",
        500: "server_error",
        503: "service_unavailable",
    }.get(status_code, "error")


def _log_exception(exc, status_code, request=None):
    path = getattr(request, "path", "")
    method = getattr(request, "method", "")
    user = getattr(request, "user", None)
    user_id = getattr(user, "id", None) if getattr(user, "is_authenticated", False) else None
    extra = {
        "status_code": status_code,
        "method": method,
        "path": path,
        "user_id": user_id,
    }
    if status_code >= 500:
        logger.exception("Unhandled API exception", extra=extra)
    elif status_code in {401, 403}:
        logger.warning("API access denied", extra=extra)
    else:
        logger.info("API request failed", extra=extra)


def build_error_payload(status_code, *, errors=None):
    payload = {
        "detail": STATUS_MESSAGES.get(status_code, STATUS_MESSAGES[500]),
        "code": _code_for(status_code),
    }
    if errors:
        payload["errors"] = _clean_detail(errors)
    return payload


def response_for_exception(exc, request=None):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    errors = None

    if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        status_code = status.HTTP_401_UNAUTHORIZED
    elif isinstance(exc, (PermissionDenied, DjangoPermissionDenied)):
        status_code = status.HTTP_403_FORBIDDEN
    elif isinstance(exc, (NotFound, Http404, ObjectDoesNotExist)):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, MethodNotAllowed):
        status_code = status.HTTP_405_METHOD_NOT_ALLOWED
    elif isinstance(exc, Throttled):
        status_code = status.HTTP_429_TOO_MANY_REQUESTS
    elif isinstance(exc, ValidationError):
        status_code = status.HTTP_400_BAD_REQUEST
        errors = exc.detail
    elif isinstance(exc, IntegrityError):
        status_code = status.HTTP_409_CONFLICT
    elif isinstance(exc, DatabaseError):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    elif isinstance(exc, APIException):
        status_code = exc.status_code
        if status_code < 500:
            errors = getattr(exc, "detail", None)

    _log_exception(exc, status_code, request=request)
    return build_error_payload(status_code, errors=errors), status_code


def custom_exception_handler(exc, context):
    request = context.get("request") if context else None
    response = drf_exception_handler(exc, context)

    if response is not None:
        status_code = response.status_code
        if status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            retry_after = getattr(exc, "wait", None) or response.headers.get("Retry-After")
            retry_after = int(ceil(float(retry_after))) if retry_after else None
            detail = response.data.get("detail") if isinstance(response.data, dict) else response.data
            if isinstance(detail, dict):
                payload = detail
            else:
                payload = build_error_payload(status_code)
                if detail:
                    payload["detail"] = str(detail)
            if retry_after:
                payload["retry_after"] = retry_after
                response.headers["Retry-After"] = str(retry_after)
            _log_exception(exc, status_code, request=request)
            return Response(payload, status=status_code, headers=response.headers)
        errors = response.data if status_code in {400, 422} else None
        payload = build_error_payload(status_code, errors=errors)
        _log_exception(exc, status_code, request=request)
        return Response(payload, status=status_code, headers=response.headers)

    payload, status_code = response_for_exception(exc, request=request)
    return Response(payload, status=status_code)


def json_response_for_exception(exc, request=None):
    payload, status_code = response_for_exception(exc, request=request)
    return JsonResponse(payload, status=status_code)

