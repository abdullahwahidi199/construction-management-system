from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def approve_existing_expenses(apps, schema_editor):
    Expense = apps.get_model("expenses", "Expense")
    for expense in Expense.objects.all().iterator():
        expense.approval_status = "approved"
        expense.approved_at = expense.created_at
        expense.save(update_fields=["approval_status", "approved_at"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("expenses", "0004_expense_created_by"),
    ]

    operations = [
        migrations.AddField(
            model_name="expense",
            name="approval_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("approved", "Approved"),
                    ("rejected", "Rejected"),
                ],
                db_index=True,
                default="approved",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="expense",
            name="approved_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="approved_expenses",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="expense",
            name="approved_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="expense",
            name="approval_notes",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="expense",
            name="rejected_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="rejected_expenses",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="expense",
            name="rejected_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(approve_existing_expenses, noop_reverse),
    ]
