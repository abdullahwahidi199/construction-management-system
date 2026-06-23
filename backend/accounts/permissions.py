from rest_framework.permissions import BasePermission

from .constants import Role
from .services import get_user_role, has_permission


SAFE_ACTIONS = {"list", "retrieve"}
CREATE_ACTIONS = {"create"}
UPDATE_ACTIONS = {"update", "partial_update"}
DELETE_ACTIONS = {"destroy"}


class RBACPermission(BasePermission):
    """
    Checks a view's `rbac_resource` against action-derived permission keys.
    Examples: projects.view, expenses.create, expenses.update_own.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        resource = getattr(view, "rbac_resource", None)
        if not resource:
            return get_user_role(request.user) == Role.ADMIN

        action = getattr(view, "action", None)
        if action in SAFE_ACTIONS:
            return self._allowed(request.user, resource, ("view", "view_assigned"))
        if action in CREATE_ACTIONS:
            return self._allowed(request.user, resource, ("create",))
        if action in UPDATE_ACTIONS:
            return self._allowed(request.user, resource, ("update", "update_own"))
        if action in DELETE_ACTIONS:
            return self._allowed(request.user, resource, ("delete",))

        method = request.method.upper()
        if method in {"GET", "HEAD", "OPTIONS"}:
            return self._allowed(request.user, resource, ("view", "view_assigned"))
        if method == "POST":
            return self._allowed(request.user, resource, ("create",))
        if method in {"PUT", "PATCH"}:
            return self._allowed(request.user, resource, ("update", "update_own"))
        if method == "DELETE":
            return self._allowed(request.user, resource, ("delete",))

        return False

    def has_object_permission(self, request, view, obj):
        resource = getattr(view, "rbac_resource", None)
        if not resource:
            return get_user_role(request.user) == Role.ADMIN

        action = getattr(view, "action", None)
        if action in SAFE_ACTIONS or request.method in {"GET", "HEAD", "OPTIONS"}:
            return self.has_permission(request, view)

        if action in UPDATE_ACTIONS or request.method in {"PUT", "PATCH"}:
            if has_permission(request.user, f"{resource}.update"):
                return True
            if has_permission(request.user, f"{resource}.update_own"):
                return getattr(obj, "created_by_id", None) == request.user.id
            return False

        return self.has_permission(request, view)

    def _allowed(self, user, resource, actions):
        return any(has_permission(user, f"{resource}.{action}") for action in actions)


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and get_user_role(request.user) == Role.ADMIN)
