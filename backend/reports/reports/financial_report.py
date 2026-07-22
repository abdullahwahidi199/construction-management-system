from collections import defaultdict
from decimal import Decimal

from Employees.models import Payroll
from expenses.models import Expense
from labour.models import WorkerPayroll
from project.models import Project
from subcontractor.models import Contract
from .base import BaseReport


ZERO = Decimal("0.00")
CURRENCIES = ("USD", "AFN")


def money(value):
    if value is None or value == "":
        return ZERO
    return Decimal(str(value))


def currency_map():
    return {currency: ZERO for currency in CURRENCIES}


def add_currency(target, currency, amount):
    currency = (currency or "AFN").upper()
    if currency not in target:
        target[currency] = ZERO
    target[currency] += money(amount)


def month_key(value):
    if not value:
        return "Unscheduled"
    return value.replace(day=1).isoformat()


def empty_month(name):
    return {
        "month": name,
        "expenses_usd": ZERO,
        "expenses_afn": ZERO,
        "employee_payroll": ZERO,
        "worker_payroll": ZERO,
        "contract_payments": ZERO,
        "records": 0,
    }


class FinancialOverviewReport(BaseReport):
    report_name = "Financial Overview Report"

    def _expense_queryset(self):
        qs = Expense.objects.select_related("project")
        project_id = self.filters.get("project_id")
        start, end = self.get_date_range()

        if project_id:
            qs = qs.filter(project_id=project_id)
        if start:
            qs = qs.filter(expense_date__gte=start)
        if end:
            qs = qs.filter(expense_date__lte=end)

        return qs

    def _employee_payroll_queryset(self):
        qs = Payroll.objects.select_related("employee")
        start, end = self.get_date_range()

        # Employee payroll is not assigned to projects in the current model.
        # When a project filter is active, keep the overview project-scoped.
        if self.filters.get("project_id"):
            return Payroll.objects.none()

        if start:
            qs = qs.filter(payroll_period_start__gte=start)
        if end:
            qs = qs.filter(payroll_period_end__lte=end)

        return qs

    def _worker_payroll_queryset(self):
        qs = WorkerPayroll.objects.select_related("worker", "project")
        project_id = self.filters.get("project_id")
        start, end = self.get_date_range()

        if project_id:
            qs = qs.filter(project_id=project_id)
        if start:
            qs = qs.filter(period_start__gte=start)
        if end:
            qs = qs.filter(period_end__lte=end)

        return qs

    def _contract_queryset(self):
        qs = Contract.objects.select_related("project").prefetch_related(
            "payments",
            "variations",
        )
        project_id = self.filters.get("project_id")

        if project_id:
            qs = qs.filter(project_id=project_id)

        return qs

    def _project_queryset(self):
        qs = Project.objects.all()
        project_id = self.filters.get("project_id")

        if project_id:
            qs = qs.filter(id=project_id)

        return qs

    def _contract_paid(self, contract):
        start, end = self.get_date_range()
        payments = contract.payments.all()
        total = ZERO

        for payment in payments:
            if start and payment.payment_date < start:
                continue
            if end and payment.payment_date > end:
                continue
            total += money(payment.amount)

        return total

    def _expense_totals(self, expenses):
        totals = {
            "count": 0,
            "raw_usd": ZERO,
            "raw_afn": ZERO,
            "total_usd": ZERO,
            "total_afn": ZERO,
        }

        for expense in expenses:
            totals["count"] += 1
            totals["raw_usd"] += money(expense.amount_usd)
            totals["raw_afn"] += money(expense.amount_afn)
            totals["total_usd"] += money(expense.total_usd)
            totals["total_afn"] += money(expense.total_afn)

        return totals

    def _payroll_totals(self, payrolls, gross_field, net_field):
        totals = {
            "count": 0,
            "gross": currency_map(),
            "net": currency_map(),
            "deductions": currency_map(),
            "advances": currency_map(),
            "tax": currency_map(),
        }

        for payroll in payrolls:
            currency = payroll.currency
            totals["count"] += 1
            add_currency(totals["gross"], currency, getattr(payroll, gross_field))
            add_currency(totals["net"], currency, getattr(payroll, net_field))
            add_currency(totals["deductions"], currency, getattr(payroll, "deductions", ZERO))
            add_currency(totals["advances"], currency, getattr(payroll, "advances", ZERO))
            add_currency(totals["tax"], currency, getattr(payroll, "tax_deducted", ZERO))

        return totals

    def _contract_totals(self, contracts):
        totals = {
            "count": 0,
            "value": currency_map(),
            "paid": currency_map(),
            "remaining": currency_map(),
            "variation": currency_map(),
        }

        rows = []
        for contract in contracts:
            currency = contract.currency
            adjusted_value = money(contract.adjusted_contract_value)
            paid = self._contract_paid(contract)
            remaining = adjusted_value - paid
            variation = money(contract.total_variation_amount)

            totals["count"] += 1
            add_currency(totals["value"], currency, adjusted_value)
            add_currency(totals["paid"], currency, paid)
            add_currency(totals["remaining"], currency, remaining)
            add_currency(totals["variation"], currency, variation)

            rows.append({
                "project": contract.project.name,
                "contract": contract.contract_number,
                "currency": currency,
                "adjusted_value": adjusted_value,
                "paid": paid,
                "remaining": remaining,
                "progress": contract.completion_percentage,
                "status": contract.get_status_display(),
            })

        return totals, rows

    def _budget_totals(self, projects):
        totals = currency_map()
        for project in projects:
            add_currency(totals, project.budget_currency, project.estimated_budget)
        return totals

    def _monthly_trend(self, expenses, employee_payrolls, worker_payrolls, contracts):
        months = defaultdict(lambda: None)

        def get_month(name):
            if months[name] is None:
                months[name] = empty_month(name)
            return months[name]

        for expense in expenses:
            item = get_month(month_key(expense.expense_date))
            item["expenses_usd"] += money(expense.total_usd)
            item["expenses_afn"] += money(expense.total_afn)
            item["records"] += 1

        for payroll in employee_payrolls:
            item = get_month(month_key(payroll.payroll_period_start))
            item["employee_payroll"] += money(payroll.net_pay)
            item["records"] += 1

        for payroll in worker_payrolls:
            item = get_month(month_key(payroll.period_start))
            item["worker_payroll"] += money(payroll.net_amount)
            item["records"] += 1

        for contract in contracts:
            for payment in contract.payments.all():
                start, end = self.get_date_range()
                if start and payment.payment_date < start:
                    continue
                if end and payment.payment_date > end:
                    continue
                item = get_month(month_key(payment.payment_date))
                item["contract_payments"] += money(payment.amount)
                item["records"] += 1

        return [months[key] for key in sorted(months.keys())]

    def _project_rows(self, projects, expenses, worker_payrolls, contracts):
        by_project = {
            project.id: {
                "id": project.id,
                "project": project.name,
                "budget_currency": project.budget_currency,
                "budget": money(project.estimated_budget),
                "expenses_usd": ZERO,
                "expenses_afn": ZERO,
                "worker_payroll_usd": ZERO,
                "worker_payroll_afn": ZERO,
                "contract_value_usd": ZERO,
                "contract_value_afn": ZERO,
                "contract_paid_usd": ZERO,
                "contract_paid_afn": ZERO,
                "total_cost_usd": ZERO,
                "total_cost_afn": ZERO,
            }
            for project in projects
        }

        for expense in expenses:
            row = by_project.get(expense.project_id)
            if not row:
                continue
            row["expenses_usd"] += money(expense.total_usd)
            row["expenses_afn"] += money(expense.total_afn)

        for payroll in worker_payrolls:
            row = by_project.get(payroll.project_id)
            if not row:
                continue
            if payroll.currency == "USD":
                row["worker_payroll_usd"] += money(payroll.net_amount)
            else:
                row["worker_payroll_afn"] += money(payroll.net_amount)

        for contract in contracts:
            row = by_project.get(contract.project_id)
            if not row:
                continue
            if contract.currency == "USD":
                row["contract_value_usd"] += money(contract.adjusted_contract_value)
                row["contract_paid_usd"] += self._contract_paid(contract)
            else:
                row["contract_value_afn"] += money(contract.adjusted_contract_value)
                row["contract_paid_afn"] += self._contract_paid(contract)

        for row in by_project.values():
            row["total_cost_usd"] = (
                row["expenses_usd"]
                + row["worker_payroll_usd"]
                + row["contract_paid_usd"]
            )
            row["total_cost_afn"] = (
                row["expenses_afn"]
                + row["worker_payroll_afn"]
                + row["contract_paid_afn"]
            )

        return sorted(
            by_project.values(),
            key=lambda row: row["total_cost_usd"] + row["total_cost_afn"],
            reverse=True,
        )

    def generate(self):
        projects = list(self._project_queryset())
        expenses = list(self._expense_queryset())
        employee_payrolls = list(self._employee_payroll_queryset())
        worker_payrolls = list(self._worker_payroll_queryset())
        contracts = list(self._contract_queryset())

        expense_totals = self._expense_totals(expenses)
        employee_payroll = self._payroll_totals(
            employee_payrolls,
            gross_field="gross_pay",
            net_field="net_pay",
        )
        worker_payroll = self._payroll_totals(
            worker_payrolls,
            gross_field="gross_amount",
            net_field="net_amount",
        )
        contract_totals, contract_rows = self._contract_totals(contracts)
        budget_totals = self._budget_totals(projects)

        cost_mix_by_currency = []
        for currency in CURRENCIES:
            expenses_value = expense_totals[f"total_{currency.lower()}"]
            employee_net = employee_payroll["net"][currency]
            worker_net = worker_payroll["net"][currency]
            contract_paid = contract_totals["paid"][currency]
            operating_cost = expenses_value + employee_net + worker_net + contract_paid

            cost_mix_by_currency.append({
                "currency": currency,
                "budget": budget_totals[currency],
                "expenses": expenses_value,
                "employee_payroll": employee_net,
                "worker_payroll": worker_net,
                "contract_paid": contract_paid,
                "operating_cost": operating_cost,
                "contract_value": contract_totals["value"][currency],
                "contract_remaining": contract_totals["remaining"][currency],
            })

        payroll_by_source = [
            {
                "source_type": "Employees",
                "count": employee_payroll["count"],
                "net_usd": employee_payroll["net"]["USD"],
                "net_afn": employee_payroll["net"]["AFN"],
                "gross_usd": employee_payroll["gross"]["USD"],
                "gross_afn": employee_payroll["gross"]["AFN"],
            },
            {
                "source_type": "Daily Workers",
                "count": worker_payroll["count"],
                "net_usd": worker_payroll["net"]["USD"],
                "net_afn": worker_payroll["net"]["AFN"],
                "gross_usd": worker_payroll["gross"]["USD"],
                "gross_afn": worker_payroll["gross"]["AFN"],
            },
        ]

        contract_by_currency = [
            {
                "currency": currency,
                "count": sum(1 for contract in contracts if contract.currency == currency),
                "adjusted_value": contract_totals["value"][currency],
                "paid": contract_totals["paid"][currency],
                "remaining": contract_totals["remaining"][currency],
                "variation": contract_totals["variation"][currency],
            }
            for currency in CURRENCIES
        ]

        summary = {
            "total_projects": len(projects),
            "budget_usd": budget_totals["USD"],
            "budget_afn": budget_totals["AFN"],
            "expense_records": expense_totals["count"],
            "expenses_usd": expense_totals["total_usd"],
            "expenses_afn": expense_totals["total_afn"],
            "employee_payroll_records": employee_payroll["count"],
            "daily_worker_payroll_records": worker_payroll["count"],
            "payroll_net_usd": employee_payroll["net"]["USD"] + worker_payroll["net"]["USD"],
            "payroll_net_afn": employee_payroll["net"]["AFN"] + worker_payroll["net"]["AFN"],
            "contract_count": contract_totals["count"],
            "contract_value_usd": contract_totals["value"]["USD"],
            "contract_value_afn": contract_totals["value"]["AFN"],
            "contract_paid_usd": contract_totals["paid"]["USD"],
            "contract_paid_afn": contract_totals["paid"]["AFN"],
            "operating_cost_usd": next(
                item["operating_cost"]
                for item in cost_mix_by_currency
                if item["currency"] == "USD"
            ),
            "operating_cost_afn": next(
                item["operating_cost"]
                for item in cost_mix_by_currency
                if item["currency"] == "AFN"
            ),
        }

        return {
            **self.get_metadata(),
            "summary": summary,
            "expenses": {
                **expense_totals,
                "total_afn": expense_totals["total_afn"],
                "total_usd": expense_totals["total_usd"],
            },
            "payroll": {
                "count": employee_payroll["count"] + worker_payroll["count"],
                "employee": employee_payroll,
                "daily_worker": worker_payroll,
                "net_usd": summary["payroll_net_usd"],
                "net_afn": summary["payroll_net_afn"],
                "gross_usd": employee_payroll["gross"]["USD"] + worker_payroll["gross"]["USD"],
                "gross_afn": employee_payroll["gross"]["AFN"] + worker_payroll["gross"]["AFN"],
            },
            "contracts": contract_by_currency,
            "contract_details": contract_rows,
            "cost_mix_by_currency": cost_mix_by_currency,
            "payroll_by_source": payroll_by_source,
            "monthly_trend": self._monthly_trend(
                expenses,
                employee_payrolls,
                worker_payrolls,
                contracts,
            ),
            "rows": self._project_rows(projects, expenses, worker_payrolls, contracts),
        }
