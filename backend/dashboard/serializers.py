# dashboard/serializers.py

from rest_framework import serializers


# ════════════════════════════════════════════
# KPI Card Serializers
# ════════════════════════════════════════════

class ProjectOverviewSerializer(serializers.Serializer):
    total_projects = serializers.IntegerField()
    status_breakdown = serializers.DictField()
    property_type_breakdown = serializers.DictField()
    total_estimated_budget = serializers.DictField()
    avg_estimated_budget = serializers.DecimalField(
        max_digits=15, decimal_places=2
    )
    overdue_projects_count = serializers.IntegerField()
    overdue_projects = serializers.ListField()


class GrandTotalOutflowSerializer(serializers.Serializer):
    usd = serializers.DecimalField(max_digits=15, decimal_places=2)
    afn = serializers.DecimalField(max_digits=15, decimal_places=2)


class FinancialOverviewSerializer(serializers.Serializer):
    total_budget_all_projects = serializers.DictField()

    expenses = serializers.DictField()
    payroll = serializers.DictField()
    contracts = serializers.DictField()

    grand_total_outflow = GrandTotalOutflowSerializer()

class ExpenseSummarySerializer(serializers.Serializer):
    total_expenses_afn = serializers.DecimalField(
        max_digits=15, decimal_places=2
    )
    total_expenses_usd = serializers.DecimalField(
        max_digits=15, decimal_places=2
    )
    total_expense_count = serializers.IntegerField()
    by_expense_type = serializers.ListField()
    monthly_trend = serializers.ListField()
    recent_expenses = serializers.ListField()
    by_project = serializers.ListField()


class ExpenseThisMonthSerializer(serializers.Serializer):
    current_month = serializers.DictField()
    previous_month = serializers.DictField()
    change_percentage = serializers.FloatField()
    trend = serializers.CharField()


class WorkforceSummarySerializer(serializers.Serializer):
    total_employees = serializers.IntegerField()
    active_employees = serializers.IntegerField()
    inactive_employees = serializers.IntegerField()
    department_breakdown = serializers.ListField()
    employment_type_breakdown = serializers.ListField()
    total_monthly_salary = serializers.DecimalField(
        max_digits=15, decimal_places=2
    )
    avg_salary = serializers.DecimalField(
        max_digits=15, decimal_places=2
    )
    recent_hires = serializers.ListField()


class AttendanceSummarySerializer(serializers.Serializer):
    today = serializers.DictField()
    weekly_trend = serializers.ListField()

from rest_framework import serializers


class CurrencySummarySerializer(serializers.Serializer):
    gross_usd = serializers.DecimalField(max_digits=15, decimal_places=2)
    gross_afn = serializers.DecimalField(max_digits=15, decimal_places=2)

    net_usd = serializers.DecimalField(max_digits=15, decimal_places=2)
    net_afn = serializers.DecimalField(max_digits=15, decimal_places=2)

    count = serializers.IntegerField()
    total_deductions_usd = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    total_deductions_afn = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    total_tax_usd = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    total_tax_afn = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    total_bonus_usd = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    total_bonus_afn = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    total_overtime_usd = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    total_overtime_afn = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    employee_net_usd = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    employee_net_afn = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    daily_worker_net_usd = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    daily_worker_net_afn = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)

class PayrollPaymentMethodSerializer(serializers.Serializer):
    payment_method = serializers.CharField()
    count = serializers.IntegerField()

    total_usd = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_afn = serializers.DecimalField(max_digits=15, decimal_places=2)

class RecentPayrollSerializer(serializers.Serializer):
    id = serializers.IntegerField()

    employee__first_name = serializers.CharField()
    employee__last_name = serializers.CharField(allow_blank=True)
    employee__employee_id = serializers.CharField()

    payroll_period_start = serializers.DateField()
    payroll_period_end = serializers.DateField()

    gross_pay = serializers.DecimalField(max_digits=15, decimal_places=2)
    net_pay = serializers.DecimalField(max_digits=15, decimal_places=2)

    currency = serializers.CharField()
    payment_date = serializers.DateField(allow_null=True)

class PayrollSummarySerializer(serializers.Serializer):
    current_month = CurrencySummarySerializer()
    previous_month = CurrencySummarySerializer()

    payment_method_breakdown = PayrollPaymentMethodSerializer(many=True)

    recent_payrolls = RecentPayrollSerializer(many=True)



class CurrencyAmountSerializer(serializers.Serializer):
    usd = serializers.DecimalField(max_digits=15, decimal_places=2)
    afn = serializers.DecimalField(max_digits=15, decimal_places=2)


class ContractSummarySerializer(serializers.Serializer):
    total_contracts = serializers.IntegerField()

    status_breakdown = serializers.DictField()

    # ── Financial (now multi-currency) ──
    total_contract_value_usd = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_contract_value_afn = serializers.DecimalField(max_digits=15, decimal_places=2)

    total_retention_held_usd = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_retention_held_afn = serializers.DecimalField(max_digits=15, decimal_places=2)

    avg_completion = serializers.FloatField()

    total_payments_made_usd = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_payments_made_afn = serializers.DecimalField(max_digits=15, decimal_places=2)

    total_payment_count = serializers.IntegerField()

    total_approved_variations_usd = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_approved_variations_afn = serializers.DecimalField(max_digits=15, decimal_places=2)

    variation_count = serializers.IntegerField()

    contracts_ending_soon = serializers.ListField()
    overdue_contracts = serializers.ListField()

    by_currency = serializers.ListField()


class SubcontractorSummarySerializer(serializers.Serializer):
    total_subcontractors = serializers.IntegerField()
    active_subcontractors = serializers.IntegerField()
    inactive_subcontractors = serializers.IntegerField()
    specialization_breakdown = serializers.ListField()
    top_subcontractors_by_value = serializers.ListField()


class BudgetComparisonSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    status = serializers.CharField()
    estimated_budget = serializers.FloatField()
    budget_currency = serializers.CharField()
    total_spent_usd = serializers.FloatField()
    total_spent_afn = serializers.FloatField()
    budget_remaining = serializers.FloatField()
    budget_remaining_usd = serializers.FloatField(allow_null=True)
    budget_remaining_afn = serializers.FloatField(allow_null=True)
    budget_utilization_pct = serializers.FloatField()
    is_over_budget = serializers.BooleanField()


class AlertSerializer(serializers.Serializer):
    type = serializers.CharField()
    severity = serializers.CharField()
    title = serializers.CharField()
    message = serializers.CharField()
    entity_type = serializers.CharField()
    entity_id = serializers.IntegerField(allow_null=True)


class AlertsSummarySerializer(serializers.Serializer):
    total_alerts = serializers.IntegerField()
    high_count = serializers.IntegerField()
    medium_count = serializers.IntegerField()
    low_count = serializers.IntegerField()
    alerts = AlertSerializer(many=True)


class ActivitySerializer(serializers.Serializer):
    type = serializers.CharField()
    icon = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    project = serializers.CharField(allow_null=True)
    amount_display = serializers.CharField(allow_null=True)
    timestamp = serializers.CharField()
    entity_id = serializers.IntegerField()


# ════════════════════════════════════════════
# Full Dashboard Serializer
# ════════════════════════════════════════════

class FullDashboardSerializer(serializers.Serializer):
    project_overview = ProjectOverviewSerializer()
    financial_overview = FinancialOverviewSerializer()
    expense_summary = ExpenseSummarySerializer()
    expense_this_month = ExpenseThisMonthSerializer()
    workforce_summary = WorkforceSummarySerializer()
    attendance_summary = AttendanceSummarySerializer()
    payroll_summary = PayrollSummarySerializer()
    contract_summary = ContractSummarySerializer()
    subcontractor_summary = SubcontractorSummarySerializer()
    budget_comparison = BudgetComparisonSerializer(many=True)
    alerts = AlertsSummarySerializer()
    recent_activity = ActivitySerializer(many=True)
