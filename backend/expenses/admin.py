from django.contrib import admin
from .models import Expense, ExpenseEditRequest

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "serial_number",
        "expense_scope",
        "project",
        "contract",
        "expense_date",
        "expense_type",
        "approval_status",
    )
    list_filter = ("expense_scope", "expense_type", "approval_status", "contract")
    search_fields = (
        "description",
        "paid_to",
        "project__name",
        "contract__contract_number",
        "contract__title",
    )
    raw_id_fields = ("project", "contract")
    list_select_related = ("project", "contract")


admin.site.register(ExpenseEditRequest)
# Register your models here.
