import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import project.models


class Migration(migrations.Migration):
    dependencies = [
        ("project", "0005_customer_notes_protect_sales"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="apartmentsale",
            name="status",
            field=models.CharField(
                choices=[("ACTIVE", "Active"), ("CANCELLED", "Cancelled")],
                default="ACTIVE",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="apartmentsale",
            name="cancelled_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="apartmentsale",
            name="cancelled_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="cancelled_apartment_sales",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="apartmentsale",
            name="apartment",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="sales",
                to="project.apartment",
            ),
        ),
        migrations.AlterField(
            model_name="apartmentsale",
            name="reference_number",
            field=models.CharField(
                default=project.models.generate_sale_reference,
                editable=False,
                max_length=100,
                unique=True,
            ),
        ),
        migrations.AlterField(
            model_name="apartmentpayment",
            name="receipt_number",
            field=models.CharField(
                default=project.models.generate_payment_receipt,
                editable=False,
                max_length=100,
                unique=True,
            ),
        ),
        migrations.AddConstraint(
            model_name="apartmentsale",
            constraint=models.UniqueConstraint(
                condition=models.Q(status="ACTIVE"),
                fields=("apartment",),
                name="unique_active_sale_per_apartment",
            ),
        ),
    ]
