from django.db.models import Count, Sum, Value, DecimalField, Q
from django.db.models.functions import Coalesce
from decimal import Decimal

from Employees.models import Attendance  # adjust import
from .base import BaseReport


class AttendanceReport(BaseReport):
    report_name = "Attendance Report"

    def _base_queryset(self):
        qs = Attendance.objects.select_related("employee")

        employee_id = self.filters.get("employee_id")
        status = self.filters.get("status")
        start, end = self.get_date_range()

        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if status:
            qs = qs.filter(status=status)
        if start:
            qs = qs.filter(date__gte=start)
        if end:
            qs = qs.filter(date__lte=end)

        return qs

    def generate(self):
        qs = self._base_queryset()

        rows = []
        for a in qs:
            rows.append({
                "id": a.id,
                "employee": a.employee.full_name,
                "employee_id": a.employee.employee_id,
                "date": a.date,
                "status": a.get_status_display(),
                "check_in": a.check_in,
                "check_out": a.check_out,
                "overtime_hours": a.overtime_hours,
                "note": a.note,
            })

        # Status breakdown
        status_breakdown = list(
            qs.values("status").annotate(count=Count("id")).order_by("status")
        )

        # Per-employee summary
        per_employee = list(
            qs.values(
                "employee__id", "employee__first_name", "employee__last_name"
            ).annotate(
                present=Count("id", filter=Q(status="present")),
                absent=Count("id", filter=Q(status="absent")),
                half_day=Count("id", filter=Q(status="half_day")),
                leave=Count("id", filter=Q(status="leave")),
                total_overtime=Coalesce(
                    Sum("overtime_hours"), Value(Decimal("0")),
                    output_field=DecimalField(max_digits=8, decimal_places=2),
                ),
            ).order_by("employee__first_name")
        )

        total_overtime = qs.aggregate(
            total=Coalesce(Sum("overtime_hours"), Value(Decimal("0")),
                           output_field=DecimalField(max_digits=10, decimal_places=2))
        )["total"]

        return {
            **self.get_metadata(),
            "summary": {
                "total_records": len(rows),
                "total_overtime_hours": total_overtime,
                "status_breakdown": status_breakdown,
            },
            "per_employee": per_employee,
            "rows": rows,
        }