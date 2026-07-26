# Generated for office expense support.

from django.db import migrations, models
import django.db.models.deletion
from django.db.models import Q


class Migration(migrations.Migration):

    dependencies = [
        ("expenses", "0005_expense_approval_workflow"),
        ("project", "0002_project_budget_currency"),
    ]

    operations = [
        migrations.AddField(
            model_name="expense",
            name="expense_scope",
            field=models.CharField(
                choices=[
                    ("project", "Project Expense"),
                    ("office", "Office Expense"),
                ],
                db_index=True,
                default="project",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="expense",
            name="expense_type",
            field=models.CharField(
                choices=[
                    ("general", "General Expense"),
                    ("material", "Construction Material"),
                    ("construction", "Construction"),
                    ("staff_salary", "Staff Salary"),
                    ("daily_wage", "Daily Worker Wage"),
                    ("contract_payment", "Contract/Subcontractor Payment"),
                    ("equipment", "Equipment Rental/Purchase"),
                    ("utility", "Utility Bill"),
                    ("other", "Other"),
                    ("office_rent", "Office Rent"),
                    ("utilities", "Utilities"),
                    ("internet", "Internet"),
                    ("office_supplies", "Office Supplies"),
                    ("staff_meals", "Staff Meals"),
                    ("transportation", "Transportation"),
                    ("fuel", "Fuel"),
                    ("cleaning", "Cleaning"),
                    ("maintenance", "Maintenance"),
                    ("software_subscriptions", "Software & Subscriptions"),
                    ("salaries", "Salaries"),
                    ("miscellaneous", "Miscellaneous"),
                ],
                default="general",
                max_length=30,
            ),
        ),
        migrations.AlterField(
            model_name="expense",
            name="project",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="expenses",
                to="project.project",
            ),
        ),
        migrations.RemoveConstraint(
            model_name="expense",
            name="unique_serial_per_project",
        ),
        migrations.AddConstraint(
            model_name="expense",
            constraint=models.UniqueConstraint(
                condition=Q(project__isnull=False),
                fields=("project", "serial_number"),
                name="unique_serial_per_project",
            ),
        ),
        migrations.AddConstraint(
            model_name="expense",
            constraint=models.UniqueConstraint(
                condition=Q(expense_scope="office"),
                fields=("expense_scope", "serial_number"),
                name="unique_serial_for_office_expenses",
            ),
        ),
        migrations.AddConstraint(
            model_name="expense",
            constraint=models.CheckConstraint(
                check=(
                    Q(expense_scope="project", project__isnull=False)
                    | Q(expense_scope="office", project__isnull=True)
                ),
                name="expense_scope_matches_project",
            ),
        ),
    ]
