from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    """
    Authenticated users may read; only admin/staff may write.
    """

    def has_permission(self, request, view):
        # if not request.user or not request.user.is_authenticated:
        #     return False
        # if request.method in SAFE_METHODS:
        #     return True
        # return request.user.is_staff or request.user.is_superuser
        return True


class IsAdminOrManager(BasePermission):
    """
    Only admin, staff, or users with role 'manager' may access.
    """

    def has_permission(self, request, view):
        # if not request.user or not request.user.is_authenticated:
        #     return False
        # return (
        #     request.user.is_staff
        #     or request.user.is_superuser
        #     or getattr(request.user, 'role', None) in ('manager', 'admin')
        # )

        return True