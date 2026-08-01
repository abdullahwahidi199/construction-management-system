from copy import deepcopy

from django.contrib.auth import authenticate, get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from common.calendar_utils import DEFAULT_CALENDAR_SETTINGS, normalize_calendar_settings
from .constants import Role
from .models import (
    ApplicationSettings,
    CompanyInformation,
    CustomRole,
    ProjectAssignment,
    UserPermissionOverride,
    UserProfile,
    Permission,
    RolePermission,
)
from .services import get_effective_permissions, get_user_role

User = get_user_model()

MAX_BRANDING_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_THEMES = {"light", "dark", "construction"}
ALLOWED_LANGUAGES = {"en", "dr", "ps"}

DEFAULT_SETTINGS_PREFERENCES = {
    "appearance": {
        "theme": "construction",
    },
    "language": {
        "language": "en",
    },
    "notifications": {
        "in_app": True,
        "email": False,
        "real_time": True,
    },
    "security": {
        "session_timeout_minutes": 60,
        "password_min_length": 8,
        "require_uppercase": True,
        "require_number": True,
        "login_lockout_enabled": True,
    },
}


def _as_bool(value, default=False):
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def normalize_settings_preferences(value=None):
    raw = value or {}
    normalized = deepcopy(DEFAULT_SETTINGS_PREFERENCES)

    appearance = raw.get("appearance") or {}
    theme = appearance.get("theme", normalized["appearance"]["theme"])
    if theme == "system":
        theme = "construction"
    if theme not in ALLOWED_THEMES:
        raise serializers.ValidationError({"appearance": {"theme": _("Invalid theme.")}})
    normalized["appearance"]["theme"] = theme

    language = raw.get("language") or {}
    lang = language.get("language", normalized["language"]["language"])
    if lang not in ALLOWED_LANGUAGES:
        raise serializers.ValidationError({"language": {"language": _("Invalid language.")}})
    normalized["language"]["language"] = lang

    notifications = raw.get("notifications") or {}
    for key, default in normalized["notifications"].items():
        normalized["notifications"][key] = _as_bool(notifications.get(key), default)

    security = raw.get("security") or {}
    timeout = security.get(
        "session_timeout_minutes",
        normalized["security"]["session_timeout_minutes"],
    )
    try:
        timeout = int(timeout)
    except (TypeError, ValueError):
        raise serializers.ValidationError(
            {"security": {"session_timeout_minutes": _("Session timeout must be a number.")}}
        )
    if timeout < 5 or timeout > 1440:
        raise serializers.ValidationError(
            {"security": {"session_timeout_minutes": _("Session timeout must be between 5 and 1440 minutes.")}}
        )
    normalized["security"]["session_timeout_minutes"] = timeout

    min_length = security.get(
        "password_min_length",
        normalized["security"]["password_min_length"],
    )
    try:
        min_length = int(min_length)
    except (TypeError, ValueError):
        raise serializers.ValidationError(
            {"security": {"password_min_length": _("Password length must be a number.")}}
        )
    if min_length < 6 or min_length > 128:
        raise serializers.ValidationError(
            {"security": {"password_min_length": _("Password length must be between 6 and 128 characters.")}}
        )
    normalized["security"]["password_min_length"] = min_length

    for key in ("require_uppercase", "require_number", "login_lockout_enabled"):
        normalized["security"][key] = _as_bool(
            security.get(key),
            normalized["security"][key],
        )

    return normalized


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
    work_calendar = serializers.DictField(required=False)

    def to_representation(self, instance):
        if isinstance(instance, ApplicationSettings):
            return instance.calendar_settings
        return normalize_calendar_settings(instance or DEFAULT_CALENDAR_SETTINGS)

    def validate(self, attrs):
        try:
            return normalize_calendar_settings(attrs)
        except ValueError as exc:
            raise serializers.ValidationError({"work_calendar": str(exc)}) from exc


class CompanyInformationSerializer(serializers.ModelSerializer):
    company_logo_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()
    clear_company_logo = serializers.BooleanField(write_only=True, required=False)
    clear_favicon = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = CompanyInformation
        fields = (
            "id",
            "tenant_identifier",
            "company_name",
            "legal_company_name",
            "company_logo",
            "company_logo_url",
            "favicon",
            "favicon_url",
            "address",
            "city",
            "province_state",
            "country",
            "postal_code",
            "phone_number",
            "alternative_phone",
            "email",
            "website",
            "tax_number",
            "registration_number",
            "company_description",
            "print_footer_text",
            "created_at",
            "updated_at",
            "updated_by",
            "clear_company_logo",
            "clear_favicon",
        )
        read_only_fields = (
            "id",
            "tenant_identifier",
            "company_logo_url",
            "favicon_url",
            "created_at",
            "updated_at",
            "updated_by",
        )

    def _absolute_file_url(self, file_field):
        if not file_field:
            return ""
        try:
            url = file_field.url
        except ValueError:
            return ""
        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def get_company_logo_url(self, obj):
        return self._absolute_file_url(obj.company_logo)

    def get_favicon_url(self, obj):
        return self._absolute_file_url(obj.favicon)

    def validate_company_name(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError(_("Company name is required."))
        return value

    def validate_company_logo(self, value):
        if value and value.size > MAX_BRANDING_IMAGE_SIZE:
            raise serializers.ValidationError(_("Company logo must be 5MB or smaller."))
        return value

    def validate_favicon(self, value):
        if value and value.size > MAX_BRANDING_IMAGE_SIZE:
            raise serializers.ValidationError(_("Favicon must be 5MB or smaller."))
        return value

    def validate(self, attrs):
        for field in (
            "legal_company_name",
            "city",
            "province_state",
            "country",
            "postal_code",
            "phone_number",
            "alternative_phone",
            "email",
            "website",
            "tax_number",
            "registration_number",
        ):
            if field in attrs and isinstance(attrs[field], str):
                attrs[field] = attrs[field].strip()
        return attrs

    def update(self, instance, validated_data):
        clear_company_logo = validated_data.pop("clear_company_logo", False)
        clear_favicon = validated_data.pop("clear_favicon", False)

        if clear_company_logo and instance.company_logo:
            instance.company_logo.delete(save=False)
            instance.company_logo = None

        if clear_favicon and instance.favicon:
            instance.favicon.delete(save=False)
            instance.favicon = None

        return super().update(instance, validated_data)


class SettingsPreferencesSerializer(serializers.Serializer):
    appearance = serializers.DictField(required=False)
    language = serializers.DictField(required=False)
    notifications = serializers.DictField(required=False)
    security = serializers.DictField(required=False)

    def to_representation(self, instance):
        if isinstance(instance, ApplicationSettings):
            return normalize_settings_preferences(
                instance.app_settings.get("settings_preferences")
            )
        return normalize_settings_preferences(instance)

    def validate(self, attrs):
        return normalize_settings_preferences(attrs)
