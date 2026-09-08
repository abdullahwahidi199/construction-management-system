import decimal

from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("project", "0003_apartment_management"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Customer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("phone", models.CharField(blank=True, max_length=50)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("address", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="apartment_customers", to="project.project")),
            ],
            options={"ordering": ["name", "id"]},
        ),
        migrations.CreateModel(
            name="ApartmentSale",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reference_number", models.CharField(max_length=100, unique=True)),
                ("sale_date", models.DateField()),
                ("sale_price", models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(decimal.Decimal("0.01"))])),
                ("currency", models.CharField(choices=[("AFN", "Afghani (AFN)"), ("USD", "US Dollar (USD)")], max_length=3)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("apartment", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="sale", to="project.apartment")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_apartment_sales", to=settings.AUTH_USER_MODEL)),
                ("customer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="apartment_sales", to="project.customer")),
            ],
            options={"ordering": ["-sale_date", "-created_at"]},
        ),
        migrations.CreateModel(
            name="ApartmentPayment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("receipt_number", models.CharField(max_length=100, unique=True)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(decimal.Decimal("0.01"))])),
                ("currency", models.CharField(choices=[("AFN", "Afghani (AFN)"), ("USD", "US Dollar (USD)")], max_length=3)),
                ("payment_date", models.DateField()),
                ("payment_method", models.CharField(choices=[("CASH", "Cash"), ("BANK_TRANSFER", "Bank Transfer"), ("CHEQUE", "Cheque"), ("OTHER", "Other")], max_length=20)),
                ("reference", models.CharField(blank=True, max_length=100)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("customer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="apartment_payments", to="project.customer")),
                ("recorded_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="recorded_apartment_payments", to=settings.AUTH_USER_MODEL)),
                ("sale", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="payments", to="project.apartmentsale")),
            ],
            options={"ordering": ["-payment_date", "-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="apartmentsale",
            constraint=models.CheckConstraint(condition=models.Q(("sale_price__gt", 0)), name="apartment_sale_price_positive"),
        ),
        migrations.AddConstraint(
            model_name="apartmentpayment",
            constraint=models.CheckConstraint(condition=models.Q(("amount__gt", 0)), name="apartment_payment_amount_positive"),
        ),
    ]
