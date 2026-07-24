from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from .constants import Effect, Role


class CustomRole(models.Model):
    value = models.SlugField(max_length=32, unique=True)
    label = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("label",)
        verbose_name = _("Custom role")
        verbose_name_plural = _("Custom roles")

    def __str__(self):
        return self.label


class Permission(models.Model):
    code = models.CharField(max_length=120, unique=True)
    name = models.CharField(max_length=255)

    module = models.CharField(max_length=100)

    def __str__(self):
        return self.name
    
class RolePermission(models.Model):
    role = models.CharField(
        max_length=32,
        db_index=True,
    )

    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
    )

    class Meta:
        unique_together = ("role", "permission")
class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.CharField(
        max_length=32,
        default=Role.DATA_ENTRY,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("User profile")
        verbose_name_plural = _("User profiles")

    def __str__(self):
        return f"{self.user.get_username()} ({self.role})"





class UserPermissionOverride(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="permission_overrides",
    )
    permission = models.ForeignKey(
    Permission,
    on_delete=models.CASCADE,
    related_name="user_overrides",
)
    effect = models.CharField(
        max_length=10,
        choices=Effect.CHOICES,
        default=Effect.ALLOW,
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "permission")
        ordering = ("user__username", "permission")
        verbose_name = _("User permission override")
        verbose_name_plural = _("User permission overrides")

    def __str__(self):
        return f"{self.user.get_username()}:{self.permission}:{self.effect}"


class ProjectAssignment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_assignments",
    )
    project = models.ForeignKey(
        "project.Project",
        on_delete=models.CASCADE,
        related_name="user_assignments",
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_projects",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "project")
        ordering = ("user__username", "project__name")
        verbose_name = _("Project assignment")
        verbose_name_plural = _("Project assignments")

    def __str__(self):
        return f"{self.user.get_username()} -> {self.project}"


class ApplicationSettings(models.Model):
    app_settings = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="updated_application_settings",
    )

    class Meta:
        verbose_name = _("Application settings")
        verbose_name_plural = _("Application settings")

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    @property
    def calendar_settings(self):
        from common.calendar_utils import normalize_calendar_settings

        return normalize_calendar_settings(self.app_settings.get("calendar_settings"))

    def set_calendar_settings(self, value):
        from common.calendar_utils import normalize_calendar_settings

        self.app_settings["calendar_settings"] = normalize_calendar_settings(value)
