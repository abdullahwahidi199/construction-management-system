from django.contrib.auth import get_user_model
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from accounts.models import Permission, ProjectAssignment, RolePermission, UserPermissionOverride, UserProfile
from Employees.models import Attendance, Employee, Payroll
from expenses.models import Expense
from labour.models import DailyWorker, WorkerAdvance, WorkerAttendance, WorkerPayroll
from project.models import Project
from subcontractor.models import (
    Contract,
    ContractDocument,
    ContractInvoice,
    ContractInvoiceDocument,
    ContractPayment,
    ContractVariation,
    Subcontractor,
)

from .middleware import get_current_request
from .utils import (
    create_audit_log,
    get_changed_fields,
    get_financial_metadata,
    infer_action,
    serialize_instance,
)


TRACKED_MODELS = [
    get_user_model(),
    Permission,
    RolePermission,
    UserPermissionOverride,
    UserProfile,
    ProjectAssignment,
    Project,
    Expense,
    Employee,
    Payroll,
    Attendance,
    DailyWorker,
    WorkerAttendance,
    WorkerAdvance,
    WorkerPayroll,
    Subcontractor,
    Contract,
    ContractPayment,
    ContractVariation,
    ContractInvoice,
    ContractDocument,
    ContractInvoiceDocument,
]


def _request_user(request):
    if request and getattr(request, "user", None) and request.user.is_authenticated:
        return request.user
    return None


@receiver(pre_save)
def capture_old_data(sender, instance, **kwargs):
    if sender not in TRACKED_MODELS or not instance.pk:
        return
    try:
        old = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return
    instance._audit_old_data = serialize_instance(old)


@receiver(post_save)
def audit_saved_model(sender, instance, created, **kwargs):
    if sender not in TRACKED_MODELS:
        return

    request = get_current_request()
    old_data = getattr(instance, "_audit_old_data", {})
    new_data = serialize_instance(instance)
    changes = get_changed_fields(old_data, new_data)

    if not created and not changes:
        return

    model_name = sender.__name__
    financial = get_financial_metadata(model_name, old_data, new_data, request)
    metadata = {
        "changed_fields": changes,
        **financial,
    }
    if sender is get_user_model() and created:
        action = "user.create"
    elif sender is get_user_model():
        action = "user.update"
    elif sender is UserProfile and "role" in changes:
        action = "user.role_change"
    elif sender in {Permission, RolePermission, UserPermissionOverride}:
        action = "permission.change"
    elif sender is Project and "status" in changes:
        action = "project.status_change"
    elif sender is Project and ("estimated_budget" in changes or "budget_currency" in changes):
        action = "project.budget_change"
    elif financial["currency_change"]:
        action = f"{instance._meta.model_name}.currency_change"
    else:
        action = infer_action(instance, created=created)

    create_audit_log(
        user=_request_user(request),
        action=action,
        model_name=model_name,
        object_id=instance.pk,
        object_repr=instance,
        old_data=old_data,
        new_data=new_data,
        description=f"{'Created' if created else 'Updated'} {model_name} {instance}",
        request=request,
        extra_metadata=metadata,
    )


@receiver(post_delete)
def audit_deleted_model(sender, instance, **kwargs):
    if sender not in TRACKED_MODELS:
        return
    request = get_current_request()
    old_data = serialize_instance(instance)
    create_audit_log(
        user=_request_user(request),
        action=infer_action(instance, deleted=True),
        model_name=sender.__name__,
        object_id=instance.pk,
        object_repr=instance,
        old_data=old_data,
        new_data={},
        description=f"Deleted {sender.__name__} {instance}",
        request=request,
        extra_metadata=get_financial_metadata(sender.__name__, old_data, {}, request),
    )

