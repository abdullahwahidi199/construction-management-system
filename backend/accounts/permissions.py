from rest_framework.permissions import BasePermission

from .services import has_permission


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
            return has_permission(request.user, "*")

        action = getattr(view, "action", None)
        action_requirements = getattr(view, "rbac_action_permissions", {})
        if action in action_requirements:
            requirements = action_requirements[action]
            if isinstance(requirements, dict):
                method = request.method.upper()
                requirements = requirements.get(method, requirements.get("*", ()))
            return self._has_any(request.user, requirements)

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
            return has_permission(request.user, "*")

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

    def _has_any(self, user, permissions):
        return any(has_permission(user, permission) for permission in permissions)


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and has_permission(request.user, "*")
        )


class AccountPermission(BasePermission):
    resource = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        requirements = getattr(view, "permission_requirements", None)
        if requirements:
            required = requirements.get(getattr(view, "action", None), requirements.get("*", ()))
            return self._has_any(request.user, required)

        resource = getattr(view, "rbac_resource", self.resource)
        if not resource:
            return has_permission(request.user, "*")

        action = getattr(view, "action", None)
        if action in SAFE_ACTIONS:
            return self._has_any(request.user, (f"{resource}.view", f"{resource}.manage"))
        if action in CREATE_ACTIONS:
            return self._has_any(request.user, (f"{resource}.create", f"{resource}.manage"))
        if action in UPDATE_ACTIONS:
            return self._has_any(request.user, (f"{resource}.update", f"{resource}.manage"))
        if action in DELETE_ACTIONS:
            return self._has_any(request.user, (f"{resource}.delete", f"{resource}.manage"))

        return self._has_any(request.user, (f"{resource}.manage",))

    def _has_any(self, user, permissions):
        return any(has_permission(user, permission) for permission in permissions)
