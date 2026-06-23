from .constants import DEFAULT_ROLE_PERMISSIONS, Effect, Role
from .models import RolePermissionOverride, UserPermissionOverride, UserProfile


def get_user_role(user):
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return Role.ADMIN
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile.role


def get_effective_permissions(user):
    role = get_user_role(user)
    if role == Role.ADMIN:
        return {"*"}

    permissions = set(DEFAULT_ROLE_PERMISSIONS.get(role, set()))

    role_overrides = RolePermissionOverride.objects.filter(role=role)
    for override in role_overrides:
        if override.effect == Effect.ALLOW:
            permissions.add(override.permission)
        else:
            permissions.discard(override.permission)

    user_overrides = UserPermissionOverride.objects.filter(user=user)
    for override in user_overrides:
        if override.effect == Effect.ALLOW:
            permissions.add(override.permission)
        else:
            permissions.discard(override.permission)

    return permissions


def has_permission(user, permission):
    permissions = get_effective_permissions(user)
    return "*" in permissions or permission in permissions


def user_can_manage_accounts(user):
    return has_permission(user, "users.view") or has_permission(user, "roles.manage")
