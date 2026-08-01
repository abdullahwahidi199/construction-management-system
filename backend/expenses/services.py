from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError

from accounts.models import ApplicationSettings
from accounts.services import has_permission
from audit.utils import create_audit_log

from .models import Expense, ExpenseEditRequest


EXPENSE_APPROVAL_SETTINGS_KEY = "expense_approval"
EXPENSE_EDIT_FIELDS = [
    "expense_scope",
    "project",
    "expense_date",
    "description",
    "remarks",
    "paid_to",
    "amount_afn",
    "amount_usd",
    "exchange_rate",
    "expense_type",
]
FINANCIAL_EDIT_FIELDS = {
    "expense_scope",
    "project",
    "expense_date",
    "paid_to",
    "amount_afn",
    "amount_usd",
    "exchange_rate",
    "expense_type",
}


class ExpenseEditConflict(APIException):
    status_code = 409
    default_detail = (
        "An edit request is already waiting for approval for this expense. "
        "Please wait for the current request to be reviewed before submitting another change."
    )
    default_code = "expense_edit_pending"


def get_expense_approval_settings():
    settings = ApplicationSettings.get_solo()
    value = settings.app_settings.get(EXPENSE_APPROVAL_SETTINGS_KEY, {})
    if not isinstance(value, dict):
        value = {}
    return {"enabled": bool(value.get("enabled", False))}


def set_expense_approval_settings(enabled, user=None):
    settings = ApplicationSettings.get_solo()
    settings.app_settings = {
        **(settings.app_settings or {}),
        EXPENSE_APPROVAL_SETTINGS_KEY: {"enabled": bool(enabled)},
    }
    settings.updated_by = user
    settings.save(update_fields=["app_settings", "updated_by", "updated_at"])
    return get_expense_approval_settings()


def is_expense_approval_enabled():
    return get_expense_approval_settings()["enabled"]


def approved_expenses_queryset():
    return Expense.objects.for_financials()


def expense_currency_totals(queryset):
    total_usd_equivalent = Decimal("0.00")
    total_afn_equivalent = Decimal("0.00")

    for amount_usd, amount_afn, exchange_rate in queryset.values_list(
        "amount_usd",
        "amount_afn",
        "exchange_rate",
    ):
        amount_usd = amount_usd or Decimal("0.00")
        amount_afn = amount_afn or Decimal("0.00")
        exchange_rate = exchange_rate or Decimal("0.00")

        total_usd_equivalent += amount_usd
        total_afn_equivalent += amount_afn

        if exchange_rate > 0:
            if amount_afn:
                total_usd_equivalent += amount_afn / exchange_rate
            if amount_usd:
                total_afn_equivalent += amount_usd * exchange_rate

    return {
        "usd_equivalent": total_usd_equivalent.quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        ),
        "afn_equivalent": total_afn_equivalent.quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        ),
    }


def can_manage_approval(user):
    return has_permission(user, "expenses.approve")


def get_approver_users():
    User = get_user_model()
    approvers = []
    for user in User.objects.filter(is_active=True).select_related("profile"):
        if can_manage_approval(user):
            approvers.append(user)
    return approvers


def _expense_label(expense):
    return f"Expense #{expense.serial_number}"


def _user_display_name(user):
    if not user:
        return ""
    full_name = user.get_full_name() if hasattr(user, "get_full_name") else ""
    return full_name or getattr(user, "username", "")


def _expense_amount_payload(expense):
    if expense.amount_usd and expense.amount_usd > 0:
        return {"amount": str(expense.amount_usd), "currency": "USD"}
    return {"amount": str(expense.amount_afn or 0), "currency": "AFN"}


def _json_value(value):
    if hasattr(value, "pk"):
        return value.pk
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, date):
        return value.isoformat()
    return value


def expense_value_snapshot(expense):
    return {
        "expense_scope": expense.expense_scope,
        "project": expense.project_id,
        "expense_date": expense.expense_date.isoformat() if expense.expense_date else "",
        "description": expense.description,
        "remarks": expense.remarks,
        "paid_to": expense.paid_to,
        "amount_afn": str(expense.amount_afn),
        "amount_usd": str(expense.amount_usd),
        "exchange_rate": str(expense.exchange_rate),
        "expense_type": expense.expense_type,
    }


def _proposed_values_from_serializer(serializer):
    original = expense_value_snapshot(serializer.instance)
    proposed = dict(original)

    for field, value in serializer.validated_data.items():
        if field in EXPENSE_EDIT_FIELDS:
            proposed[field] = _json_value(value)

    changed = [
        field
        for field in EXPENSE_EDIT_FIELDS
        if str(original.get(field) or "") != str(proposed.get(field) or "")
    ]
    return original, proposed, changed


def _has_financial_changes(changed_fields):
    return any(field in FINANCIAL_EDIT_FIELDS for field in changed_fields)


def _changed_field_payload(edit_request):
    labels = {
        "expense_scope": "Expense scope",
        "project": "Project",
        "expense_date": "Expense date",
        "description": "Description",
        "remarks": "Remarks",
        "paid_to": "Paid to",
        "amount_afn": "Amount AFN",
        "amount_usd": "Amount USD",
        "exchange_rate": "Exchange rate",
        "expense_type": "Expense type",
    }
    original = edit_request.original_values or {}
    proposed = edit_request.proposed_values or {}

    def display_value(field, value):
        if value in (None, ""):
            return "-"
        if field == "project":
            from project.models import Project

            return (
                Project.objects.filter(pk=value).values_list("name", flat=True).first()
                or "Office"
            )
        if field == "expense_scope":
            return "Office expense" if value == Expense.ExpenseScope.OFFICE else "Project expense"
        return str(value)

    return [
        {
            "field": field,
            "label": labels.get(field, field.replace("_", " ").title()),
            "before": original.get(field),
            "after": proposed.get(field),
            "before_display": display_value(field, original.get(field)),
            "after_display": display_value(field, proposed.get(field)),
        }
        for field in (edit_request.changed_fields or [])
    ]


def _project_name_for_values(values, fallback_expense):
    if values.get("expense_scope") == Expense.ExpenseScope.OFFICE:
        return "Office"
    project_id = values.get("project")
    if project_id == fallback_expense.project_id:
        return fallback_expense.project_label
    from project.models import Project

    return (
        Project.objects.filter(pk=project_id)
        .values_list("name", flat=True)
        .first()
        or fallback_expense.project_label
    )


def _apply_expense_values(expense, values):
    for field in EXPENSE_EDIT_FIELDS:
        if field not in values:
            continue
        value = values[field]
        if field == "project":
            expense.project_id = value or None
        elif field == "expense_date":
            expense.expense_date = date.fromisoformat(value)
        elif field in {"amount_afn", "amount_usd", "exchange_rate"}:
            setattr(expense, field, Decimal(str(value or "0")))
        else:
            setattr(expense, field, value or "")


def _approval_history_payload(expense):
    return [
        {
            **entry,
            "at": entry["at"].isoformat() if entry.get("at") else "",
        }
        for entry in approval_history(expense)
    ]


def _notify(user, title, message, payload=None, notification_type="expense"):
    if not user:
        return None
    try:
        from notifications.services import create_notification

        return create_notification(
            recipient=user,
            title=title,
            message=message,
            notification_type=notification_type,
            payload=payload or {},
        )
    except Exception:
        return None


def _expense_event_payload(event, expense, actor=None, notes=""):
    amount = _expense_amount_payload(expense)
    payload = {
        "id": f"expense:{event}:{expense.id}:{expense.updated_at.isoformat() if expense.updated_at else ''}",
        "event": event,
        "type": "expense_approval",
        "expense_id": expense.id,
        "expense_date": expense.expense_date.isoformat() if expense.expense_date else "",
        "serial_number": expense.serial_number,
        "description": expense.description,
        "remarks": expense.remarks,
        "paid_to": expense.paid_to,
        "expense_scope": expense.expense_scope,
        "expense_type": expense.expense_type,
        "amount_afn": str(expense.amount_afn),
        "amount_usd": str(expense.amount_usd),
        "exchange_rate": str(expense.exchange_rate),
        "approval_status": expense.approval_status,
        "project_id": expense.project_id,
        "project_name": expense.project_label,
        "created_by": expense.created_by_id,
        "created_by_name": _user_display_name(expense.created_by),
        "actor": getattr(actor, "id", None),
        "actor_name": _user_display_name(actor),
        "amount": amount["amount"],
        "currency": amount["currency"],
        "total_usd": str(expense.total_usd),
        "total_afn": str(expense.total_afn),
        "created_at": expense.created_at.isoformat() if expense.created_at else "",
        "updated_at": expense.updated_at.isoformat() if expense.updated_at else "",
        "approved_by": expense.approved_by_id,
        "approved_by_name": _user_display_name(expense.approved_by),
        "approved_at": expense.approved_at.isoformat() if expense.approved_at else "",
        "rejected_by": expense.rejected_by_id,
        "rejected_by_name": _user_display_name(expense.rejected_by),
        "rejected_at": expense.rejected_at.isoformat() if expense.rejected_at else "",
        "approval_notes": notes or expense.approval_notes,
        "approval_history": _approval_history_payload(expense),
    }
    return payload


def _edit_request_event_payload(event, edit_request, actor=None, notes=""):
    expense = edit_request.expense
    proposed = edit_request.proposed_values or {}
    payload = _expense_event_payload(event, expense, actor=actor, notes=notes)
    payload.update(
        {
            "id": f"expense-edit:{event}:{edit_request.id}:{edit_request.updated_at.isoformat() if edit_request.updated_at else ''}",
            "type": "expense_edit_approval",
            "approval_item_type": "expense_edit",
            "queue_id": f"expense-edit:{edit_request.id}",
            "edit_request_id": edit_request.id,
            "expense_id": expense.id,
            "project_id": proposed.get("project", expense.project_id),
            "project_name": _project_name_for_values(proposed, expense),
            "expense_date": proposed.get("expense_date", payload["expense_date"]),
            "description": proposed.get("description", expense.description),
            "remarks": proposed.get("remarks", expense.remarks),
            "paid_to": proposed.get("paid_to", expense.paid_to),
            "expense_scope": proposed.get("expense_scope", expense.expense_scope),
            "expense_type": proposed.get("expense_type", expense.expense_type),
            "amount_afn": str(proposed.get("amount_afn", expense.amount_afn)),
            "amount_usd": str(proposed.get("amount_usd", expense.amount_usd)),
            "exchange_rate": str(proposed.get("exchange_rate", expense.exchange_rate)),
            "approval_status": edit_request.approval_status,
            "created_by": edit_request.requested_by_id,
            "created_by_name": _user_display_name(edit_request.requested_by),
            "created_at": edit_request.requested_at.isoformat() if edit_request.requested_at else "",
            "updated_at": edit_request.updated_at.isoformat() if edit_request.updated_at else "",
            "approved_by": edit_request.reviewed_by_id if edit_request.is_approved else None,
            "approved_by_name": _user_display_name(edit_request.reviewed_by) if edit_request.is_approved else "",
            "approved_at": edit_request.reviewed_at.isoformat() if edit_request.is_approved and edit_request.reviewed_at else "",
            "rejected_by": edit_request.reviewed_by_id if edit_request.is_rejected else None,
            "rejected_by_name": _user_display_name(edit_request.reviewed_by) if edit_request.is_rejected else "",
            "rejected_at": edit_request.reviewed_at.isoformat() if edit_request.is_rejected and edit_request.reviewed_at else "",
            "approval_notes": notes or edit_request.approval_notes,
            "original_values": edit_request.original_values,
            "proposed_values": edit_request.proposed_values,
            "changed_fields": edit_request.changed_fields,
            "field_changes": _changed_field_payload(edit_request),
            "approval_history": [
                {
                    "status": "edit requested",
                    "at": edit_request.requested_at.isoformat() if edit_request.requested_at else "",
                    "by": getattr(edit_request.requested_by, "username", None),
                    "notes": "",
                },
                *(
                    [
                        {
                            "status": edit_request.approval_status,
                            "at": edit_request.reviewed_at.isoformat(),
                            "by": getattr(edit_request.reviewed_by, "username", None),
                            "notes": notes or edit_request.approval_notes,
                        }
                    ]
                    if edit_request.reviewed_at
                    else []
                ),
            ],
        }
    )
    return payload


def _broadcast_expense_event(event, expense, actor=None, notes=""):
    if event == "submitted":
        return
    payload = _expense_event_payload(event, expense, actor=actor, notes=notes)
    try:
        from notifications.services import broadcast_event

        broadcast_event("dashboard", "expense.approval", payload)
    except Exception:
        return


def _broadcast_edit_request_event(event, edit_request, actor=None, notes=""):
    if event == "submitted":
        return
    payload = _edit_request_event_payload(event, edit_request, actor=actor, notes=notes)
    try:
        from notifications.services import broadcast_event

        broadcast_event("dashboard", "expense.approval", payload)
    except Exception:
        return


def _broadcast_expense_submission_to_approvers(expense):
    payload = _expense_event_payload("submitted", expense, actor=expense.created_by)
    try:
        from notifications.services import broadcast_event

        for approver in get_approver_users():
            if approver.id == expense.created_by_id:
                continue
            broadcast_event(f"user_{approver.id}", "expense.approval.request", payload)
    except Exception:
        return


def _broadcast_edit_request_submission_to_approvers(edit_request):
    payload = _edit_request_event_payload(
        "submitted",
        edit_request,
        actor=edit_request.requested_by,
    )
    try:
        from notifications.services import broadcast_event

        for approver in get_approver_users():
            if approver.id == edit_request.requested_by_id:
                continue
            broadcast_event(f"user_{approver.id}", "expense.approval.request", payload)
    except Exception:
        return


def notify_expense_submitted(expense, request=None):
    title = f"{_expense_label(expense)} submitted for approval"
    message = f"{_expense_label(expense)} was submitted for approval."
    payload = {
        "expense_id": expense.id,
        "serial_number": expense.serial_number,
        "approval_status": expense.approval_status,
        **_expense_amount_payload(expense),
        "expense_scope": expense.expense_scope,
        "project_id": expense.project_id,
        "project_name": expense.project_label,
        "created_by": expense.created_by_id,
        "created_by_name": _user_display_name(expense.created_by),
        "created_at": expense.created_at.isoformat() if expense.created_at else "",
    }
    for approver in get_approver_users():
        if approver.id == expense.created_by_id:
            continue
        _notify(approver, title, message, payload=payload, notification_type="expense_approval")

    create_audit_log(
        user=expense.created_by,
        action="expense.submit",
        model_name="Expense",
        object_id=expense.pk,
        object_repr=expense,
        new_data={
            "approval_status": expense.approval_status,
            "created_by": expense.created_by_id,
        },
        description=f"{_expense_label(expense)} submitted for approval",
        request=request,
    )
    _broadcast_expense_event("submitted", expense, actor=expense.created_by)
    _broadcast_expense_submission_to_approvers(expense)


def notify_expense_edit_requested(edit_request, request=None):
    expense = edit_request.expense
    title = f"{_expense_label(expense)} edit requested"
    message = (
        f"{_expense_label(expense)} has proposed financial changes waiting for approval."
    )
    payload = _edit_request_event_payload(
        "submitted",
        edit_request,
        actor=edit_request.requested_by,
    )
    for approver in get_approver_users():
        if approver.id == edit_request.requested_by_id:
            continue
        _notify(
            approver,
            title,
            message,
            payload=payload,
            notification_type="expense_approval",
        )

    create_audit_log(
        user=edit_request.requested_by,
        action="expense.edit.submit",
        model_name="ExpenseEditRequest",
        object_id=edit_request.pk,
        object_repr=edit_request,
        old_data=edit_request.original_values,
        new_data=edit_request.proposed_values,
        description=f"{_expense_label(expense)} edit submitted for approval",
        request=request,
        extra_metadata={
            "expense_id": expense.id,
            "changed_fields": edit_request.changed_fields,
        },
    )
    _broadcast_edit_request_submission_to_approvers(edit_request)


def create_expense(serializer, user, request=None):
    approval_enabled = is_expense_approval_enabled()
    save_kwargs = {"created_by": user}

    if approval_enabled:
        save_kwargs.update(
            approval_status=Expense.ApprovalStatus.PENDING,
            approved_by=None,
            approved_at=None,
            rejected_by=None,
            rejected_at=None,
            approval_notes="",
        )
    else:
        save_kwargs.update(
            approval_status=Expense.ApprovalStatus.APPROVED,
            approved_by=user,
            approved_at=timezone.now(),
            rejected_by=None,
            rejected_at=None,
            approval_notes="",
        )

    expense = serializer.save(**save_kwargs)
    if approval_enabled:
        notify_expense_submitted(expense, request=request)
    return expense


def ensure_user_can_edit_expense(user, expense):
    if expense.is_approved:
        return

    if has_permission(user, "expenses.update"):
        return

    if expense.created_by_id == getattr(user, "id", None):
        return

    raise PermissionDenied("You can only edit your own pending or rejected expenses.")


@transaction.atomic
def create_expense_edit_request(serializer, user, request=None):
    expense = Expense.objects.select_for_update().get(pk=serializer.instance.pk)
    serializer.instance = expense
    original, proposed, changed_fields = _proposed_values_from_serializer(serializer)

    if not changed_fields:
        return expense

    if ExpenseEditRequest.objects.filter(
        expense=expense,
        approval_status=ExpenseEditRequest.ApprovalStatus.PENDING,
    ).exists():
        raise ExpenseEditConflict()

    edit_request = ExpenseEditRequest.objects.create(
        expense=expense,
        original_values=original,
        proposed_values=proposed,
        changed_fields=changed_fields,
        requested_by=user,
        approval_status=ExpenseEditRequest.ApprovalStatus.PENDING,
    )
    notify_expense_edit_requested(edit_request, request=request)
    return edit_request


def update_expense(serializer, user, request=None):
    expense = serializer.instance
    approval_enabled = is_expense_approval_enabled()
    ensure_user_can_edit_expense(user, expense)

    old_status = expense.approval_status
    original, proposed, changed_fields = _proposed_values_from_serializer(serializer)

    if expense.is_approved and _has_financial_changes(changed_fields):
        return create_expense_edit_request(serializer, user, request=request)

    save_kwargs = {}
    should_resubmit = approval_enabled and old_status == Expense.ApprovalStatus.REJECTED

    if should_resubmit:
        save_kwargs.update(
            approval_status=Expense.ApprovalStatus.PENDING,
            approved_by=None,
            approved_at=None,
            rejected_by=None,
            rejected_at=None,
            approval_notes="",
        )
    elif not approval_enabled and old_status != Expense.ApprovalStatus.APPROVED:
        save_kwargs.update(
            approval_status=Expense.ApprovalStatus.APPROVED,
            approved_by=user,
            approved_at=timezone.now(),
            rejected_by=None,
            rejected_at=None,
        )

    expense = serializer.save(**save_kwargs)
    if should_resubmit:
        notify_expense_submitted(expense, request=request)
    return expense


@transaction.atomic
def approve_expense(expense, user, notes="", request=None):
    if not can_manage_approval(user):
        raise PermissionDenied("You do not have permission to approve expenses.")
    if expense.approval_status == Expense.ApprovalStatus.APPROVED:
        return expense

    expense.mark_approved(user, notes=notes)
    expense.save(
        update_fields=[
            "approval_status",
            "approved_by",
            "approved_at",
            "approval_notes",
            "rejected_by",
            "rejected_at",
            "updated_at",
        ]
    )

    _notify(
        expense.created_by,
        f"{_expense_label(expense)} approved",
        f"{_expense_label(expense)} was approved.",
        payload={"expense_id": expense.id, "approval_status": expense.approval_status},
        notification_type="expense_approval",
    )
    create_audit_log(
        user=user,
        action="expense.approve",
        model_name="Expense",
        object_id=expense.pk,
        object_repr=expense,
        new_data={
            "approval_status": expense.approval_status,
            "approved_by": user.id,
            "approved_at": expense.approved_at,
            "approval_notes": notes,
        },
        description=f"{_expense_label(expense)} approved",
        request=request,
        extra_metadata={"reason": notes},
    )
    _broadcast_expense_event("approved", expense, actor=user, notes=notes)
    return expense


@transaction.atomic
def approve_expense_edit_request(edit_request, user, notes="", request=None):
    if not can_manage_approval(user):
        raise PermissionDenied("You do not have permission to approve expense edit requests.")
    if edit_request.approval_status == ExpenseEditRequest.ApprovalStatus.APPROVED:
        return edit_request
    if edit_request.approval_status == ExpenseEditRequest.ApprovalStatus.REJECTED:
        raise ValidationError({
            "approval_notes": "This edit request has already been rejected."
        })

    expense = Expense.objects.select_for_update().get(pk=edit_request.expense_id)
    old_data = expense_value_snapshot(expense)
    _apply_expense_values(expense, edit_request.proposed_values or {})
    expense.approval_status = Expense.ApprovalStatus.APPROVED
    expense.approved_by = user
    expense.approved_at = timezone.now()
    expense.approval_notes = notes or ""
    expense.rejected_by = None
    expense.rejected_at = None
    expense.save()

    edit_request.mark_approved(user, notes=notes)
    edit_request.save(
        update_fields=[
            "approval_status",
            "reviewed_by",
            "reviewed_at",
            "approval_notes",
            "updated_at",
        ]
    )

    _notify(
        edit_request.requested_by,
        f"{_expense_label(expense)} edit approved",
        f"Your requested changes to {_expense_label(expense)} were approved.",
        payload={
            "expense_id": expense.id,
            "edit_request_id": edit_request.id,
            "approval_status": edit_request.approval_status,
        },
        notification_type="expense_approval",
    )
    create_audit_log(
        user=user,
        action="expense.edit.approve",
        model_name="ExpenseEditRequest",
        object_id=edit_request.pk,
        object_repr=edit_request,
        old_data=old_data,
        new_data=expense_value_snapshot(expense),
        description=f"{_expense_label(expense)} edit approved",
        request=request,
        extra_metadata={
            "expense_id": expense.id,
            "edit_request_id": edit_request.id,
            "changed_fields": edit_request.changed_fields,
            "reason": notes,
        },
    )
    _broadcast_edit_request_event("approved", edit_request, actor=user, notes=notes)
    return edit_request


@transaction.atomic
def reject_expense(expense, user, notes="", request=None):
    if not can_manage_approval(user):
        raise PermissionDenied("You do not have permission to reject expenses.")
    if not notes:
        raise ValidationError({"approval_notes": "A rejection reason is required."})

    expense.mark_rejected(user, notes=notes)
    expense.save(
        update_fields=[
            "approval_status",
            "approved_by",
            "approved_at",
            "approval_notes",
            "rejected_by",
            "rejected_at",
            "updated_at",
        ]
    )

    _notify(
        expense.created_by,
        f"{_expense_label(expense)} rejected",
        f"{_expense_label(expense)} was rejected. Reason: {notes}",
        payload={
            "expense_id": expense.id,
            "approval_status": expense.approval_status,
            "approval_notes": notes,
        },
        notification_type="expense_approval",
    )
    create_audit_log(
        user=user,
        action="expense.reject",
        model_name="Expense",
        object_id=expense.pk,
        object_repr=expense,
        new_data={
            "approval_status": expense.approval_status,
            "rejected_by": user.id,
            "rejected_at": expense.rejected_at,
            "approval_notes": notes,
        },
        description=f"{_expense_label(expense)} rejected",
        request=request,
        extra_metadata={"reason": notes},
    )
    _broadcast_expense_event("rejected", expense, actor=user, notes=notes)
    return expense


@transaction.atomic
def reject_expense_edit_request(edit_request, user, notes="", request=None):
    if not can_manage_approval(user):
        raise PermissionDenied("You do not have permission to reject expense edit requests.")
    if not notes:
        raise ValidationError({
            "approval_notes": "Please add a short reason so the requester knows what to fix."
        })
    if edit_request.approval_status == ExpenseEditRequest.ApprovalStatus.REJECTED:
        return edit_request
    if edit_request.approval_status == ExpenseEditRequest.ApprovalStatus.APPROVED:
        raise ValidationError({
            "approval_notes": "This edit request has already been approved."
        })

    edit_request.mark_rejected(user, notes=notes)
    edit_request.save(
        update_fields=[
            "approval_status",
            "reviewed_by",
            "reviewed_at",
            "approval_notes",
            "updated_at",
        ]
    )

    expense = edit_request.expense
    _notify(
        edit_request.requested_by,
        f"{_expense_label(expense)} edit rejected",
        f"Your requested changes to {_expense_label(expense)} were not approved. Reason: {notes}",
        payload={
            "expense_id": expense.id,
            "edit_request_id": edit_request.id,
            "approval_status": edit_request.approval_status,
            "approval_notes": notes,
        },
        notification_type="expense_approval",
    )
    create_audit_log(
        user=user,
        action="expense.edit.reject",
        model_name="ExpenseEditRequest",
        object_id=edit_request.pk,
        object_repr=edit_request,
        old_data=edit_request.original_values,
        new_data=edit_request.proposed_values,
        description=f"{_expense_label(expense)} edit rejected",
        request=request,
        extra_metadata={
            "expense_id": expense.id,
            "edit_request_id": edit_request.id,
            "changed_fields": edit_request.changed_fields,
            "reason": notes,
        },
    )
    _broadcast_edit_request_event("rejected", edit_request, actor=user, notes=notes)
    return edit_request


def apply_approval_filters(queryset, params):
    status = params.get("status") or params.get("approval_status")
    creator = params.get("creator") or params.get("created_by")
    approver = params.get("approver") or params.get("approved_by")
    rejected_by = params.get("rejected_by")
    approval_enabled = params.get("approval_enabled")

    if approval_enabled is not None:
        requested_enabled = str(approval_enabled).lower() in {"1", "true", "yes", "on"}
        if requested_enabled != is_expense_approval_enabled():
            return queryset.none()

    if status:
        queryset = queryset.filter(approval_status=status)
    if creator:
        queryset = queryset.filter(created_by_id=creator)
    if approver:
        queryset = queryset.filter(approved_by_id=approver)
    if rejected_by:
        queryset = queryset.filter(rejected_by_id=rejected_by)

    return queryset


def apply_edit_request_filters(queryset, params):
    status = params.get("status") or params.get("approval_status")
    creator = params.get("creator") or params.get("created_by")
    approver = params.get("approver") or params.get("approved_by")
    project = params.get("project")
    expense_scope = params.get("expense_scope")
    expense_type = params.get("expense_type")
    search = params.get("search")
    date_from = params.get("expense_date__gte")
    date_to = params.get("expense_date__lte")

    if status:
        queryset = queryset.filter(approval_status=status)
    if creator:
        queryset = queryset.filter(requested_by_id=creator)
    if approver:
        queryset = queryset.filter(reviewed_by_id=approver)
    if project:
        queryset = queryset.filter(expense__project_id=project)
    if expense_scope:
        queryset = queryset.filter(expense__expense_scope=expense_scope)
    if expense_type:
        queryset = queryset.filter(expense__expense_type=expense_type)
    if date_from:
        queryset = queryset.filter(expense__expense_date__gte=date_from)
    if date_to:
        queryset = queryset.filter(expense__expense_date__lte=date_to)
    if search:
        queryset = queryset.filter(
            Q(expense__description__icontains=search)
            | Q(expense__remarks__icontains=search)
            | Q(expense__paid_to__icontains=search)
            | Q(expense__project__name__icontains=search)
            | Q(requested_by__username__icontains=search)
        )

    return queryset


def approval_history(expense):
    history = []
    if expense.created_at:
        history.append({
            "status": "submitted" if expense.is_pending else "created",
            "at": expense.created_at,
            "by": getattr(expense.created_by, "username", None),
            "notes": "",
        })
    if expense.approved_at:
        history.append({
            "status": "approved",
            "at": expense.approved_at,
            "by": getattr(expense.approved_by, "username", None),
            "notes": expense.approval_notes,
        })
    if expense.rejected_at:
        history.append({
            "status": "rejected",
            "at": expense.rejected_at,
            "by": getattr(expense.rejected_by, "username", None),
            "notes": expense.approval_notes,
        })
    return history


def approval_summary(queryset=None):
    qs = Expense.objects.all() if queryset is None else queryset
    return {
        "pending": qs.filter(approval_status=Expense.ApprovalStatus.PENDING).count(),
        "approved": qs.filter(approval_status=Expense.ApprovalStatus.APPROVED).count(),
        "rejected": qs.filter(approval_status=Expense.ApprovalStatus.REJECTED).count(),
        "approval_enabled": is_expense_approval_enabled(),
    }


def approval_queue_summary(expense_queryset=None, edit_request_queryset=None):
    expense_qs = Expense.objects.all() if expense_queryset is None else expense_queryset
    edit_qs = (
        ExpenseEditRequest.objects.all()
        if edit_request_queryset is None
        else edit_request_queryset
    )
    return {
        "pending": (
            expense_qs.filter(approval_status=Expense.ApprovalStatus.PENDING).count()
            + edit_qs.filter(approval_status=ExpenseEditRequest.ApprovalStatus.PENDING).count()
        ),
        "approved": (
            expense_qs.filter(approval_status=Expense.ApprovalStatus.APPROVED).count()
            + edit_qs.filter(approval_status=ExpenseEditRequest.ApprovalStatus.APPROVED).count()
        ),
        "rejected": (
            expense_qs.filter(approval_status=Expense.ApprovalStatus.REJECTED).count()
            + edit_qs.filter(approval_status=ExpenseEditRequest.ApprovalStatus.REJECTED).count()
        ),
        "approval_enabled": is_expense_approval_enabled(),
    }
