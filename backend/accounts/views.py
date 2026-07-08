from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .permissions import IsAdminRole
from .serializers import (
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
from .services import get_effective_permissions, get_user_role
from .models import (
    ProjectAssignment,
    UserPermissionOverride,
    Permission,
    RolePermission,
)

User = get_user_model()


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
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
    permission_classes = [IsAdminRole]

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
    permission_classes = [IsAdminRole]

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
    permission_classes = [IsAdminRole]

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def roles_and_permissions(request):
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
    permission_classes = [IsAdminRole]
from rest_framework.viewsets import ModelViewSet

class RolePermissionViewSet(ModelViewSet):
    queryset = RolePermission.objects.select_related(
        "permission"
    )

    permission_classes = [IsAdminRole]

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