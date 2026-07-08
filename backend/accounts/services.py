from .constants import Effect, Role
from .models import  UserPermissionOverride, UserProfile


def get_user_role(user):
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return Role.ADMIN
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile.role


from .constants import Effect, Role
from .models import RolePermission


def get_effective_permissions(user):

    role = get_user_role(user)

    if role == Role.ADMIN:
        return {"*"}

    permissions = set(
        RolePermission.objects.filter(
            role=role
        ).values_list(
            "permission__code",
            flat=True,
        )
    )

    for override in user.permission_overrides.select_related(
        "permission"
    ):

        code = override.permission.code

        if override.effect == Effect.ALLOW:
            permissions.add(code)

        else:
            permissions.discard(code)

    return permissions


def has_permission(user, permission):
    permissions = get_effective_permissions(user)
    return "*" in permissions or permission in permissions


def user_can_manage_accounts(user):
    return has_permission(user, "users.view") or has_permission(user, "roles.manage")
