from django.db import migrations


def seed_expense_update_own_permission(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    RolePermission = apps.get_model("accounts", "RolePermission")

    permission, _ = Permission.objects.update_or_create(
        code="expenses.update_own",
        defaults={
            "name": "Update Own Expenses",
            "module": "Expenses",
        },
    )

    for role in ("admin", "manager", "data_entry"):
        RolePermission.objects.get_or_create(role=role, permission=permission)


def unseed_expense_update_own_permission(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    Permission.objects.filter(code="expenses.update_own").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_seed_expense_approval_permission"),
    ]

    operations = [
        migrations.RunPython(
            seed_expense_update_own_permission,
            unseed_expense_update_own_permission,
        ),
    ]
