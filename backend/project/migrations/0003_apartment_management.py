from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("project", "0002_project_budget_currency"),
    ]

    operations = [
        migrations.CreateModel(
            name="Building",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="buildings", to="project.project")),
            ],
            options={"ordering": ["name", "id"]},
        ),
        migrations.CreateModel(
            name="Floor",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("floor_number", models.IntegerField()),
                ("name", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("building", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="floors", to="project.building")),
            ],
            options={"ordering": ["floor_number", "id"]},
        ),
        migrations.CreateModel(
            name="Apartment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("apartment_number", models.CharField(max_length=50)),
                ("apartment_type", models.CharField(blank=True, max_length=100)),
                ("area", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("bedrooms", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("description", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("AVAILABLE", "Available"), ("SOLD", "Sold")], default="AVAILABLE", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("building", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="apartments", to="project.building")),
                ("floor", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="apartments", to="project.floor")),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="apartments", to="project.project")),
            ],
            options={"ordering": ["building__name", "floor__floor_number", "apartment_number", "id"]},
        ),
        migrations.AddConstraint(
            model_name="floor",
            constraint=models.UniqueConstraint(fields=("building", "floor_number"), name="unique_floor_number_per_building"),
        ),
        migrations.AddConstraint(
            model_name="apartment",
            constraint=models.UniqueConstraint(fields=("floor", "apartment_number"), name="unique_apartment_number_per_floor"),
        ),
        migrations.AddConstraint(
            model_name="apartment",
            constraint=models.CheckConstraint(condition=models.Q(("area__isnull", True), ("area__gte", 0), _connector="OR"), name="apartment_area_non_negative"),
        ),
    ]
