from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied, ValidationError

from audit.utils import create_audit_log

from .permissions import AccountPermission
from .throttles import AuthRateLimitExceeded, LoginFailedRateThrottle
from .serializers import (
    CalendarSettingsSerializer,
    CustomRoleSerializer,
    LoginSerializer,
    ProjectAssignmentSerializer,
    PermissionSerializer,
RolePermissionSerializer,
    UserCreateSerializer,
    UserPermissionOverrideSerializer,
    UserSerializer,
    RolePermissionCreateSerializer,
    permissions_payload,
    role_payload,
)
from .services import get_effective_permissions, get_user_role, has_permission
from .models import (
    ApplicationSettings,
    CustomRole,
    ProjectAssignment,
    UserPermissionOverride,
    Permission,
    RolePermission,
)

User = get_user_model()


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginFailedRateThrottle]

    def throttled(self, request, wait):
        raise AuthRateLimitExceeded(wait=wait)

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            for throttle in self.get_throttles():
                if isinstance(throttle, LoginFailedRateThrottle):
                    throttle.record_failure(request)
            create_audit_log(
                user=None,
                action="auth.login_failed",
                status="failed",
                description=f"Failed login attempt for {request.data.get('username', '')}",
                request=request,
                extra_metadata={"username": request.data.get("username", "")},
            )
            raise
        user = serializer.validated_data["user"]
        for throttle in self.get_throttles():
            if isinstance(throttle, LoginFailedRateThrottle):
                throttle.reset(request)
        token, _ = Token.objects.get_or_create(user=user)
        create_audit_log(
            user=user,
            action="auth.login",
            description=f"User {user.get_username()} logged in",
            request=request,
        )
        return Response(
            {
                "token": token.key,
                "user": UserSerializer(user).data,
                "role": get_user_role(user),
                "permissions": sorted(get_effective_permissions(user)),
            }
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        create_audit_log(
            user=request.user,
            action="auth.logout",
            description=f"User {request.user.get_username()} logged out",
            request=request,
        )
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
# ... other imports ...

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("profile").order_by("username")
    permission_classes = [AccountPermission]
    rbac_resource = "users"
    permission_requirements = {
        "list": ("users.view",),
        "retrieve": ("users.view",),
        "create": ("users.create",),
        "update": ("users.update",),
        "partial_update": ("users.update",),
        "destroy": ("users.delete",),
        "set_role": ("users.update", "roles.manage"),
        "set_password": ("users.update",),
        "*": ("users.view",),
    }

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    @action(detail=True, methods=["post"])
    def set_role(self, request, pk=None):
        user = self.get_object()
        serializer = UserSerializer(user, data={"role": request.data.get("role")}, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    # --- ADD THIS NEW ACTION FOR SECURE PASSWORD UPDATES ---
    @action(detail=True, methods=["post"])
    def set_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get("new_password")
        
        if not new_password or len(new_password) < 6:
            return Response(
                {"error": "Password must be at least 6 characters."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user.set_password(new_password) # Securely hashes the password
        user.save()
        create_audit_log(
            user=request.user,
            action="auth.password_change",
            model_name="User",
            object_id=user.pk,
            object_repr=user.get_username(),
            description=f"Password changed for {user.get_username()}",
            request=request,
        )
        return Response({"status": "Password updated successfully"})


# class RolePermissionOverrideViewSet(viewsets.ModelViewSet):
#     queryset = RolePermissionOverride.objects.all()
#     serializer_class = RolePermissionOverrideSerializer
#     permission_classes = [IsAdminRole]

#     def create(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         override, _ = RolePermissionOverride.objects.update_or_create(
#             role=serializer.validated_data["role"],
#             permission=serializer.validated_data["permission"],
#             defaults={"effect": serializer.validated_data["effect"]},
#         )
#         return Response(self.get_serializer(override).data, status=status.HTTP_201_CREATED)


class UserPermissionOverrideViewSet(viewsets.ModelViewSet):
    queryset = UserPermissionOverride.objects.select_related(
    "user",
    "permission",
)
    serializer_class = UserPermissionOverrideSerializer
    permission_classes = [AccountPermission]
    permission_requirements = {
        "list": ("permissions.manage",),
        "retrieve": ("permissions.manage",),
        "create": ("permissions.manage",),
        "update": ("permissions.manage",),
        "partial_update": ("permissions.manage",),
        "destroy": ("permissions.manage",),
        "*": ("permissions.manage",),
    }

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        override, _ = UserPermissionOverride.objects.update_or_create(
            user=serializer.validated_data["user"],
            permission=serializer.validated_data["permission"],
            defaults={"effect": serializer.validated_data["effect"]},
        )
        return Response(self.get_serializer(override).data, status=status.HTTP_201_CREATED)


class ProjectAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ProjectAssignment.objects.select_related("user", "project", "assigned_by")
    serializer_class = ProjectAssignmentSerializer
    permission_classes = [AccountPermission]
    permission_requirements = {
        "list": ("users.view", "users.manage"),
        "retrieve": ("users.view", "users.manage"),
        "create": ("users.update", "users.manage"),
        "update": ("users.update", "users.manage"),
        "partial_update": ("users.update", "users.manage"),
        "destroy": ("users.update", "users.manage"),
        "*": ("users.manage",),
    }

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def roles_and_permissions(request):
    if not (
        has_permission(request.user, "roles.view")
        or has_permission(request.user, "roles.create")
        or has_permission(request.user, "roles.update")
        or has_permission(request.user, "roles.delete")
        or has_permission(request.user, "roles.manage")
        or has_permission(request.user, "permissions.view")
        or has_permission(request.user, "permissions.manage")
        or has_permission(request.user, "users.view")
        or has_permission(request.user, "users.create")
        or has_permission(request.user, "users.update")
    ):
        raise PermissionDenied()
    return Response(
        {
            "roles": role_payload(),
            "permissions": permissions_payload(),
        }
    )

class PermissionViewSet(ModelViewSet):
    queryset = Permission.objects.all().order_by(
        "module",
        "name",
    )
    serializer_class = PermissionSerializer
    permission_classes = [AccountPermission]
    permission_requirements = {
        "list": ("permissions.view", "permissions.manage", "roles.view", "roles.create", "roles.update", "roles.delete"),
        "retrieve": ("permissions.view", "permissions.manage", "roles.view", "roles.create", "roles.update", "roles.delete"),
        "create": ("permissions.manage",),
        "update": ("permissions.manage",),
        "partial_update": ("permissions.manage",),
        "destroy": ("permissions.manage",),
        "*": ("permissions.manage",),
    }
from rest_framework.viewsets import ModelViewSet


class CalendarSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(CalendarSettingsSerializer(ApplicationSettings.get_solo()).data)

    def put(self, request):
        if not has_permission(request.user, "settings.manage"):
            raise PermissionDenied()
        settings_obj = ApplicationSettings.get_solo()
        serializer = CalendarSettingsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        settings_obj.set_calendar_settings(serializer.validated_data)
        settings_obj.updated_by = request.user
        settings_obj.save(update_fields=["app_settings", "updated_by", "updated_at"])
        return Response(CalendarSettingsSerializer(settings_obj).data)

class RolePermissionViewSet(ModelViewSet):
    queryset = RolePermission.objects.select_related(
        "permission"
    )

    permission_classes = [AccountPermission]
    permission_requirements = {
        "list": ("permissions.view", "permissions.manage", "roles.view", "roles.create", "roles.update", "roles.delete"),
        "retrieve": ("permissions.view", "permissions.manage", "roles.view", "roles.create", "roles.update", "roles.delete"),
        "create": ("permissions.manage",),
        "update": ("permissions.manage",),
        "partial_update": ("permissions.manage",),
        "destroy": ("permissions.manage",),
        "*": ("permissions.manage",),
    }

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return RolePermissionCreateSerializer

        return RolePermissionSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        role_permission, _ = RolePermission.objects.get_or_create(
            role=serializer.validated_data["role"],
            permission=serializer.validated_data["permission"],
        )

        return Response(
            RolePermissionSerializer(role_permission).data,
            status=status.HTTP_201_CREATED,
        )


class CustomRoleViewSet(ModelViewSet):
    queryset = CustomRole.objects.all()
    serializer_class = CustomRoleSerializer
    permission_classes = [AccountPermission]
    rbac_resource = "roles"

    def perform_destroy(self, instance):
        if instance.is_system:
            raise ValidationError({"detail": "System roles cannot be deleted."})
        if User.objects.filter(profile__role=instance.value).exists():
            raise ValidationError({"detail": "This role is assigned to users."})
        RolePermission.objects.filter(role=instance.value).delete()
        instance.delete()
