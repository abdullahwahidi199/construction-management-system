from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("project", "0004_apartment_sales_payments")]

    operations = [
        migrations.AddField(
            model_name="customer",
            name="notes",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="apartmentsale",
            name="apartment",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="sale",
                to="project.apartment",
            ),
        ),
    ]
