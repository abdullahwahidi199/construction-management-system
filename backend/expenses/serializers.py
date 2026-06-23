from rest_framework import serializers
from .models import Expense
from project.models import Project

class ExpenseSerializer(serializers.ModelSerializer):
    # Add read-only calculated fields to API responses
    total_usd = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_afn = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    # Show project name in responses while accepting project ID on create/update
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "project",
            "project_name",
            "serial_number",
            "expense_date",
            "description",
            "remarks",
            "paid_to",
            "amount_afn",
            "amount_usd",
            "exchange_rate",
            "expense_type",
            "total_usd",
            "total_afn",
            "created_at",
            "updated_at"
        ]

    def validate(self, data):
        # API level validation matching model rules
        amount_afn = data.get("amount_afn", 0)
        amount_usd = data.get("amount_usd", 0)
        exchange_rate = data.get("exchange_rate", 0)

        if amount_afn <= 0 and amount_usd <=0:
            raise serializers.ValidationError("Expense must have at least one amount (AFN or USD) greater than 0")
        if amount_afn > 0 and exchange_rate <=0:
            raise serializers.ValidationError("Exchange rate is required when recording AFN expenses")
        return data
    

class ProjectExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            "id",
            "serial_number",
            "total_usd",
            "total_afn"
        ]