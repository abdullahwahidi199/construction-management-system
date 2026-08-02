from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("subcontractor", "0007_alter_subcontractor_registration_number"),
        ("expenses", "0008_expense_edit_request"),
    ]

    operations = [
        migrations.AddField(
            model_name="expense",
            name="contract",
            field=models.ForeignKey(
                blank=True,
                help_text="Optional contract this expense belongs to.",
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="expenses",
                to="subcontractor.contract",
            ),
        ),
        migrations.AddConstraint(
            model_name="expense",
            constraint=models.CheckConstraint(
                check=(
                    models.Q(expense_scope="project")
                    | models.Q(expense_scope="office", contract__isnull=True)
                ),
                name="office_expenses_do_not_link_contract",
            ),
        ),
    ]
