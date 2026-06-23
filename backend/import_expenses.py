import os
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from expenses.models import Expense

with open("lalander6_expenses_fixed.json", encoding="utf-8") as f:
    data = json.load(f)

count = 0

for item in data:
    fields = item["fields"]

    Expense.objects.create(
        project_id=fields["project"],
        serial_number=fields["serial_number"],
        expense_date=fields["expense_date"],
        description=fields["description"],
        remarks=fields["remarks"],
        paid_to=fields["paid_to"],
        amount_afn=fields["amount_afn"],
        amount_usd=fields["amount_usd"],
        exchange_rate=fields["exchange_rate"],
        expense_type=fields["expense_type"],
    )

    count += 1

print(f"Imported {count} expenses")