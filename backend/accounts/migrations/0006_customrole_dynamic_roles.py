from django.db import migrations, models


SYSTEM_ROLES = (
    ("admin", "Admin"),
    ("manager", "Manager"),
    ("data_entry", "Data Entry User"),
)


def seed_system_roles(apps, schema_editor):
    CustomRole = apps.get_model("accounts", "CustomRole")
    for value, label in SYSTEM_ROLES:
        CustomRole.objects.update_or_create(
            value=value,
            defaults={"label": label, "is_system": True},
        )


def unseed_system_roles(apps, schema_editor):
    CustomRole = apps.get_model("accounts", "CustomRole")
    CustomRole.objects.filter(value__in=[value for value, _ in SYSTEM_ROLES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_seed_settings_permissions"),
    ]

    operations = [
        migrations.CreateModel(
            name="CustomRole",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("value", models.SlugField(max_length=32, unique=True)),
                ("label", models.CharField(max_length=80)),
                ("description", models.TextField(blank=True)),
                ("is_system", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Custom role",
                "verbose_name_plural": "Custom roles",
                "ordering": ("label",),
            },
        ),
        migrations.AlterField(
            model_name="rolepermission",
            name="role",
            field=models.CharField(db_index=True, max_length=32),
        ),
        migrations.AlterField(
            model_name="userprofile",
            name="role",
            field=models.CharField(db_index=True, default="data_entry", max_length=32),
        ),
        migrations.RunPython(seed_system_roles, unseed_system_roles),
    ]
