from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("project", "0006_cancellable_editable_sales")]

    operations = [
        migrations.AddField(
            model_name="apartmentsale",
            name="cancellation_reason",
            field=models.TextField(blank=True),
        ),
    ]
