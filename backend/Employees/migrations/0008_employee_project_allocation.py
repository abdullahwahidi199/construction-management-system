from django.db import migrations, models
import django.db.models.deletion


LEGACY_JOB_TYPES = {"full_time", "part_time", "contract", "temporary"}


def preserve_legacy_employment_type(apps, schema_editor):
    Employee = apps.get_model("Employees", "Employee")
    Payroll = apps.get_model("Employees", "Payroll")

    for employee in Employee.objects.all().iterator():
        legacy_type = employee.employment_type
        employee.job_type = legacy_type if legacy_type in LEGACY_JOB_TYPES else "full_time"
        employee.employment_type = "OFFICE"
        employee.project_id = None
        employee.save(update_fields=["job_type", "employment_type", "project"])

    Payroll.objects.update(allocation_type="OFFICE", project_id=None)


class Migration(migrations.Migration):

    dependencies = [
        ("project", "0002_project_budget_currency"),
        ("Employees", "0007_payroll_advances_payments"),
    ]

    operations = [
        migrations.AddField(
            model_name="employee",
            name="job_type",
            field=models.CharField(
                choices=[
                    ("full_time", "Full Time"),
                    ("part_time", "Part Time"),
                    ("contract", "Contract"),
                    ("temporary", "Temporary"),
                ],
                default="full_time",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="employee",
            name="project",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="assigned_employees",
                to="project.project",
            ),
        ),
        migrations.AddField(
            model_name="payroll",
            name="allocation_type",
            field=models.CharField(
                choices=[
                    ("PROJECT", "Project Payroll"),
                    ("OFFICE", "Office Payroll"),
                ],
                db_index=True,
                default="OFFICE",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="payroll",
            name="project",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="employee_payrolls",
                to="project.project",
            ),
        ),
        migrations.RunPython(preserve_legacy_employment_type, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="employee",
            name="employment_type",
            field=models.CharField(
                choices=[
                    ("PROJECT", "Project Employee"),
                    ("OFFICE", "Office Employee"),
                ],
                default="OFFICE",
                max_length=20,
            ),
        ),
        migrations.AddConstraint(
            model_name="employee",
            constraint=models.CheckConstraint(
                check=(
                    models.Q(employment_type="PROJECT", project__isnull=False)
                    | models.Q(employment_type="OFFICE", project__isnull=True)
                ),
                name="employee_employment_type_matches_project",
            ),
        ),
        migrations.AddConstraint(
            model_name="payroll",
            constraint=models.CheckConstraint(
                check=(
                    models.Q(allocation_type="PROJECT", project__isnull=False)
                    | models.Q(allocation_type="OFFICE", project__isnull=True)
                ),
                name="payroll_allocation_matches_project",
            ),
        ),
    ]
