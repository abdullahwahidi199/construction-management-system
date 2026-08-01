from django.contrib import admin
from .models import Expense, ExpenseEditRequest

admin.site.register(Expense)
admin.site.register(ExpenseEditRequest)
# Register your models here.
