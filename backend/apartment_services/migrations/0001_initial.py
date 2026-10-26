import decimal
import django.core.validators
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models

import apartment_services.models


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("project", "0007_apartmentsale_cancellation_reason"),
    ]
    operations = [
        migrations.CreateModel(
            name="ApartmentServiceSetting",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("default_fee", models.DecimalField(decimal_places=2, default=decimal.Decimal("0.00"), max_digits=15, validators=[django.core.validators.MinValueValidator(decimal.Decimal("0.00"))])),
                ("currency", models.CharField(choices=[("AFN", "Afghani (AFN)"), ("USD", "US Dollar (USD)")], default="AFN", max_length=3)),
                ("is_active", models.BooleanField(default=True)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("apartment", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="service_setting", to="project.apartment")),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="updated_apartment_service_settings", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["apartment__project__name", "apartment__building__name", "apartment__floor__floor_number", "apartment__apartment_number"]},
        ),
        migrations.CreateModel(
            name="ServiceCharge",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("period_start", models.DateField()),
                ("period_end", models.DateField()),
                ("amount", models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(decimal.Decimal("0.00"))])),
                ("currency", models.CharField(choices=[("AFN", "Afghani (AFN)"), ("USD", "US Dollar (USD)")], default="AFN", max_length=3)),
                ("adjustment_note", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("adjusted_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="adjusted_service_charges", to=settings.AUTH_USER_MODEL)),
                ("apartment", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="service_charges", to="project.apartment")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_service_charges", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-period_start", "apartment__apartment_number", "id"]},
        ),
        migrations.CreateModel(
            name="ServicePayment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("receipt_number", models.CharField(default=apartment_services.models.generate_service_receipt, editable=False, max_length=100, unique=True)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(decimal.Decimal("0.01"))])),
                ("currency", models.CharField(choices=[("AFN", "Afghani (AFN)"), ("USD", "US Dollar (USD)")], default="AFN", max_length=3)),
                ("payment_date", models.DateField()),
                ("payment_method", models.CharField(choices=[("CASH", "Cash"), ("BANK_TRANSFER", "Bank Transfer"), ("CHEQUE", "Cheque"), ("OTHER", "Other")], max_length=20)),
                ("reference_number", models.CharField(blank=True, max_length=100)),
                ("notes", models.TextField(blank=True)),
                ("idempotency_key", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("charge", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="payments", to="apartment_services.servicecharge")),
                ("recorded_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="recorded_service_payments", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-payment_date", "-created_at"]},
        ),
        migrations.AddConstraint(model_name="apartmentservicesetting", constraint=models.CheckConstraint(condition=models.Q(("default_fee__gte", 0)), name="service_setting_fee_non_negative")),
        migrations.AddConstraint(model_name="servicecharge", constraint=models.UniqueConstraint(fields=("apartment", "period_start"), name="unique_service_charge_apartment_period")),
        migrations.AddConstraint(model_name="servicecharge", constraint=models.CheckConstraint(condition=models.Q(("amount__gte", 0)), name="service_charge_amount_non_negative")),
        migrations.AddConstraint(model_name="servicecharge", constraint=models.CheckConstraint(condition=models.Q(("period_end__gte", models.F("period_start"))), name="service_charge_period_ordered")),
        migrations.AddIndex(model_name="servicecharge", index=models.Index(fields=["period_start", "period_end"], name="svc_charge_period_idx")),
        migrations.AddIndex(model_name="servicecharge", index=models.Index(fields=["apartment", "period_start"], name="svc_charge_apt_period_idx")),
        migrations.AddConstraint(model_name="servicepayment", constraint=models.CheckConstraint(condition=models.Q(("amount__gt", 0)), name="service_payment_amount_positive")),
        migrations.AddIndex(model_name="servicepayment", index=models.Index(fields=["payment_date"], name="svc_payment_date_idx")),
    ]

