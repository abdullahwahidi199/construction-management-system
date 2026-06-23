# serializers.py
from rest_framework import serializers
from .models import Project
from expenses.serializers import ProjectExpenseSerializer
from subcontractor.models import Contract
from subcontractor.serializers import ContractListSerializer
from django.db.models import Sum
from decimal import Decimal




class ProjectSerializer(serializers.ModelSerializer):
    # expenses = ProjectExpenseSerializer(many=True, read_only=True)
    total_expenses_usd = serializers.SerializerMethodField()
    total_expenses_afn = serializers.SerializerMethodField()

    # contracts = serializers.SerializerMethodField()

    total_contract_value = serializers.SerializerMethodField()
    total_contract_payments = serializers.SerializerMethodField()
    remaining_contract_balance = serializers.SerializerMethodField()
    class Meta:
        model = Project
        fields = "__all__"

    def get_total_expenses_usd(self, obj):
        return round(
            sum(float(exp.total_usd) for exp in obj.expenses.all()),
            2
        )
    def get_total_expenses_afn(self, obj):
        return round(
            sum(float(exp.total_afn) for exp in obj.expenses.all()),
            2
        )
    # def get_contracts(self, obj):
    #     contracts = obj.subcontractor_contracts.all()
    #     return ContractListSerializer(contracts, many=True).data
    def get_total_contract_value(self, obj):
        totals = {
            "AFN": Decimal("0.00"),
            "USD": Decimal("0.00"),
        }

        for contract in obj.subcontractor_contracts.all():
            totals[contract.currency] += contract.adjusted_contract_value

        return totals

    def get_total_contract_payments(self, obj):
        totals = {
            "AFN": Decimal("0.00"),
            "USD": Decimal("0.00"),
        }

        for contract in obj.subcontractor_contracts.all():
            paid = (
                contract.payments.aggregate(
                    total=Sum("amount")
                )["total"]
                or Decimal("0.00")
            )

            totals[contract.currency] += paid

        return totals
    def get_remaining_contract_balance(self, obj):
        contract_values = self.get_total_contract_value(obj)
        payments = self.get_total_contract_payments(obj)

        return {
            "AFN": contract_values["AFN"] - payments["AFN"],
            "USD": contract_values["USD"] - payments["USD"],
        }
    
class ProjectListSerializer(serializers.ModelSerializer):
    class Meta:
        model=Project
        fields=["id","name","status","start_date","location","property_type"]   