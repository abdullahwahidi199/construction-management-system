from rest_framework.permissions import BasePermission

from accounts.services import has_permission


class AuditLogPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if has_permission(request.user, "*"):
            return True

        action = getattr(view, "action", "")
        if action in {"list", "retrieve", "summary"}:
            return has_permission(request.user, "audit_logs.view")
        if action in {"export_csv", "export_excel"}:
            return has_permission(request.user, "audit_logs.export")
        if action in {"destroy"}:
            return has_permission(request.user, "audit_logs.delete")
        if action in {"retention", "update_retention"}:
            return has_permission(request.user, "audit_logs.manage_retention")
        return False
