import logging
import re
from math import ceil

from django.core.exceptions import (
    ObjectDoesNotExist,
    PermissionDenied as DjangoPermissionDenied,
    RequestDataTooBig,
    SuspiciousOperation,
    TooManyFieldsSent,
    ValidationError as DjangoValidationError,
)
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
    400: "Please check the highlighted fields and try again.",
    401: "Your session has expired. Please log in again.",
    403: "You don't have permission to perform this action. Please contact an administrator if you need access.",
    404: "The requested item could not be found. It may have been moved or deleted.",
    405: "This action is not available here.",
    409: "This record already exists or is already being reviewed. Please refresh and try again.",
    413: "The uploaded file is too large. Please choose a smaller file and try again.",
    422: "Please check the highlighted fields and try again.",
    429: "Too many requests. Please wait a moment and try again.",
    500: "Something went wrong. Please try again in a moment.",
    503: "The service is temporarily unavailable. Please try again in a moment.",
}


TECHNICAL_PATTERNS = [
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"\btraceback\b",
        r"\bintegrityerror\b",
        r"\bdatabaseerror\b",
        r"\boperationalerror\b",
        r"\bprogrammingerror\b",
        r"\bvalidationerror\b",
        r"\bapi(?:exception|error)\b",
        r"\bsql\b",
        r"\bselect\b.+\bfrom\b",
        r"\bunique constraint\b",
        r"\bconstraint failed\b",
        r"\bexception\b",
        r"\bserializer\b",
    )
]


def _friendly_text(value):
    text = str(value).strip()
    lowered = text.lower()

    if "already exists" in lowered and not any(pattern.search(text) for pattern in TECHNICAL_PATTERNS):
        return text
    if "unique" in lowered or "duplicate" in lowered or "already exists" in lowered:
        return "This record already exists. Please review the existing record before trying again."
    if "file" in lowered and ("large" in lowered or "size" in lowered):
        return "The uploaded file is too large. Please choose a smaller file and try again."
    if "unsupported" in lowered and "file" in lowered:
        return "This file type is not supported. Please upload one of the accepted file formats."
    if any(pattern.search(text) for pattern in TECHNICAL_PATTERNS):
        return "Please check this field and try again."
    return text


def _clean_detail(value):
    if value is None:
        return ""
    if isinstance(value, dict):
        clean = {}
        for key, item in value.items():
            cleaned = _clean_detail(item)
            if cleaned not in ("", [], {}):
                clean[str(key)] = cleaned
        return clean
    if isinstance(value, (list, tuple)):
        return [
            cleaned
            for cleaned in (_clean_detail(item) for item in value)
            if cleaned not in ("", [], {})
        ]
    return _friendly_text(value)


def _code_for(status_code):
    return {
        400: "validation_error",
        401: "authentication_required",
        403: "permission_denied",
        404: "not_found",
        405: "method_not_allowed",
        409: "conflict",
        413: "file_too_large",
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
    elif isinstance(exc, (RequestDataTooBig, TooManyFieldsSent)):
        status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    elif isinstance(exc, ValidationError):
        status_code = status.HTTP_400_BAD_REQUEST
        errors = exc.detail
    elif isinstance(exc, DjangoValidationError):
        status_code = status.HTTP_400_BAD_REQUEST
        if hasattr(exc, "message_dict"):
            errors = exc.message_dict
        elif hasattr(exc, "messages"):
            errors = exc.messages
        else:
            errors = str(exc)
    elif isinstance(exc, IntegrityError):
        status_code = status.HTTP_409_CONFLICT
    elif isinstance(exc, DatabaseError):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    elif isinstance(exc, SuspiciousOperation):
        status_code = status.HTTP_400_BAD_REQUEST
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
            payload = build_error_payload(status_code)
            clean_errors = _clean_detail(response.data)
            if isinstance(clean_errors, dict):
                if clean_errors.get("detail"):
                    payload["detail"] = clean_errors["detail"]
                if clean_errors.get("code"):
                    payload["code"] = clean_errors["code"]
                if clean_errors.get("retry_after"):
                    payload["retry_after"] = clean_errors["retry_after"]
            elif isinstance(clean_errors, str) and clean_errors:
                payload["detail"] = clean_errors
            if retry_after:
                payload["retry_after"] = retry_after
                response.headers["Retry-After"] = str(retry_after)
            _log_exception(exc, status_code, request=request)
            return Response(payload, status=status_code, headers=response.headers)
        errors = response.data if status_code in {400, 409, 413, 422} else None
        payload = build_error_payload(status_code, errors=errors)
        if status_code in {409, 413}:
            clean_errors = _clean_detail(errors)
            if isinstance(clean_errors, dict) and clean_errors.get("detail"):
                payload["detail"] = clean_errors["detail"]
        _log_exception(exc, status_code, request=request)
        return Response(payload, status=status_code, headers=response.headers)

    payload, status_code = response_for_exception(exc, request=request)
    return Response(payload, status=status_code)


def json_response_for_exception(exc, request=None):
    payload, status_code = response_for_exception(exc, request=request)
    return JsonResponse(payload, status=status_code)

