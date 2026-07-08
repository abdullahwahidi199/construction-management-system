from django.contrib import admin

from .models import (
    ProjectAssignment,
    UserPermissionOverride,
    UserProfile,
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "updated_at")
    list_filter = ("role",)
    search_fields = ("user__username", "user__email")


admin.site.register(UserPermissionOverride)
admin.site.register(ProjectAssignment)
