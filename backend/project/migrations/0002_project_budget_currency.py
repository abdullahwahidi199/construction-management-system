from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("project", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="budget_currency",
            field=models.CharField(
                choices=[
                    ("AFN", "Afghani (AFN)"),
                    ("USD", "US Dollar (USD)"),
                ],
                default="AFN",
                max_length=3,
            ),
        ),
    ]
