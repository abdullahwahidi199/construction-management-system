from django.contrib.auth import authenticate, get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from common.calendar_utils import DEFAULT_CALENDAR_SETTINGS, normalize_calendar_settings
from .constants import Role
from .models import (
    ApplicationSettings,
    CustomRole,
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
        if not CustomRole.objects.filter(value=value).exists():
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


class CustomRoleSerializer(serializers.ModelSerializer):
    permissions_count = serializers.SerializerMethodField()

    class Meta:
        model = CustomRole
        fields = (
            "id",
            "value",
            "label",
            "description",
            "is_system",
            "permissions_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "is_system", "permissions_count", "created_at", "updated_at")
        extra_kwargs = {"value": {"required": False}}

    def get_permissions_count(self, obj):
        return RolePermission.objects.filter(role=obj.value).count()

    def validate_value(self, value):
        normalized = (value or "").strip().lower().replace("-", "_")
        if not normalized:
            raise serializers.ValidationError(_("Role key is required."))
        if normalized in {"*", "superuser"}:
            raise serializers.ValidationError(_("This role key is reserved."))
        if len(normalized) > 32:
            raise serializers.ValidationError(_("Role key must be 32 characters or fewer."))
        if not normalized[0].isalpha():
            raise serializers.ValidationError(_("Role key must start with a letter."))
        if not all(char.isalnum() or char == "_" for char in normalized):
            raise serializers.ValidationError(_("Use only letters, numbers, and underscores."))
        return normalized

    def validate(self, attrs):
        if not self.instance and not attrs.get("value"):
            label = attrs.get("label", "")
            attrs["value"] = "_".join(label.strip().lower().split())
            attrs["value"] = self.validate_value(attrs["value"])
        if self.instance and "value" in attrs and attrs["value"] != self.instance.value:
            raise serializers.ValidationError({"value": _("Role key cannot be changed.")})
        return attrs


def role_payload():
    roles = CustomRole.objects.all()
    if roles.exists():
        return CustomRoleSerializer(roles, many=True).data
    return [{"value": value, "label": str(label), "is_system": True} for value, label in Role.CHOICES]


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

    def validate_role(self, value):
        if not CustomRole.objects.filter(value=value).exists():
            raise serializers.ValidationError(_("Invalid role."))
        return value


class CalendarSettingsSerializer(serializers.Serializer):
    default_calendar = serializers.ChoiceField(
        choices=["shamsi", "gregorian"],
        default="shamsi",
    )
    modules = serializers.DictField(
        child=serializers.ChoiceField(choices=["inherit", "shamsi", "gregorian"]),
        required=False,
    )

    def to_representation(self, instance):
        if isinstance(instance, ApplicationSettings):
            return instance.calendar_settings
        return normalize_calendar_settings(instance or DEFAULT_CALENDAR_SETTINGS)

    def validate(self, attrs):
        return normalize_calendar_settings(attrs)
