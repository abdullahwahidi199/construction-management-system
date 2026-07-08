from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView,
    LogoutView,
    MeView,
    ProjectAssignmentViewSet,
    # RolePermissionOverrideViewSet,
    PermissionViewSet,
    RolePermissionViewSet,
    UserPermissionOverrideViewSet,
    UserViewSet,
    roles_and_permissions,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="users")
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
    path("", include(router.urls)),
]
