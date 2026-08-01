from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion

import accounts.models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0008_seed_expense_update_own_permission"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CompanyInformation",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "tenant_identifier",
                    models.CharField(
                        db_index=True,
                        default="default",
                        max_length=120,
                        unique=True,
                    ),
                ),
                (
                    "company_name",
                    models.CharField(
                        default="Construction Management System",
                        max_length=255,
                    ),
                ),
                (
                    "legal_company_name",
                    models.CharField(blank=True, default="", max_length=255),
                ),
                (
                    "company_logo",
                    models.ImageField(
                        blank=True,
                        null=True,
                        upload_to=accounts.models.company_branding_upload_path,
                        validators=[
                            django.core.validators.FileExtensionValidator(
                                ["jpg", "jpeg", "png", "webp"]
                            )
                        ],
                    ),
                ),
                (
                    "favicon",
                    models.ImageField(
                        blank=True,
                        null=True,
                        upload_to=accounts.models.company_branding_upload_path,
                        validators=[
                            django.core.validators.FileExtensionValidator(
                                ["jpg", "jpeg", "png", "webp", "ico"]
                            )
                        ],
                    ),
                ),
                ("address", models.TextField(blank=True, default="")),
                ("city", models.CharField(blank=True, default="", max_length=120)),
                (
                    "province_state",
                    models.CharField(blank=True, default="", max_length=120),
                ),
                ("country", models.CharField(blank=True, default="", max_length=120)),
                (
                    "postal_code",
                    models.CharField(blank=True, default="", max_length=32),
                ),
                (
                    "phone_number",
                    models.CharField(
                        blank=True,
                        default="",
                        max_length=40,
                        validators=[
                            django.core.validators.RegexValidator(
                                message="Enter a valid phone number.",
                                regex="^[0-9+\\-()\\s.]{0,40}$",
                            )
                        ],
                    ),
                ),
                (
                    "alternative_phone",
                    models.CharField(
                        blank=True,
                        default="",
                        max_length=40,
                        validators=[
                            django.core.validators.RegexValidator(
                                message="Enter a valid phone number.",
                                regex="^[0-9+\\-()\\s.]{0,40}$",
                            )
                        ],
                    ),
                ),
                ("email", models.EmailField(blank=True, default="", max_length=254)),
                ("website", models.URLField(blank=True, default="")),
                (
                    "tax_number",
                    models.CharField(blank=True, default="", max_length=120),
                ),
                (
                    "registration_number",
                    models.CharField(blank=True, default="", max_length=120),
                ),
                ("company_description", models.TextField(blank=True, default="")),
                ("print_footer_text", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_company_information",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Company information",
                "verbose_name_plural": "Company information",
            },
        ),
    ]
