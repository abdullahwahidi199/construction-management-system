from django.contrib.auth import authenticate, get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .constants import Role
from .models import (
    ProjectAssignment,
    UserPermissionOverride,
    UserProfile,
    Permission,
    RolePermission,
)
from .services import get_effective_permissions, get_user_role

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs.get("username"),
            password=attrs.get("password"),
        )
        if not user:
            raise serializers.ValidationError(_("Invalid username or password."))
        if not user.is_active:
            raise serializers.ValidationError(_("This account is disabled."))
        attrs["user"] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(write_only=True, required=False)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "role",
            "permissions",
        )
        read_only_fields = ("id", "permissions")

    def get_permissions(self, obj):
        return sorted(get_effective_permissions(obj))

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["role"] = get_user_role(instance)
        return data

    def validate_role(self, value):
        valid_roles = {role for role, _ in Role.CHOICES}
        if value not in valid_roles:
            raise serializers.ValidationError(_("Invalid role."))
        return value

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        instance = super().update(instance, validated_data)
        if role:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            profile.role = role
            profile.save(update_fields=["role", "updated_at"])
        return instance


class UserCreateSerializer(UserSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ("password",)

    def create(self, validated_data):
        role = validated_data.pop("role", Role.DATA_ENTRY)
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        user.profile.role = role
        user.profile.save(update_fields=["role", "updated_at"])
        return user


# class RolePermissionOverrideSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = RolePermissionOverride
#         fields = ("id", "role", "permission", "effect", "updated_at")
#         read_only_fields = ("id", "updated_at")


class UserPermissionOverrideSerializer(serializers.ModelSerializer):

    permission_code = serializers.CharField(
        source="permission.code",
        read_only=True,
    )

    class Meta:
        model = UserPermissionOverride

        fields = (
            "id",
            "user",
            "permission",
            "permission_code",
            "effect",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "updated_at",
            "permission_code",
        )

class ProjectAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectAssignment
        fields = ("id", "user", "project", "assigned_by", "created_at")
        read_only_fields = ("id", "assigned_by", "created_at")


class RoleSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


def role_payload():
    return [{"value": value, "label": str(label)} for value, label in Role.CHOICES]


# def permissions_payload():
#     return AVAILABLE_PERMISSIONS
def permissions_payload():
    return PermissionSerializer(
        Permission.objects.all(),
        many=True,
    ).data

class PermissionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Permission
        fields = "__all__"


class RolePermissionSerializer(serializers.ModelSerializer):

    permission_code = serializers.CharField(
        source="permission.code",
        read_only=True,
    )

    permission_name = serializers.CharField(
        source="permission.name",
        read_only=True,
    )

    module = serializers.CharField(
        source="permission.module",
        read_only=True,
    )

    class Meta:
        model = RolePermission

        fields = (
            "id",
            "role",
            "permission",
            "permission_code",
            "permission_name",
            "module",
        )

class RolePermissionCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = RolePermission
        fields = (
            "id",
            "role",
            "permission",
        )