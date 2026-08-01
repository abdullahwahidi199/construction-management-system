from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CalendarSettingsView,
    CompanyInformationView,
    CustomRoleViewSet,
    LoginView,
    LogoutView,
    MeView,
    ProjectAssignmentViewSet,
    # RolePermissionOverrideViewSet,
    PermissionViewSet,
    RolePermissionViewSet,
    SettingsAuditLogView,
    SettingsPreferencesView,
    UserPermissionOverrideViewSet,
    UserViewSet,
    roles_and_permissions,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="users")
router.register("roles", CustomRoleViewSet, basename="roles")
router.register(
    "permissions",
    PermissionViewSet
)

router.register("role-permissions", RolePermissionViewSet, basename="role-permissions")
router.register("user-permissions", UserPermissionOverrideViewSet, basename="user-permissions")
router.register("project-assignments", ProjectAssignmentViewSet, basename="project-assignments")

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("meta/", roles_and_permissions, name="roles-permissions"),
    path("settings/calendar/", CalendarSettingsView.as_view(), name="calendar-settings"),
    path("settings/company/", CompanyInformationView.as_view(), name="company-settings"),
    path("settings/preferences/", SettingsPreferencesView.as_view(), name="settings-preferences"),
    path("settings/audit-logs/", SettingsAuditLogView.as_view(), name="settings-audit-logs"),
    path("", include(router.urls)),
]
