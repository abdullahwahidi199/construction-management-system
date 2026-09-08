from django.db import migrations


APARTMENT_SALES_PERMISSIONS = (
    ("apartment_sales.view", "View Apartment Sales", "Apartment Sales"),
    ("apartment_sales.create", "Record Apartment Sales", "Apartment Sales"),
    ("apartment_payments.view", "View Apartment Payments", "Apartment Sales"),
    ("apartment_payments.create", "Record Apartment Payments", "Apartment Sales"),
)


def seed_apartment_sales_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    RolePermission = apps.get_model("accounts", "RolePermission")

    for code, name, module in APARTMENT_SALES_PERMISSIONS:
        permission, _ = Permission.objects.update_or_create(
            code=code,
            defaults={"name": name, "module": module},
        )
        for role in ("manager", "data_entry"):
            RolePermission.objects.get_or_create(role=role, permission=permission)


def unseed_apartment_sales_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    Permission.objects.filter(
        code__in=[code for code, _, _ in APARTMENT_SALES_PERMISSIONS]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [("accounts", "0010_seed_contract_delete_permissions")]

    operations = [
        migrations.RunPython(
            seed_apartment_sales_permissions,
            unseed_apartment_sales_permissions,
        )
    ]
