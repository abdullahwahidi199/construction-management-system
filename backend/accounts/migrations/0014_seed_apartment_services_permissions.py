from django.db import migrations


PERMISSIONS = (
    ("services.view", "View Apartment Services", "Apartment Services"),
    ("service_settings.manage", "Manage Service Setup", "Apartment Services"),
    ("service_charges.generate", "Generate Service Charges", "Apartment Services"),
    ("service_charges.adjust", "Adjust Service Charges", "Apartment Services"),
    ("service_payments.record", "Record Service Payments", "Apartment Services"),
    ("service_payments.view", "View Service Payments", "Apartment Services"),
)


def seed_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    RolePermission = apps.get_model("accounts", "RolePermission")
    for code, name, module in PERMISSIONS:
        permission, _ = Permission.objects.update_or_create(
            code=code,
            defaults={"name": name, "module": module},
        )
        for role in ("admin", "manager"):
            RolePermission.objects.get_or_create(role=role, permission=permission)
        if code in {"services.view", "service_payments.record", "service_payments.view"}:
            RolePermission.objects.get_or_create(role="data_entry", permission=permission)


def unseed_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    Permission.objects.filter(code__in=[code for code, _, _ in PERMISSIONS]).delete()


class Migration(migrations.Migration):
    dependencies = [("accounts", "0013_seed_apartment_sale_change_permissions")]
    operations = [migrations.RunPython(seed_permissions, unseed_permissions)]

