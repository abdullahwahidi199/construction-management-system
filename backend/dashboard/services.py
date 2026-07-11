# dashboard/services.py

from datetime import date, timedelta
from decimal import Decimal
from collections import defaultdict

from django.db.models import (
    Sum, Count, Avg, Q, F, Value, CharField,
    DecimalField, Case, When, ExpressionWrapper,
    Subquery, OuterRef
)
from django.db.models.functions import (
    TruncMonth, TruncWeek, Coalesce, ExtractMonth, ExtractYear
)
from django.utils import timezone

from project.models import Project
from expenses.models import Expense
from Employees.models import Employee, Payroll, Attendance
from labour.models import WorkerPayroll
from subcontractor.models import (
    Subcontractor, Contract, ContractPayment,
    ContractVariation, ContractStatusChoices
)


class DashboardService:
    """
    Central service that computes every metric the dashboard needs.
    All methods are @staticmethod so they can be called without instantiation.
    All monetary values are returned in BOTH AFN and USD where applicable.
    """

    # ════════════════════════════════════════════
    # 1. PROJECT METRICS
    # ════════════════════════════════════════════

    @staticmethod
    def get_project_overview():
        """
        Returns project counts by status, property type breakdown,
        and floor statistics.
        """
        projects = Project.objects.all()
        total = projects.count()

        # --- Status breakdown ---
        status_counts = dict(
            projects.values_list("status")
            .annotate(count=Count("id"))
            .values_list("status", "count")
        )

        # --- Property type breakdown ---
        property_type_counts = dict(
            projects.values_list("property_type")
            .annotate(count=Count("id"))
            .values_list("property_type", "count")
        )

        # --- Budget aggregation ---
        budget_agg = projects.aggregate(
            total_estimated_budget_afn=Coalesce(
                Sum("estimated_budget", filter=Q(budget_currency="AFN")), Decimal("0.00")
            ),
            total_estimated_budget_usd=Coalesce(
                Sum("estimated_budget", filter=Q(budget_currency="USD")), Decimal("0.00")
            ),
            avg_estimated_budget=Coalesce(
                Avg("estimated_budget"), Decimal("0.00")
            ),
        )

        # --- Timeline stats ---
        today = date.today()
        overdue_projects = projects.filter(
            expected_completion_date__lt=today,
            actual_completion_date__isnull=True,
            status__in=["planning", "ongoing"],
        )

        return {
            "total_projects": total,
            "status_breakdown": {
                "planning": status_counts.get("planning", 0),
                "ongoing": status_counts.get("ongoing", 0),
                "completed": status_counts.get("completed", 0),
                "on_hold": status_counts.get("on_hold", 0),
            },
            "property_type_breakdown": {
                "residential": property_type_counts.get("residential", 0),
                "commercial": property_type_counts.get("commercial", 0),
                "mixed": property_type_counts.get("mixed", 0),
            },
            "total_estimated_budget": {
                "AFN": budget_agg["total_estimated_budget_afn"],
                "USD": budget_agg["total_estimated_budget_usd"],
            },
            "avg_estimated_budget": round(budget_agg["avg_estimated_budget"], 2),
            "overdue_projects_count": overdue_projects.count(),
            "overdue_projects": list(
                overdue_projects.values(
                    "id", "name", "expected_completion_date", "status", "location"
                )[:5]
            ),
        }

    @staticmethod
    def get_project_budget_comparison():
        """
        For each ongoing/planning project, compare estimated budget
        vs actual expenses (in both USD and AFN).
        """
        projects = Project.objects.filter(
            status__in=["planning", "ongoing"]
        ).prefetch_related("expenses")

        results = []
        for project in projects:
            expenses = project.expenses.all()
            total_expense_usd = sum(
                float(exp.total_usd) for exp in expenses
            )
            total_expense_afn = sum(
                float(exp.total_afn) for exp in expenses
            )
            estimated = float(project.estimated_budget)
            budget_currency = project.budget_currency
            comparable_spent = total_expense_usd if budget_currency == "USD" else total_expense_afn

            results.append({
                "id": project.id,
                "name": project.name,
                "status": project.status,
                "estimated_budget": estimated,
                "budget_currency": budget_currency,
                "total_spent_usd": round(total_expense_usd, 2),
                "total_spent_afn": round(total_expense_afn, 2),
                "budget_remaining": round(estimated - comparable_spent, 2),
                "budget_remaining_usd": round(estimated - total_expense_usd, 2) if budget_currency == "USD" else None,
                "budget_remaining_afn": round(estimated - total_expense_afn, 2) if budget_currency == "AFN" else None,
                "budget_utilization_pct": round(
                    (comparable_spent / estimated * 100)
                    if estimated > 0 else 0, 1
                ),
                "is_over_budget": comparable_spent > estimated,
            })

        # Sort by utilization descending (most critical first)
        results.sort(key=lambda x: x["budget_utilization_pct"], reverse=True)
        return results

    # ════════════════════════════════════════════
    # 2. EXPENSE / FINANCIAL METRICS
    # ════════════════════════════════════════════

    @staticmethod
    def get_expense_summary():
        """
        Overall expense totals, category breakdown, and monthly trends.
        """
        expenses = Expense.objects.all()

        # --- Overall totals ---
        totals = expenses.aggregate(
            total_afn=Coalesce(Sum("amount_afn"), Decimal("0.00")),
            total_usd=Coalesce(Sum("amount_usd"), Decimal("0.00")),
            total_count=Count("id"),
        )

        # --- By expense type ---
        by_type = list(
            expenses.values("expense_type")
            .annotate(
                total_afn=Coalesce(Sum("amount_afn"), Decimal("0.00")),
                total_usd=Coalesce(Sum("amount_usd"), Decimal("0.00")),
                count=Count("id"),
            )
            .order_by("-total_usd")
        )

        # --- Monthly trend (last 12 months) ---
        twelve_months_ago = date.today() - timedelta(days=365)
        monthly_trend = list(
            expenses.filter(expense_date__gte=twelve_months_ago)
            .annotate(month=TruncMonth("expense_date"))
            .values("month")
            .annotate(
                total_afn=Coalesce(Sum("amount_afn"), Decimal("0.00")),
                total_usd=Coalesce(Sum("amount_usd"), Decimal("0.00")),
                count=Count("id"),
            )
            .order_by("month")
        )

        # Format month for JSON
        for entry in monthly_trend:
            entry["month"] = entry["month"].strftime("%Y-%m")

        # --- Top 5 expenses ---
        # We can't sort by a property, so we get recent ones
        recent_expenses = list(
            expenses.select_related("project")
            .order_by("-expense_date")[:5]
            .values(
                "id", "serial_number", "description",
                "amount_afn", "amount_usd", "expense_date",
                "expense_type", "project__name"
            )
        )

        # --- By project ---
        by_project = list(
            expenses.values("project__id", "project__name")
            .annotate(
                total_afn=Coalesce(Sum("amount_afn"), Decimal("0.00")),
                total_usd=Coalesce(Sum("amount_usd"), Decimal("0.00")),
                count=Count("id"),
            )
            .order_by("-total_usd")[:10]
        )

        return {
            "total_expenses_afn": totals["total_afn"],
            "total_expenses_usd": totals["total_usd"],
            "total_expense_count": totals["total_count"],
            "by_expense_type": by_type,
            "monthly_trend": monthly_trend,
            "recent_expenses": recent_expenses,
            "by_project": by_project,
        }

    @staticmethod
    def get_expense_this_month():
        """Current month expense snapshot."""
        today = date.today()
        first_of_month = today.replace(day=1)

        current_month = Expense.objects.filter(
            expense_date__gte=first_of_month,
            expense_date__lte=today,
        ).aggregate(
            total_afn=Coalesce(Sum("amount_afn"), Decimal("0.00")),
            total_usd=Coalesce(Sum("amount_usd"), Decimal("0.00")),
            count=Count("id"),
        )

        # Previous month for comparison
        prev_month_start = (first_of_month - timedelta(days=1)).replace(day=1)
        prev_month_end = first_of_month - timedelta(days=1)

        previous_month = Expense.objects.filter(
            expense_date__gte=prev_month_start,
            expense_date__lte=prev_month_end,
        ).aggregate(
            total_afn=Coalesce(Sum("amount_afn"), Decimal("0.00")),
            total_usd=Coalesce(Sum("amount_usd"), Decimal("0.00")),
            count=Count("id"),
        )

        # Calculate change percentage
        prev_usd = float(previous_month["total_usd"])
        curr_usd = float(current_month["total_usd"])
        change_pct = (
            round(((curr_usd - prev_usd) / prev_usd) * 100, 1)
            if prev_usd > 0 else 0
        )

        return {
            "current_month": {
                "total_afn": current_month["total_afn"],
                "total_usd": current_month["total_usd"],
                "count": current_month["count"],
            },
            "previous_month": {
                "total_afn": previous_month["total_afn"],
                "total_usd": previous_month["total_usd"],
                "count": previous_month["count"],
            },
            "change_percentage": change_pct,
            "trend": (
                "up" if change_pct > 0
                else "down" if change_pct < 0
                else "stable"
            ),
        }

    # ════════════════════════════════════════════
    # 3. WORKFORCE METRICS
    # ════════════════════════════════════════════

    @staticmethod
    def get_workforce_summary():
        """
        Employee headcount, department distribution,
        employment type breakdown, and recent hires.
        """
        employees = Employee.objects.all()
        active_employees = employees.filter(is_active=True)

        # --- Department breakdown ---
        department_breakdown = list(
            active_employees.values("department")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # --- Employment type breakdown ---
        employment_type_breakdown = list(
            active_employees.values("employment_type")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # --- Salary stats ---
        salary_stats = active_employees.aggregate(
            total_monthly_salary=Coalesce(
                Sum("salary"), Decimal("0.00")
            ),
            avg_salary=Coalesce(Avg("salary"), Decimal("0.00")),
        )

        # --- Recent hires (last 30 days) ---
        thirty_days_ago = date.today() - timedelta(days=30)
        recent_hires = list(
            employees.filter(hire_date__gte=thirty_days_ago)
            .values(
                "id", "employee_id", "first_name", "last_name",
                "department", "position", "hire_date"
            )
            .order_by("-hire_date")[:5]
        )

        return {
            "total_employees": employees.count(),
            "active_employees": active_employees.count(),
            "inactive_employees": employees.filter(is_active=False).count(),
            "department_breakdown": department_breakdown,
            "employment_type_breakdown": employment_type_breakdown,
            "total_monthly_salary": salary_stats["total_monthly_salary"],
            "avg_salary": round(salary_stats["avg_salary"], 2),
            "recent_hires": recent_hires,
        }

    @staticmethod
    def get_attendance_summary():
        """
        Today's attendance snapshot and weekly trend.
        """
        today = date.today()

        # --- Today's attendance ---
        today_records = Attendance.objects.filter(date=today)
        active_employee_count = Employee.objects.filter(
            is_active=True
        ).count()

        today_stats = dict(
            today_records.values_list("status")
            .annotate(count=Count("id"))
            .values_list("status", "count")
        )

        present_count = today_stats.get("present", 0)
        absent_count = today_stats.get("absent", 0)
        half_day_count = today_stats.get("half_day", 0)
        leave_count = today_stats.get("leave", 0)
        not_marked = active_employee_count - sum(today_stats.values())

        attendance_rate = (
            round(
                (present_count + half_day_count * 0.5)
                / active_employee_count * 100, 1
            )
            if active_employee_count > 0 else 0
        )

        # --- Weekly trend (last 7 days) ---
        week_ago = today - timedelta(days=6)
        weekly_trend = list(
            Attendance.objects.filter(
                date__gte=week_ago, date__lte=today
            )
            .values("date")
            .annotate(
                present=Count("id", filter=Q(status="present")),
                absent=Count("id", filter=Q(status="absent")),
                half_day=Count("id", filter=Q(status="half_day")),
                leave=Count("id", filter=Q(status="leave")),
                total=Count("id"),
            )
            .order_by("date")
        )

        for entry in weekly_trend:
            entry["date"] = entry["date"].strftime("%Y-%m-%d")
            entry["attendance_rate"] = round(
                (entry["present"] + entry["half_day"] * 0.5)
                / active_employee_count * 100, 1
            ) if active_employee_count > 0 else 0

        # --- Today's overtime ---
        today_overtime = today_records.aggregate(
            total_overtime=Coalesce(
                Sum("overtime_hours"), Decimal("0.00")
            )
        )

        return {
            "today": {
                "date": today.strftime("%Y-%m-%d"),
                "present": present_count,
                "absent": absent_count,
                "half_day": half_day_count,
                "leave": leave_count,
                "not_marked": not_marked,
                "total_active_employees": active_employee_count,
                "attendance_rate": attendance_rate,
                "total_overtime_hours": today_overtime["total_overtime"],
            },
            "weekly_trend": weekly_trend,
        }




    @staticmethod
    def get_payroll_summary():
        """
        Current and last month payroll totals with currency separation.
        """
        overtime_expr = ExpressionWrapper(
    F("overtime_hours") * F("overtime_rate"),
    output_field=DecimalField(max_digits=12, decimal_places=2)
)
        today = date.today()
        first_of_month = today.replace(day=1)

        # ── Current month payroll ─────────────────────
        current_month_payroll = Payroll.objects.filter(
            payroll_period_start__gte=first_of_month,
        ).aggregate(
            gross_usd=Coalesce(Sum("gross_pay", filter=Q(currency="USD")), Decimal("0.00")),
            gross_afn=Coalesce(Sum("gross_pay", filter=Q(currency="AFN")), Decimal("0.00")),

            net_usd=Coalesce(Sum("net_pay", filter=Q(currency="USD")), Decimal("0.00")),
            net_afn=Coalesce(Sum("net_pay", filter=Q(currency="AFN")), Decimal("0.00")),

            deductions_usd=Coalesce(Sum("deductions", filter=Q(currency="USD")), Decimal("0.00")),
            deductions_afn=Coalesce(Sum("deductions", filter=Q(currency="AFN")), Decimal("0.00")),

            tax_usd=Coalesce(Sum("tax_deducted", filter=Q(currency="USD")), Decimal("0.00")),
            tax_afn=Coalesce(Sum("tax_deducted", filter=Q(currency="AFN")), Decimal("0.00")),

            bonus_usd=Coalesce(Sum("bonus", filter=Q(currency="USD")), Decimal("0.00")),
            bonus_afn=Coalesce(Sum("bonus", filter=Q(currency="AFN")), Decimal("0.00")),

            overtime_usd=Coalesce(Sum("overtime_amount", filter=Q(currency="USD")), Decimal("0.00")),
            overtime_afn=Coalesce(Sum("overtime_amount", filter=Q(currency="AFN")), Decimal("0.00")),

            count=Count("id"),
        )

        # ── Previous month payroll ───────────────────
        prev_month_start = (first_of_month - timedelta(days=1)).replace(day=1)

        prev_month_payroll = Payroll.objects.filter(
            payroll_period_start__gte=prev_month_start,
            payroll_period_start__lt=first_of_month,
        ).aggregate(
            gross_usd=Coalesce(
                Sum("gross_pay", filter=Q(currency="USD")),
                Decimal("0.00"),
            ),
            gross_afn=Coalesce(
                Sum("gross_pay", filter=Q(currency="AFN")),
                Decimal("0.00"),
            ),
            net_usd=Coalesce(
                Sum("net_pay", filter=Q(currency="USD")),
                Decimal("0.00"),
            ),
            net_afn=Coalesce(
                Sum("net_pay", filter=Q(currency="AFN")),
                Decimal("0.00"),
            ),
            count=Count("id"),
        )

        # ── Payment method breakdown (FIXED) ─────────
        payment_method_breakdown = list(
            Payroll.objects.values("payment_method")
            .annotate(
                count=Count("id"),
                total_usd=Coalesce(
                    Sum("net_pay", filter=Q(currency="USD")),
                    Decimal("0.00"),
                ),
                total_afn=Coalesce(
                    Sum("net_pay", filter=Q(currency="AFN")),
                    Decimal("0.00"),
                ),
            )
            .order_by("-count")
        )

        # ── Recent payrolls ──────────────────────────
        recent_payrolls = list(
            Payroll.objects.select_related("employee")
            .order_by("-payroll_period_start")[:5]
            .values(
                "id",
                "employee__first_name",
                "employee__last_name",
                "employee__employee_id",
                "payroll_period_start",
                "payroll_period_end",
                "gross_pay",
                "net_pay",
                "currency",
                "payment_date",
            )
        )

        return {
            "current_month": current_month_payroll,
            "previous_month": prev_month_payroll,

            "payment_method_breakdown": payment_method_breakdown,

            "recent_payrolls": recent_payrolls,
        }

    # ════════════════════════════════════════════
    # 4. CONTRACT / SUBCONTRACTOR METRICS
    # ════════════════════════════════════════════

   


    @staticmethod
    def get_contract_summary():
        """
        Contract status counts, total values, subcontractor breakdown
        with proper currency separation.
        """

        contracts = Contract.objects.select_related(
            "project", "subcontractor"
        )

        # ── Status breakdown ───────────────────────
        status_counts = (
            contracts.values("status")
            .annotate(count=Count("id"))
        )

        status_breakdown = {
            row["status"]: row["count"]
            for row in status_counts
        }

        # ── Financial aggregates (BY CURRENCY) ─────
        financial = contracts.aggregate(
            total_contract_value_usd=Coalesce(
                Sum("contract_value", filter=Q(currency="USD")),
                Decimal("0.00")
            ),
            total_contract_value_afn=Coalesce(
                Sum("contract_value", filter=Q(currency="AFN")),
                Decimal("0.00")
            ),
            total_retention_usd=Coalesce(
                Sum("retention_amount", filter=Q(currency="USD")),
                Decimal("0.00")
            ),
            total_retention_afn=Coalesce(
                Sum("retention_amount", filter=Q(currency="AFN")),
                Decimal("0.00")
            ),
            avg_completion=Coalesce(
                Avg("completion_percentage"),
                Decimal("0.00")
            ),
        )

        # ── Contract Payments (inherited currency) ──
        total_payments = ContractPayment.objects.aggregate(
            total_usd=Coalesce(
                Sum("amount", filter=Q(contract__currency="USD")),
                Decimal("0.00")
            ),
            total_afn=Coalesce(
                Sum("amount", filter=Q(contract__currency="AFN")),
                Decimal("0.00")
            ),
            count=Count("id"),
        )

        # ── Variations (currency inherited from contract) ──
        total_variations = ContractVariation.objects.filter(
            approved=True
        ).aggregate(
            total_usd=Coalesce(
                Sum("amount_change", filter=Q(contract__currency="USD")),
                Decimal("0.00")
            ),
            total_afn=Coalesce(
                Sum("amount_change", filter=Q(contract__currency="AFN")),
                Decimal("0.00")
            ),
            count=Count("id"),
        )

        # ── Ending soon ─────────────────────────────
        thirty_days_ahead = date.today() + timedelta(days=30)

        ending_soon = list(
            contracts.filter(
                status=ContractStatusChoices.ACTIVE,
                end_date__lte=thirty_days_ahead,
                end_date__gte=date.today(),
            ).values(
                "id",
                "contract_number",
                "title",
                "subcontractor__name",
                "end_date",
                "completion_percentage",
                "currency",
            )[:5]
        )

        # ── Overdue contracts ───────────────────────
        overdue_contracts = list(
            contracts.filter(
                status=ContractStatusChoices.ACTIVE,
                end_date__lt=date.today(),
            ).values(
                "id",
                "contract_number",
                "title",
                "subcontractor__name",
                "end_date",
                "completion_percentage",
                "currency",
            )[:5]
        )

        # ── Currency breakdown (FIXED) ──────────────
        by_currency = list(
            contracts.values("currency")
            .annotate(
                count=Count("id"),
                total_value=Coalesce(
                    Sum("contract_value"),
                    Decimal("0.00")
                ),
                total_paid=Coalesce(
                    Sum("payments__amount"),
                    Decimal("0.00")
                ),
            )
        )

        return {
            "total_contracts": contracts.count(),

            "status_breakdown": {
                "draft": status_breakdown.get("draft", 0),
                "active": status_breakdown.get("active", 0),
                "completed": status_breakdown.get("completed", 0),
                "terminated": status_breakdown.get("terminated", 0),
                "cancelled": status_breakdown.get("cancelled", 0),
            },

            # ── CONTRACT VALUES ──
            "total_contract_value_usd": financial["total_contract_value_usd"],
            "total_contract_value_afn": financial["total_contract_value_afn"],

            "total_retention_held_usd": financial["total_retention_usd"],
            "total_retention_held_afn": financial["total_retention_afn"],

            "avg_completion": round(financial["avg_completion"], 1),

            # ── PAYMENTS ──
            "total_payments_made_usd": total_payments["total_usd"],
            "total_payments_made_afn": total_payments["total_afn"],
            "total_payment_count": total_payments["count"],

            # ── VARIATIONS ──
            "total_approved_variations_usd": total_variations["total_usd"],
            "total_approved_variations_afn": total_variations["total_afn"],
            "variation_count": total_variations["count"],

            # ── ALERTS ──
            "contracts_ending_soon": ending_soon,
            "overdue_contracts": overdue_contracts,

            # ── BREAKDOWN ──
            "by_currency": by_currency,
        }

    @staticmethod
    def get_subcontractor_summary():
        """Active subcontractors, specialization breakdown."""
        subcontractors = Subcontractor.objects.all()

        specialization_breakdown = list(
            subcontractors.filter(is_active=True)
            .values("specialization")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        top_subcontractors = list(
            subcontractors.filter(is_active=True)
            .annotate(
                contract_count=Count("contracts"),
                total_value=Coalesce(
                    Sum("contracts__contract_value"), Decimal("0.00")
                ),
            )
            .order_by("-total_value")[:5]
            .values(
                "id", "name", "specialization",
                "contract_count", "total_value",
            )
        )

        return {
            "total_subcontractors": subcontractors.count(),
            "active_subcontractors": subcontractors.filter(
                is_active=True
            ).count(),
            "inactive_subcontractors": subcontractors.filter(
                is_active=False
            ).count(),
            "specialization_breakdown": specialization_breakdown,
            "top_subcontractors_by_value": top_subcontractors,
        }

    # ════════════════════════════════════════════
    # 5. ALERTS & NOTIFICATIONS
    # ════════════════════════════════════════════

    @staticmethod
    def get_alerts():
        """
        System-wide alerts for things that need attention.
        Returns categorized alerts with severity levels.
        """
        today = date.today()
        alerts = []

        # --- Overdue projects ---
        overdue_projects = Project.objects.filter(
            expected_completion_date__lt=today,
            actual_completion_date__isnull=True,
            status__in=["planning", "ongoing"],
        )
        for project in overdue_projects[:5]:
            days_overdue = (today - project.expected_completion_date).days
            alerts.append({
                "type": "project_overdue",
                "severity": "high" if days_overdue > 30 else "medium",
                "title": f"Project Overdue: {project.name}",
                "message": (
                    f"{project.name} is {days_overdue} days past "
                    f"expected completion date "
                    f"({project.expected_completion_date})"
                ),
                "entity_type": "project",
                "entity_id": project.id,
                "days_overdue": days_overdue,
            })

        # --- Over-budget projects ---
        over_budget_projects = Project.objects.filter(
            status__in=["planning", "ongoing"],
            estimated_budget__gt=0,
        ).prefetch_related("expenses")

        for project in over_budget_projects:
            total_spent = sum(
                float(exp.total_usd) for exp in project.expenses.all()
            )
            budget = float(project.estimated_budget)
            if budget > 0 and total_spent > budget:
                over_pct = round(
                    ((total_spent - budget) / budget) * 100, 1
                )
                alerts.append({
                    "type": "over_budget",
                    "severity": "high" if over_pct > 20 else "medium",
                    "title": f"Over Budget: {project.name}",
                    "message": (
                        f"{project.name} is {over_pct}% over budget. "
                        f"Budget: ${budget:,.2f}, "
                        f"Spent: ${total_spent:,.2f}"
                    ),
                    "entity_type": "project",
                    "entity_id": project.id,
                    "over_percentage": over_pct,
                })
            elif budget > 0 and total_spent > budget * 0.9:
                alerts.append({
                    "type": "near_budget",
                    "severity": "low",
                    "title": f"Near Budget Limit: {project.name}",
                    "message": (
                        f"{project.name} has used "
                        f"{round(total_spent/budget*100, 1)}% of budget"
                    ),
                    "entity_type": "project",
                    "entity_id": project.id,
                })

        # --- Overdue contracts ---
        overdue_contracts = Contract.objects.filter(
            status=ContractStatusChoices.ACTIVE,
            end_date__lt=today,
        ).select_related("subcontractor")

        for contract in overdue_contracts[:5]:
            days_overdue = (today - contract.end_date).days
            alerts.append({
                "type": "contract_overdue",
                "severity": "high" if days_overdue > 14 else "medium",
                "title": (
                    f"Contract Overdue: {contract.contract_number}"
                ),
                "message": (
                    f"Contract {contract.title} with "
                    f"{contract.subcontractor.name} is {days_overdue} "
                    f"days past end date"
                ),
                "entity_type": "contract",
                "entity_id": contract.id,
                "days_overdue": days_overdue,
            })

        # --- Contracts ending soon (within 7 days) ---
        week_ahead = today + timedelta(days=7)
        ending_soon = Contract.objects.filter(
            status=ContractStatusChoices.ACTIVE,
            end_date__gte=today,
            end_date__lte=week_ahead,
        ).select_related("subcontractor")

        for contract in ending_soon:
            days_remaining = (contract.end_date - today).days
            alerts.append({
                "type": "contract_ending_soon",
                "severity": "medium",
                "title": (
                    f"Contract Ending Soon: "
                    f"{contract.contract_number}"
                ),
                "message": (
                    f"Contract {contract.title} with "
                    f"{contract.subcontractor.name} ends in "
                    f"{days_remaining} days"
                ),
                "entity_type": "contract",
                "entity_id": contract.id,
                "days_remaining": days_remaining,
            })

        # --- Low attendance today ---
        active_count = Employee.objects.filter(is_active=True).count()
        if active_count > 0:
            present_today = Attendance.objects.filter(
                date=today, status__in=["present", "half_day"]
            ).count()
            attendance_rate = round(
                present_today / active_count * 100, 1
            )
            if attendance_rate < 70:
                alerts.append({
                    "type": "low_attendance",
                    "severity": (
                        "high" if attendance_rate < 50 else "medium"
                    ),
                    "title": "Low Attendance Today",
                    "message": (
                        f"Only {attendance_rate}% attendance today "
                        f"({present_today}/{active_count} employees)"
                    ),
                    "entity_type": "attendance",
                    "entity_id": None,
                    "attendance_rate": attendance_rate,
                })

        # Sort alerts by severity
        severity_order = {"high": 0, "medium": 1, "low": 2}
        alerts.sort(key=lambda x: severity_order.get(x["severity"], 3))

        return {
            "total_alerts": len(alerts),
            "high_count": sum(
                1 for a in alerts if a["severity"] == "high"
            ),
            "medium_count": sum(
                1 for a in alerts if a["severity"] == "medium"
            ),
            "low_count": sum(
                1 for a in alerts if a["severity"] == "low"
            ),
            "alerts": alerts,
        }

    # ════════════════════════════════════════════
    # 6. RECENT ACTIVITY FEED
    # ════════════════════════════════════════════

    @staticmethod
    def get_recent_activity(limit=15):
        """
        Unified activity feed from all modules.
        Returns chronologically sorted recent entries.
        """
        activities = []

        # Recent expenses
        recent_expenses = (
            Expense.objects.select_related("project")
            .order_by("-created_at")[:limit]
        )
        for expense in recent_expenses:
            activities.append({
                "type": "expense",
                "icon": "receipt",
                "title": f"Expense #{expense.serial_number} recorded",
                "description": (
                    f"{expense.description[:80]}... "
                    if len(expense.description) > 80
                    else expense.description
                ),
                "project": expense.project.name,
                "amount_display": (
                    f"AFN {expense.amount_afn:,.2f}"
                    if expense.amount_afn > 0
                    else f"USD {expense.amount_usd:,.2f}"
                ),
                "timestamp": expense.created_at,
                "entity_id": expense.id,
            })

        # Recent contract payments
        recent_payments = (
            ContractPayment.objects.select_related(
                "contract__subcontractor", "contract__project"
            ).order_by("-created_at")[:limit]
        )
        for payment in recent_payments:
            activities.append({
                "type": "contract_payment",
                "icon": "payments",
                "title": (
                    f"Payment to "
                    f"{payment.contract.subcontractor.name}"
                ),
                "description": (
                    f"{payment.get_payment_type_display()} payment "
                    f"for {payment.contract.title}"
                ),
                "project": payment.contract.project.name,
                "amount_display": f"{payment.amount:,.2f}",
                "timestamp": payment.created_at,
                "entity_id": payment.id,
            })

        # Recent payrolls
        recent_payrolls = (
            Payroll.objects.select_related("employee")
            .order_by("-created_at")[:limit]
        )
        for payroll in recent_payrolls:
            activities.append({
                "type": "payroll",
                "icon": "account_balance_wallet",
                "title": (
                    f"Payroll processed: "
                    f"{payroll.employee.full_name}"
                ),
                "description": (
                    f"Period: {payroll.payroll_period_start} to "
                    f"{payroll.payroll_period_end}"
                ),
                "project": None,
                "amount_display": f"{payroll.net_pay:,.2f}",
                "timestamp": payroll.created_at,
                "entity_id": payroll.id,
            })

        # Recent employees
        recent_employees = (
            Employee.objects.order_by("-created_at")[:limit]
        )
        for emp in recent_employees:
            activities.append({
                "type": "employee",
                "icon": "person_add",
                "title": f"Employee added: {emp.full_name}",
                "description": (
                    f"{emp.position} - {emp.get_department_display()}"
                ),
                "project": None,
                "amount_display": None,
                "timestamp": emp.created_at,
                "entity_id": emp.id,
            })

        # Sort all by timestamp descending
        activities.sort(key=lambda x: x["timestamp"], reverse=True)

        # Format timestamps and take the limit
        for activity in activities[:limit]:
            activity["timestamp"] = activity["timestamp"].isoformat()

        return activities[:limit]

    # ════════════════════════════════════════════
    # 7. COMBINED FINANCIAL OVERVIEW
    # ════════════════════════════════════════════

    from decimal import Decimal

    from django.db.models import Q, Sum
    from django.db.models.functions import Coalesce


    @staticmethod
    def get_financial_overview():
        """
        Unified financial overview combining expenses,
        payroll, and contract payments with currency separation.
        """

        # ── Direct Expenses ─────────────────────────
        total_expenses_usd = Expense.objects.aggregate(
            total=Coalesce(Sum("amount_usd"), Decimal("0.00"))
        )["total"]

        total_expenses_afn = Expense.objects.aggregate(
            total=Coalesce(Sum("amount_afn"), Decimal("0.00"))
        )["total"]

        # ── Payroll ────────────────────────────────
        payroll = Payroll.objects.aggregate(
            gross_usd=Coalesce(
                Sum("gross_pay", filter=Q(currency="USD")),
                Decimal("0.00"),
            ),
            gross_afn=Coalesce(
                Sum("gross_pay", filter=Q(currency="AFN")),
                Decimal("0.00"),
            ),
            net_usd=Coalesce(
                Sum("net_pay", filter=Q(currency="USD")),
                Decimal("0.00"),
            ),
            net_afn=Coalesce(
                Sum("net_pay", filter=Q(currency="AFN")),
                Decimal("0.00"),
            ),
        )
        worker_payroll = WorkerPayroll.objects.aggregate(
            gross_usd=Coalesce(
                Sum("gross_amount", filter=Q(currency="USD")),
                Decimal("0.00"),
            ),
            gross_afn=Coalesce(
                Sum("gross_amount", filter=Q(currency="AFN")),
                Decimal("0.00"),
            ),
            net_usd=Coalesce(
                Sum("net_amount", filter=Q(currency="USD")),
                Decimal("0.00"),
            ),
            net_afn=Coalesce(
                Sum("net_amount", filter=Q(currency="AFN")),
                Decimal("0.00"),
            ),
        )

        # ── Contract Payments ──────────────────────
        contract_payments = ContractPayment.objects.aggregate(
            total_usd=Coalesce(
                Sum(
                    "amount",
                    filter=Q(contract__currency="USD"),
                ),
                Decimal("0.00"),
            ),
            total_afn=Coalesce(
                Sum(
                    "amount",
                    filter=Q(contract__currency="AFN"),
                ),
                Decimal("0.00"),
            ),
        )

        # ── Contract Values ────────────────────────
        contract_values = Contract.objects.aggregate(
            total_usd=Coalesce(
                Sum(
                    "contract_value",
                    filter=Q(currency="USD"),
                ),
                Decimal("0.00"),
            ),
            total_afn=Coalesce(
                Sum(
                    "contract_value",
                    filter=Q(currency="AFN"),
                ),
                Decimal("0.00"),
            ),
        )

        # ── Project Budgets ────────────────────────
        total_budget = Project.objects.aggregate(
            usd=Coalesce(Sum("estimated_budget", filter=Q(budget_currency="USD")), Decimal("0.00")),
            afn=Coalesce(Sum("estimated_budget", filter=Q(budget_currency="AFN")), Decimal("0.00")),
        )

        return {
            "total_budget_all_projects": {
                "usd": total_budget["usd"],
                "afn": total_budget["afn"],
            },

            "expenses": {
                "total_usd": total_expenses_usd,
                "total_afn": total_expenses_afn,
            },

            "payroll": {
                "gross_usd": payroll["gross_usd"] + worker_payroll["gross_usd"],
                "gross_afn": payroll["gross_afn"] + worker_payroll["gross_afn"],
                "net_usd": payroll["net_usd"] + worker_payroll["net_usd"],
                "net_afn": payroll["net_afn"] + worker_payroll["net_afn"],
                "employee_net_usd": payroll["net_usd"],
                "employee_net_afn": payroll["net_afn"],
                "daily_worker_net_usd": worker_payroll["net_usd"],
                "daily_worker_net_afn": worker_payroll["net_afn"],
            },

            "contracts": {
                "total_contract_value_usd": contract_values["total_usd"],
                "total_contract_value_afn": contract_values["total_afn"],

                "total_payments_made_usd": contract_payments["total_usd"],
                "total_payments_made_afn": contract_payments["total_afn"],

                "total_remaining_usd": (
                    contract_values["total_usd"]
                    - contract_payments["total_usd"]
                ),

                "total_remaining_afn": (
                    contract_values["total_afn"]
                    - contract_payments["total_afn"]
                ),
            },

            "grand_total_outflow": {
                "usd": (
                    total_expenses_usd
                    + payroll["net_usd"]
                    + worker_payroll["net_usd"]
                    + contract_payments["total_usd"]
                ),
                "afn": (
                    total_expenses_afn
                    + payroll["net_afn"]
                    + worker_payroll["net_afn"]
                    + contract_payments["total_afn"]
                ),
            },
        }

    # ════════════════════════════════════════════
    # 8. FULL DASHBOARD (combines everything)
    # ════════════════════════════════════════════

    @staticmethod
    def get_payroll_summary():
        today = date.today()
        first_of_month = today.replace(day=1)
        prev_month_start = (first_of_month - timedelta(days=1)).replace(day=1)

        def employee_totals(queryset):
            return queryset.aggregate(
                gross_usd=Coalesce(Sum("gross_pay", filter=Q(currency="USD")), Decimal("0.00")),
                gross_afn=Coalesce(Sum("gross_pay", filter=Q(currency="AFN")), Decimal("0.00")),
                net_usd=Coalesce(Sum("net_pay", filter=Q(currency="USD")), Decimal("0.00")),
                net_afn=Coalesce(Sum("net_pay", filter=Q(currency="AFN")), Decimal("0.00")),
                deductions_usd=Coalesce(Sum("deductions", filter=Q(currency="USD")), Decimal("0.00")),
                deductions_afn=Coalesce(Sum("deductions", filter=Q(currency="AFN")), Decimal("0.00")),
                tax_usd=Coalesce(Sum("tax_deducted", filter=Q(currency="USD")), Decimal("0.00")),
                tax_afn=Coalesce(Sum("tax_deducted", filter=Q(currency="AFN")), Decimal("0.00")),
                bonus_usd=Coalesce(Sum("bonus", filter=Q(currency="USD")), Decimal("0.00")),
                bonus_afn=Coalesce(Sum("bonus", filter=Q(currency="AFN")), Decimal("0.00")),
                overtime_usd=Coalesce(Sum("overtime_amount", filter=Q(currency="USD")), Decimal("0.00")),
                overtime_afn=Coalesce(Sum("overtime_amount", filter=Q(currency="AFN")), Decimal("0.00")),
                count=Count("id"),
            )

        overtime_amount = ExpressionWrapper(
            F("overtime_hours") * F("overtime_rate_applied"),
            output_field=DecimalField(max_digits=15, decimal_places=2),
        )

        def worker_totals(queryset):
            return queryset.aggregate(
                gross_usd=Coalesce(Sum("gross_amount", filter=Q(currency="USD")), Decimal("0.00")),
                gross_afn=Coalesce(Sum("gross_amount", filter=Q(currency="AFN")), Decimal("0.00")),
                net_usd=Coalesce(Sum("net_amount", filter=Q(currency="USD")), Decimal("0.00")),
                net_afn=Coalesce(Sum("net_amount", filter=Q(currency="AFN")), Decimal("0.00")),
                deductions_usd=Coalesce(Sum("deductions", filter=Q(currency="USD")), Decimal("0.00")),
                deductions_afn=Coalesce(Sum("deductions", filter=Q(currency="AFN")), Decimal("0.00")),
                advances_usd=Coalesce(Sum("advances", filter=Q(currency="USD")), Decimal("0.00")),
                advances_afn=Coalesce(Sum("advances", filter=Q(currency="AFN")), Decimal("0.00")),
                overtime_usd=Coalesce(Sum(overtime_amount, filter=Q(currency="USD")), Decimal("0.00")),
                overtime_afn=Coalesce(Sum(overtime_amount, filter=Q(currency="AFN")), Decimal("0.00")),
                count=Count("id"),
            )

        employee_current = employee_totals(Payroll.objects.filter(payroll_period_start__gte=first_of_month))
        employee_previous = employee_totals(Payroll.objects.filter(payroll_period_start__gte=prev_month_start, payroll_period_start__lt=first_of_month))
        worker_current = worker_totals(WorkerPayroll.objects.filter(period_start__gte=first_of_month))
        worker_previous = worker_totals(WorkerPayroll.objects.filter(period_start__gte=prev_month_start, period_start__lt=first_of_month))

        current_month = {
            "gross_usd": employee_current["gross_usd"] + worker_current["gross_usd"],
            "gross_afn": employee_current["gross_afn"] + worker_current["gross_afn"],
            "net_usd": employee_current["net_usd"] + worker_current["net_usd"],
            "net_afn": employee_current["net_afn"] + worker_current["net_afn"],
            "total_deductions_usd": employee_current["deductions_usd"] + worker_current["deductions_usd"] + worker_current["advances_usd"],
            "total_deductions_afn": employee_current["deductions_afn"] + worker_current["deductions_afn"] + worker_current["advances_afn"],
            "total_tax_usd": employee_current["tax_usd"],
            "total_tax_afn": employee_current["tax_afn"],
            "total_bonus_usd": employee_current["bonus_usd"],
            "total_bonus_afn": employee_current["bonus_afn"],
            "total_overtime_usd": employee_current["overtime_usd"] + worker_current["overtime_usd"],
            "total_overtime_afn": employee_current["overtime_afn"] + worker_current["overtime_afn"],
            "employee_net_usd": employee_current["net_usd"],
            "employee_net_afn": employee_current["net_afn"],
            "daily_worker_net_usd": worker_current["net_usd"],
            "daily_worker_net_afn": worker_current["net_afn"],
            "count": employee_current["count"] + worker_current["count"],
        }
        previous_month = {
            "gross_usd": employee_previous["gross_usd"] + worker_previous["gross_usd"],
            "gross_afn": employee_previous["gross_afn"] + worker_previous["gross_afn"],
            "net_usd": employee_previous["net_usd"] + worker_previous["net_usd"],
            "net_afn": employee_previous["net_afn"] + worker_previous["net_afn"],
            "count": employee_previous["count"] + worker_previous["count"],
        }

        methods = defaultdict(lambda: {"payment_method": "", "count": 0, "total_usd": Decimal("0.00"), "total_afn": Decimal("0.00")})
        method_rows = list(
            Payroll.objects.values("payment_method").annotate(
                count=Count("id"),
                total_usd=Coalesce(Sum("net_pay", filter=Q(currency="USD")), Decimal("0.00")),
                total_afn=Coalesce(Sum("net_pay", filter=Q(currency="AFN")), Decimal("0.00")),
            )
        ) + list(
            WorkerPayroll.objects.values("payment_method").annotate(
                count=Count("id"),
                total_usd=Coalesce(Sum("net_amount", filter=Q(currency="USD")), Decimal("0.00")),
                total_afn=Coalesce(Sum("net_amount", filter=Q(currency="AFN")), Decimal("0.00")),
            )
        )
        for row in method_rows:
            method = row["payment_method"]
            methods[method]["payment_method"] = method
            methods[method]["count"] += row["count"]
            methods[method]["total_usd"] += row["total_usd"]
            methods[method]["total_afn"] += row["total_afn"]

        recent_payrolls = []
        for payroll in Payroll.objects.select_related("employee").order_by("-created_at")[:5]:
            recent_payrolls.append({
                "id": payroll.id,
                "employee__first_name": payroll.employee.first_name,
                "employee__last_name": payroll.employee.last_name,
                "employee__employee_id": payroll.employee.employee_id,
                "payroll_period_start": payroll.payroll_period_start,
                "payroll_period_end": payroll.payroll_period_end,
                "gross_pay": payroll.gross_pay,
                "net_pay": payroll.net_pay,
                "currency": payroll.currency,
                "payment_date": payroll.payment_date,
                "created_at": payroll.created_at,
            })
        for payroll in WorkerPayroll.objects.select_related("worker").order_by("-created_at")[:5]:
            recent_payrolls.append({
                "id": payroll.id,
                "employee__first_name": payroll.worker.full_name,
                "employee__last_name": "",
                "employee__employee_id": payroll.worker.worker_id,
                "payroll_period_start": payroll.period_start,
                "payroll_period_end": payroll.period_end,
                "gross_pay": payroll.gross_amount,
                "net_pay": payroll.net_amount,
                "currency": payroll.currency,
                "payment_date": payroll.payment_date,
                "created_at": payroll.created_at,
            })
        recent_payrolls = sorted(recent_payrolls, key=lambda item: item["created_at"], reverse=True)[:5]
        for payroll in recent_payrolls:
            payroll.pop("created_at", None)

        return {
            "current_month": current_month,
            "previous_month": previous_month,
            "payment_method_breakdown": sorted(methods.values(), key=lambda item: item["count"], reverse=True),
            "recent_payrolls": recent_payrolls,
        }

    @staticmethod
    def get_full_dashboard():
        """
        Returns the complete dashboard payload.
        This is what the main dashboard endpoint calls.
        """
        return {
            "project_overview": (
                DashboardService.get_project_overview()
            ),
            "financial_overview": (
                DashboardService.get_financial_overview()
            ),
            "expense_summary": (
                DashboardService.get_expense_summary()
            ),
            "expense_this_month": (
                DashboardService.get_expense_this_month()
            ),
            "workforce_summary": (
                DashboardService.get_workforce_summary()
            ),
            "attendance_summary": (
                DashboardService.get_attendance_summary()
            ),
            "payroll_summary": (
                DashboardService.get_payroll_summary()
            ),
            "contract_summary": (
                DashboardService.get_contract_summary()
            ),
            "subcontractor_summary": (
                DashboardService.get_subcontractor_summary()
            ),
            "budget_comparison": (
                DashboardService.get_project_budget_comparison()
            ),
            "alerts": DashboardService.get_alerts(),
            "recent_activity": (
                DashboardService.get_recent_activity()
            ),
        }
