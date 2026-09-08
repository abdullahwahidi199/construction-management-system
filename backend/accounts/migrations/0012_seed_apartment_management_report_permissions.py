from django.db import migrations


PERMISSIONS = (
    ("buildings.view", "View Buildings", "Apartment Management"),
    ("buildings.create", "Create Building", "Apartment Management"),
    ("buildings.update", "Edit Building", "Apartment Management"),
    ("buildings.delete", "Delete Building", "Apartment Management"),
    ("floors.view", "View Floors", "Apartment Management"),
    ("floors.create", "Create Floor", "Apartment Management"),
    ("floors.update", "Edit Floor", "Apartment Management"),
    ("floors.delete", "Delete Floor", "Apartment Management"),
    ("floors.bulk_create", "Bulk Create Floors", "Apartment Management"),
    ("apartments.view", "View Apartments", "Apartment Management"),
    ("apartments.create", "Create Apartment", "Apartment Management"),
    ("apartments.update", "Edit Apartment", "Apartment Management"),
    ("apartments.delete", "Delete Apartment", "Apartment Management"),
    ("apartments.bulk_create", "Bulk Create Apartments", "Apartment Management"),
    ("apartment_sales_reports.view", "View Apartment Sales Reports", "Apartment Reports"),
    ("apartment_payment_reports.view", "View Apartment Payment Reports", "Apartment Reports"),
    ("apartment_outstanding_reports.view", "View Apartment Outstanding Reports", "Apartment Reports"),
)

MANAGER_DEFAULTS = {
    "buildings.view", "buildings.create", "buildings.update",
    "floors.view", "floors.create", "floors.update", "floors.bulk_create",
    "apartments.view", "apartments.create", "apartments.update", "apartments.bulk_create",
    "apartment_sales_reports.view", "apartment_payment_reports.view",
    "apartment_outstanding_reports.view", "reports.view",
}

DATA_ENTRY_DEFAULTS = {
    "buildings.view", "buildings.create",
    "floors.view", "floors.create", "floors.bulk_create",
    "apartments.view", "apartments.create", "apartments.bulk_create",
}


def seed_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    RolePermission = apps.get_model("accounts", "RolePermission")
    permission_map = {}
    for code, name, module in PERMISSIONS:
        permission, _ = Permission.objects.update_or_create(
            code=code,
            defaults={"name": name, "module": module},
        )
        permission_map[code] = permission

    reports_permission, _ = Permission.objects.get_or_create(
        code="reports.view",
        defaults={"name": "View Reports", "module": "Reports"},
    )
    permission_map["reports.view"] = reports_permission
    for role, codes in (("manager", MANAGER_DEFAULTS), ("data_entry", DATA_ENTRY_DEFAULTS)):
        for code in codes:
            RolePermission.objects.get_or_create(role=role, permission=permission_map[code])


def unseed_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    Permission.objects.filter(code__in=[code for code, _, _ in PERMISSIONS]).delete()


class Migration(migrations.Migration):
    dependencies = [("accounts", "0011_seed_apartment_sales_permissions")]

    operations = [migrations.RunPython(seed_permissions, unseed_permissions)]
