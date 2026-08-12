from django.db.models import Count, Sum, Avg, Value, DecimalField
from django.db.models.functions import Coalesce
from decimal import Decimal

from Employees.models import Employee  # adjust import
from .base import BaseReport


class EmployeeReport(BaseReport):
    report_name = "Employee Report"

    def generate(self):
        qs = Employee.objects.select_related("project")

        department = self.filters.get("department")
        employment_type = self.filters.get("employment_type")
        is_active = self.filters.get("is_active")

        if department:
            qs = qs.filter(department=department)
        if employment_type:
            qs = qs.filter(employment_type=employment_type)
        if is_active is not None:
            qs = qs.filter(is_active=is_active)

        rows = []
        for e in qs:
            rows.append({
                "id": e.id,
                "employee_id": e.employee_id,
                "full_name": e.full_name,
                "email": e.email,
                "phone": e.phone,
                "department": e.get_department_display(),
                "position": e.position,
                "employment_type": e.get_employment_type_display(),
                "project": e.project.name if e.project else "",
                "project_id": e.project_id,
                "job_type": e.get_job_type_display(),
                "hire_date": e.hire_date,
                "salary": e.salary,
                "is_active": e.is_active,
            })

        # Department breakdown
        dept_breakdown = list(
            qs.values("department").annotate(
                count=Count("id"),
                total_salary=Coalesce(Sum("salary"), Value(Decimal("0")),
                                      output_field=DecimalField(max_digits=18, decimal_places=2)),
                avg_salary=Coalesce(Avg("salary"), Value(Decimal("0")),
                                    output_field=DecimalField(max_digits=18, decimal_places=2)),
            ).order_by("department")
        )

        return {
            **self.get_metadata(),
            "summary": {
                "total_employees": len(rows),
                "active_count": qs.filter(is_active=True).count(),
                "inactive_count": qs.filter(is_active=False).count(),
                "department_breakdown": dept_breakdown,
            },
            "rows": rows,
        }
