from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsAdminRole
from .serializers import (
    LoginSerializer,
    ProjectAssignmentSerializer,
    RolePermissionOverrideSerializer,
    UserCreateSerializer,
    UserPermissionOverrideSerializer,
    UserSerializer,
    permissions_payload,
    role_payload,
)
from .services import get_effective_permissions, get_user_role
from .models import ProjectAssignment, RolePermissionOverride, UserPermissionOverride

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


class RolePermissionOverrideViewSet(viewsets.ModelViewSet):
    queryset = RolePermissionOverride.objects.all()
    serializer_class = RolePermissionOverrideSerializer
    permission_classes = [IsAdminRole]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        override, _ = RolePermissionOverride.objects.update_or_create(
            role=serializer.validated_data["role"],
            permission=serializer.validated_data["permission"],
            defaults={"effect": serializer.validated_data["effect"]},
        )
        return Response(self.get_serializer(override).data, status=status.HTTP_201_CREATED)


class UserPermissionOverrideViewSet(viewsets.ModelViewSet):
    queryset = UserPermissionOverride.objects.select_related("user")
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
