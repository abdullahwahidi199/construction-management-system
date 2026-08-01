from django.contrib import admin

from .models import (
    CompanyInformation,
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


@admin.register(CompanyInformation)
class CompanyInformationAdmin(admin.ModelAdmin):
    list_display = ("company_name", "tenant_identifier", "updated_at", "updated_by")
    search_fields = ("company_name", "legal_company_name", "tenant_identifier")
    readonly_fields = ("created_at", "updated_at")
