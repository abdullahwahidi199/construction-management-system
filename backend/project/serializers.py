# serializers.py
from rest_framework import serializers
from common.serializers import CalendarModelSerializer
from .models import Project
from expenses.serializers import ProjectExpenseSerializer
from subcontractor.models import Contract
from subcontractor.serializers import ContractListSerializer
from django.db.models import Sum
from decimal import Decimal
from labour.models import WorkerPayroll
from Employees.models import Employee, Payroll


ZERO = Decimal("0.00")
SUPPORTED_CURRENCIES = ("AFN", "USD")


def _empty_currency_totals():
    return {currency: ZERO for currency in SUPPORTED_CURRENCIES}


class ProjectSerializer(CalendarModelSerializer):
    calendar_module = "projects"
    # expenses = ProjectExpenseSerializer(many=True, read_only=True)
    direct_expenses_usd = serializers.SerializerMethodField()
    direct_expenses_afn = serializers.SerializerMethodField()
    total_expenses_usd = serializers.SerializerMethodField()
    total_expenses_afn = serializers.SerializerMethodField()

    # contracts = serializers.SerializerMethodField()

    total_contract_value = serializers.SerializerMethodField()
    total_contract_payments = serializers.SerializerMethodField()
    remaining_contract_balance = serializers.SerializerMethodField()
    worker_payroll_summary = serializers.SerializerMethodField()
    employee_payroll_summary = serializers.SerializerMethodField()
    payroll_records = serializers.SerializerMethodField()
    assigned_employee_count = serializers.SerializerMethodField()
    project_financial_summary = serializers.SerializerMethodField()
    class Meta:
        model = Project
        fields = "__all__"

    def get_direct_expenses_usd(self, obj):
        return round(
            sum(float(exp.total_usd) for exp in obj.expenses.approved()),
            2
        )

    def get_direct_expenses_afn(self, obj):
        return round(
            sum(float(exp.total_afn) for exp in obj.expenses.approved()),
            2
        )

    def get_total_expenses_usd(self, obj):
        direct = Decimal(str(self.get_direct_expenses_usd(obj)))
        payroll = self._employee_payroll_totals(obj)["USD"]["paid"]
        return round(float(direct + payroll), 2)

    def get_total_expenses_afn(self, obj):
        direct = Decimal(str(self.get_direct_expenses_afn(obj)))
        payroll = self._employee_payroll_totals(obj)["AFN"]["paid"]
        return round(float(direct + payroll), 2)
    # def get_contracts(self, obj):
    #     contracts = obj.subcontractor_contracts.all()
    #     return ContractListSerializer(contracts, many=True).data
    def _contract_currency(self, contract, obj):
        currency = (contract.currency or "").upper()
        if currency in SUPPORTED_CURRENCIES:
            return currency

        budget_currency = (obj.budget_currency or "").upper()
        if budget_currency in SUPPORTED_CURRENCIES:
            return budget_currency

        return "AFN"

    def _contract_value(self, contract):
        return contract.adjusted_contract_value or ZERO

    def _contract_payments_total(self, contract):
        return (
            contract.payments.aggregate(total=Sum("amount"))["total"]
            or ZERO
        )

    def get_total_contract_value(self, obj):
        totals = _empty_currency_totals()

        for contract in obj.subcontractor_contracts.all():
            currency = self._contract_currency(contract, obj)
            totals[currency] += self._contract_value(contract)

        return totals

    def get_total_contract_payments(self, obj):
        totals = _empty_currency_totals()

        for contract in obj.subcontractor_contracts.all():
            currency = self._contract_currency(contract, obj)
            totals[currency] += self._contract_payments_total(contract)

        return totals

    def get_remaining_contract_balance(self, obj):
        totals = _empty_currency_totals()

        for contract in obj.subcontractor_contracts.all():
            adjusted_value = contract.adjusted_contract_value
            if adjusted_value is None:
                continue

            currency = self._contract_currency(contract, obj)
            totals[currency] += adjusted_value - self._contract_payments_total(contract)

        return totals

    def get_worker_payroll_summary(self, obj):
        summary = {
            "AFN": {
                "gross": Decimal("0.00"),
                "net": Decimal("0.00"),
                "advances": Decimal("0.00"),
                "deductions": Decimal("0.00"),
                "count": 0,
            },
            "USD": {
                "gross": Decimal("0.00"),
                "net": Decimal("0.00"),
                "advances": Decimal("0.00"),
                "deductions": Decimal("0.00"),
                "count": 0,
            },
        }

        payrolls = WorkerPayroll.objects.filter(project=obj)
        for currency in summary.keys():
            totals = payrolls.filter(currency=currency).aggregate(
                gross=Sum("gross_amount"),
                net=Sum("net_amount"),
                advances=Sum("advances"),
                deductions=Sum("deductions"),
            )
            summary[currency] = {
                "gross": totals["gross"] or Decimal("0.00"),
                "net": totals["net"] or Decimal("0.00"),
                "advances": totals["advances"] or Decimal("0.00"),
                "deductions": totals["deductions"] or Decimal("0.00"),
                "count": payrolls.filter(currency=currency).count(),
            }
        return summary

    def _employee_payroll_queryset(self, obj):
        return Payroll.objects.select_related("employee", "project").filter(
            allocation_type=Payroll.AllocationType.PROJECT,
            project=obj,
        )

    def _employee_payroll_totals(self, obj):
        payrolls = self._employee_payroll_queryset(obj)
        summary = {
            "AFN": {"gross": Decimal("0.00"), "net": Decimal("0.00"), "paid": Decimal("0.00"), "balance": Decimal("0.00"), "count": 0},
            "USD": {"gross": Decimal("0.00"), "net": Decimal("0.00"), "paid": Decimal("0.00"), "balance": Decimal("0.00"), "count": 0},
        }
        for currency in summary.keys():
            totals = payrolls.filter(currency=currency).aggregate(
                gross=Sum("gross_pay"),
                net=Sum("net_pay"),
                paid=Sum("amount_paid"),
                balance=Sum("balance_due"),
            )
            summary[currency] = {
                "gross": totals["gross"] or Decimal("0.00"),
                "net": totals["net"] or Decimal("0.00"),
                "paid": totals["paid"] or Decimal("0.00"),
                "balance": totals["balance"] or Decimal("0.00"),
                "count": payrolls.filter(currency=currency).count(),
            }
        return summary

    def get_employee_payroll_summary(self, obj):
        return self._employee_payroll_totals(obj)

    def get_assigned_employee_count(self, obj):
        return Employee.objects.filter(
            employment_type=Employee.EmploymentType.PROJECT,
            project=obj,
            is_active=True,
        ).count()

    def get_payroll_records(self, obj):
        records = self._employee_payroll_queryset(obj).order_by(
            "-payroll_period_start",
            "employee__first_name",
            "employee__last_name",
        )[:50]
        return [
            {
                "id": payroll.id,
                "employee": payroll.employee.full_name,
                "employee_id": payroll.employee.employee_id,
                "period_start": payroll.payroll_period_start,
                "period_end": payroll.payroll_period_end,
                "gross_pay": payroll.gross_pay,
                "net_pay": payroll.net_pay,
                "amount_paid": payroll.amount_paid,
                "payment_date": payroll.payment_date,
                "payment_status": payroll.payment_status,
                "currency": payroll.currency,
            }
            for payroll in records
        ]

    def get_project_financial_summary(self, obj):
        payroll = self._employee_payroll_totals(obj)
        direct_afn = Decimal(str(self.get_direct_expenses_afn(obj)))
        direct_usd = Decimal(str(self.get_direct_expenses_usd(obj)))
        payroll_afn = payroll["AFN"]["paid"]
        payroll_usd = payroll["USD"]["paid"]
        return {
            "contract_value": self.get_total_contract_value(obj),
            "direct_expenses_afn": direct_afn,
            "direct_expenses_usd": direct_usd,
            "payroll_expenses_afn": payroll_afn,
            "payroll_expenses_usd": payroll_usd,
            "total_expenses_afn": direct_afn + payroll_afn,
            "total_expenses_usd": direct_usd + payroll_usd,
            "remaining_budget_afn": (
                obj.estimated_budget - direct_afn - payroll_afn
                if obj.budget_currency == "AFN" else None
            ),
            "remaining_budget_usd": (
                obj.estimated_budget - direct_usd - payroll_usd
                if obj.budget_currency == "USD" else None
            ),
        }
    
class ProjectListSerializer(CalendarModelSerializer):
    calendar_module = "projects"
    class Meta:
        model=Project
        fields=["id","name","status","start_date","location","property_type"]   
