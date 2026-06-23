from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("expenses", "0003_alter_expense_expense_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="expense",
            name="created_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_expenses", to=settings.AUTH_USER_MODEL),
        ),
    ]
