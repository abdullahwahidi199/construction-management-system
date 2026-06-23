from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("project", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="RolePermissionOverride",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("admin", "Admin"), ("manager", "Manager"), ("data_entry", "Data Entry User")], db_index=True, max_length=32)),
                ("permission", models.CharField(db_index=True, max_length=120)),
                ("effect", models.CharField(choices=[("allow", "Allow"), ("deny", "Deny")], default="allow", max_length=10)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ("role", "permission"),
                "verbose_name": "Role permission override",
                "verbose_name_plural": "Role permission overrides",
                "unique_together": {("role", "permission")},
            },
        ),
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("admin", "Admin"), ("manager", "Manager"), ("data_entry", "Data Entry User")], db_index=True, default="data_entry", max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="profile", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "User profile",
                "verbose_name_plural": "User profiles",
            },
        ),
        migrations.CreateModel(
            name="UserPermissionOverride",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("permission", models.CharField(db_index=True, max_length=120)),
                ("effect", models.CharField(choices=[("allow", "Allow"), ("deny", "Deny")], default="allow", max_length=10)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="permission_overrides", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ("user__username", "permission"),
                "verbose_name": "User permission override",
                "verbose_name_plural": "User permission overrides",
                "unique_together": {("user", "permission")},
            },
        ),
        migrations.CreateModel(
            name="ProjectAssignment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("assigned_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assigned_projects", to=settings.AUTH_USER_MODEL)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="user_assignments", to="project.project")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="project_assignments", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ("user__username", "project__name"),
                "verbose_name": "Project assignment",
                "verbose_name_plural": "Project assignments",
                "unique_together": {("user", "project")},
            },
        ),
    ]
