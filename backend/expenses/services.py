from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from accounts.models import ApplicationSettings
from accounts.services import has_permission
from audit.utils import create_audit_log

from .models import Expense


EXPENSE_APPROVAL_SETTINGS_KEY = "expense_approval"


def get_expense_approval_settings():
    settings = ApplicationSettings.get_solo()
    value = settings.app_settings.get(EXPENSE_APPROVAL_SETTINGS_KEY, {})
    if not isinstance(value, dict):
        value = {}
    return {"enabled": bool(value.get("enabled", False))}


def set_expense_approval_settings(enabled, user=None):
    settings = ApplicationSettings.get_solo()
    settings.app_settings[EXPENSE_APPROVAL_SETTINGS_KEY] = {"enabled": bool(enabled)}
    settings.updated_by = user
    settings.save(update_fields=["app_settings", "updated_by", "updated_at"])
    return get_expense_approval_settings()


def is_expense_approval_enabled():
    return get_expense_approval_settings()["enabled"]


def approved_expenses_queryset():
    return Expense.objects.for_financials()


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


def _broadcast_expense_event(event, expense, actor=None, notes=""):
    if event == "submitted":
        return
    payload = _expense_event_payload(event, expense, actor=actor, notes=notes)
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


def update_expense(serializer, user, request=None):
    expense = serializer.instance
    approval_enabled = is_expense_approval_enabled()
    ensure_user_can_edit_expense(user, expense)

    old_status = expense.approval_status
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
    qs = queryset or Expense.objects.all()
    return {
        "pending": qs.filter(approval_status=Expense.ApprovalStatus.PENDING).count(),
        "approved": qs.filter(approval_status=Expense.ApprovalStatus.APPROVED).count(),
        "rejected": qs.filter(approval_status=Expense.ApprovalStatus.REJECTED).count(),
        "approval_enabled": is_expense_approval_enabled(),
    }
