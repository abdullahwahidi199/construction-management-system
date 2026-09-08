from django.db import migrations


PERMISSIONS = (
    ("apartment_sales.update", "Edit Apartment Sales", "Apartment Sales"),
    ("apartment_sales.cancel", "Cancel Apartment Sales", "Apartment Sales"),
)


def seed_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    RolePermission = apps.get_model("accounts", "RolePermission")
    for code, name, module in PERMISSIONS:
        permission, _ = Permission.objects.update_or_create(
            code=code,
            defaults={"name": name, "module": module},
        )
        for role in ("manager", "data_entry"):
            RolePermission.objects.get_or_create(role=role, permission=permission)


def unseed_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    Permission.objects.filter(code__in=[code for code, _, _ in PERMISSIONS]).delete()


class Migration(migrations.Migration):
    dependencies = [("accounts", "0012_seed_apartment_management_report_permissions")]
    operations = [migrations.RunPython(seed_permissions, unseed_permissions)]
