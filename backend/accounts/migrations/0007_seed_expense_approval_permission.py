from django.db import migrations


def seed_expense_approval_permission(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    RolePermission = apps.get_model("accounts", "RolePermission")

    permission, _ = Permission.objects.update_or_create(
        code="expenses.approve",
        defaults={
            "name": "Approve Expenses",
            "module": "Expenses",
        },
    )

    for role in ("admin", "manager"):
        RolePermission.objects.get_or_create(role=role, permission=permission)


def unseed_expense_approval_permission(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    Permission.objects.filter(code="expenses.approve").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_customrole_dynamic_roles"),
    ]

    operations = [
        migrations.RunPython(
            seed_expense_approval_permission,
            unseed_expense_approval_permission,
        ),
    ]
