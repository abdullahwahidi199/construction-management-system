from django.db import migrations


def seed_settings_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    for code, name in [
        ("settings.view", "View Settings"),
        ("settings.manage", "Manage Settings"),
    ]:
        Permission.objects.update_or_create(
            code=code,
            defaults={"name": name, "module": "Settings"},
        )


def unseed_settings_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    Permission.objects.filter(code__in=["settings.view", "settings.manage"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_applicationsettings"),
    ]

    operations = [
        migrations.RunPython(seed_settings_permissions, unseed_settings_permissions),
    ]
