from django.db import migrations


DELETE_PERMISSIONS = (
    ("contracts.delete", "Delete Contracts", "Contracts"),
    (
        "contract_invoices.delete",
        "Delete Contract Invoices",
        "Contract Invoices",
    ),
)


def seed_contract_delete_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")

    for code, name, module in DELETE_PERMISSIONS:
        Permission.objects.update_or_create(
            code=code,
            defaults={"name": name, "module": module},
        )


def unseed_contract_delete_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    Permission.objects.filter(
        code__in=[code for code, _, _ in DELETE_PERMISSIONS]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_companyinformation"),
    ]

    operations = [
        migrations.RunPython(
            seed_contract_delete_permissions,
            unseed_contract_delete_permissions,
        ),
    ]
