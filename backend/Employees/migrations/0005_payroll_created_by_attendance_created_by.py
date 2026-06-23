from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("Employees", "0004_payroll_currency"),
    ]

    operations = [
        migrations.AddField(
            model_name="payroll",
            name="created_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_payrolls", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name="attendance",
            name="created_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_attendance_records", to=settings.AUTH_USER_MODEL),
        ),
    ]
