from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditRetentionPolicy",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("keep_forever", models.BooleanField(default=True)),
                ("archive_after_months", models.PositiveIntegerField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="updated_audit_retention_policies", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "Audit retention policy",
                "verbose_name_plural": "Audit retention policies",
            },
        ),
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("organization_label", models.CharField(blank=True, default="", max_length=255)),
                ("action", models.CharField(db_index=True, max_length=80)),
                ("model_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("object_id", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("object_repr", models.CharField(blank=True, default="", max_length=500)),
                ("old_data", models.JSONField(blank=True, default=dict)),
                ("new_data", models.JSONField(blank=True, default=dict)),
                ("description", models.TextField(blank=True, default="")),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.TextField(blank=True, default="")),
                ("request_method", models.CharField(blank=True, default="", max_length=12)),
                ("endpoint", models.TextField(blank=True, default="")),
                ("timestamp", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("status", models.CharField(choices=[("success", "Success"), ("failed", "Failed")], db_index=True, default="success", max_length=20)),
                ("extra_metadata", models.JSONField(blank=True, default=dict)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="audit_logs", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-timestamp"],
                "indexes": [
                    models.Index(fields=["timestamp"], name="audit_audit_timesta_19e18a_idx"),
                    models.Index(fields=["user"], name="audit_audit_user_id_292c79_idx"),
                    models.Index(fields=["model_name"], name="audit_audit_model_n_515731_idx"),
                    models.Index(fields=["object_id"], name="audit_audit_object__9f698d_idx"),
                    models.Index(fields=["action"], name="audit_audit_action_86e815_idx"),
                    models.Index(fields=["model_name", "object_id"], name="audit_audit_model_n_20c0d3_idx"),
                    models.Index(fields=["action", "timestamp"], name="audit_audit_action_2a1328_idx"),
                    models.Index(fields=["status", "timestamp"], name="audit_audit_status_758f94_idx"),
                ],
            },
        ),
    ]
