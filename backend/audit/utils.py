import csv
import json
from decimal import Decimal
from io import BytesIO, StringIO

from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse
from django.utils import timezone

from common.ip import get_client_ip


SENSITIVE_KEYS = {
    "password",
    "new_password",
    "old_password",
    "token",
    "access",
    "refresh",
    "access_token",
    "refresh_token",
    "session",
    "session_key",
    "key",
}

FINANCIAL_HINTS = {
    "amount",
    "salary",
    "budget",
    "pay",
    "rate",
    "bonus",
    "allowance",
    "deduction",
    "tax",
    "retention",
    "currency",
    "contract_value",
    "net_amount",
    "gross_amount",
    "net_pay",
    "gross_pay",
}

FINANCIAL_MODELS = {
    "expense",
    "payroll",
    "workerpayroll",
    "workeradvance",
    "contract",
    "contractpayment",
    "contractvariation",
    "contractinvoice",
    "project",
}


def _json_safe(value):
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(item) for item in value]
    try:
        return json.loads(DjangoJSONEncoder().encode(value))
    except TypeError:
        return str(value)


def sanitize_mapping(data):
    clean = {}
    for key, value in (data or {}).items():
        key_text = str(key)
        lowered = key_text.lower()
        if any(secret in lowered for secret in SENSITIVE_KEYS):
            clean[key_text] = "***"
        elif "email" in lowered and isinstance(value, str) and "@" in value:
            name, domain = value.split("@", 1)
            clean[key_text] = f"{name[:2]}***@{domain}"
        elif "phone" in lowered and isinstance(value, str) and len(value) > 4:
            clean[key_text] = f"***{value[-4:]}"
        else:
            clean[key_text] = _json_safe(value)
    return clean


def serialize_instance(instance):
    data = {}
    for field in instance._meta.fields:
        data[field.name] = getattr(instance, field.name, None)
    return sanitize_mapping(data)


def get_changed_fields(old_data, new_data):
    changes = {}
    keys = set((old_data or {}).keys()) | set((new_data or {}).keys())
    for key in sorted(keys):
        old_value = (old_data or {}).get(key)
        new_value = (new_data or {}).get(key)
        if old_value != new_value:
            changes[key] = {"old": old_value, "new": new_value}
    return changes


def get_financial_metadata(model_name, old_data, new_data, request=None):
    changes = get_changed_fields(old_data, new_data)
    lower_model = (model_name or "").lower()
    financial_changes = {
        field: values
        for field, values in changes.items()
        if any(hint in field.lower() for hint in FINANCIAL_HINTS)
    }
    is_financial = bool(financial_changes) or lower_model in FINANCIAL_MODELS
    currency = (new_data or {}).get("currency") or (new_data or {}).get("budget_currency") or (old_data or {}).get("currency") or (old_data or {}).get("budget_currency")
    if not currency:
        amount_usd = Decimal(str((new_data or {}).get("amount_usd") or (old_data or {}).get("amount_usd") or "0"))
        amount_afn = Decimal(str((new_data or {}).get("amount_afn") or (old_data or {}).get("amount_afn") or "0"))
        if amount_usd > 0 and amount_afn <= 0:
            currency = "USD"
        elif amount_afn > 0 and amount_usd <= 0:
            currency = "AFN"
    currency_change = None
    warnings = []

    for field in ("currency", "budget_currency"):
        if field in changes:
            currency_change = changes[field]
            warnings.append(
                f"Currency changed from {currency_change['old']} to {currency_change['new']}"
            )

    reason = ""
    if request is not None:
        reason = request.headers.get("X-Audit-Reason", "")
        data = getattr(request, "data", None)
        if not reason and isinstance(data, dict):
            reason = data.get("audit_reason", "") or data.get("reason", "")

    return {
        "is_financial": is_financial,
        "financial_changes": financial_changes,
        "currency": currency,
        "currency_change": currency_change,
        "warnings": warnings,
        "reason": reason,
    }


def infer_action(instance, created=False, deleted=False):
    model = instance._meta.model_name
    if deleted:
        return f"{model}.delete"
    if created:
        return f"{model}.create"
    return f"{model}.update"


def create_audit_log(
    *,
    user=None,
    action,
    model_name="",
    object_id="",
    object_repr="",
    old_data=None,
    new_data=None,
    description="",
    status="success",
    request=None,
    extra_metadata=None,
):
    from .models import AuditLog

    request = request or None
    extra = extra_metadata or {}
    if request is not None:
        extra.setdefault("query_string", request.META.get("QUERY_STRING", ""))

    return AuditLog.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        action=action,
        model_name=model_name,
        object_id=str(object_id or ""),
        object_repr=str(object_repr or "")[:500],
        old_data=sanitize_mapping(old_data or {}),
        new_data=sanitize_mapping(new_data or {}),
        description=description,
        ip_address=get_client_ip(request) if request else None,
        user_agent=request.META.get("HTTP_USER_AGENT", "") if request else "",
        request_method=request.method if request else "",
        endpoint=request.get_full_path() if request else "",
        status=status,
        extra_metadata=extra,
    )


def export_csv(queryset):
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "timestamp",
        "user",
        "action",
        "status",
        "model_name",
        "object_id",
        "object_repr",
        "endpoint",
        "ip_address",
        "description",
    ])
    for log in queryset.iterator(chunk_size=2000):
        writer.writerow([
            timezone.localtime(log.timestamp).isoformat(),
            getattr(log.user, "username", ""),
            log.action,
            log.status,
            log.model_name,
            log.object_id,
            log.object_repr,
            log.endpoint,
            log.ip_address,
            log.description,
        ])

    response = HttpResponse(buffer.getvalue(), content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="audit_logs.csv"'
    return response


def export_excel(queryset):
    from openpyxl import Workbook

    workbook = Workbook(write_only=True)
    sheet = workbook.create_sheet("Audit Logs")
    sheet.append([
        "Timestamp",
        "User",
        "Action",
        "Status",
        "Model",
        "Object ID",
        "Object",
        "Endpoint",
        "IP Address",
        "Description",
    ])
    for log in queryset.iterator(chunk_size=2000):
        sheet.append([
            timezone.localtime(log.timestamp).isoformat(),
            getattr(log.user, "username", ""),
            log.action,
            log.status,
            log.model_name,
            log.object_id,
            log.object_repr,
            log.endpoint,
            str(log.ip_address or ""),
            log.description,
        ])

    buffer = BytesIO()
    workbook.save(buffer)
    buffer.seek(0)
    response = HttpResponse(
        buffer.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="audit_logs.xlsx"'
    return response
