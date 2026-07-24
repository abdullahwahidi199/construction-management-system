from django.contrib import admin

from .models import (
    CustomRole,
    ProjectAssignment,
    UserPermissionOverride,
    UserProfile,
)


@admin.register(CustomRole)
class CustomRoleAdmin(admin.ModelAdmin):
    list_display = ("label", "value", "is_system", "updated_at")
    list_filter = ("is_system",)
    search_fields = ("label", "value")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "updated_at")
    list_filter = ("role",)
    search_fields = ("user__username", "user__email")


admin.site.register(UserPermissionOverride)
admin.site.register(ProjectAssignment)
