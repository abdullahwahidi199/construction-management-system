from collections import defaultdict
from decimal import Decimal

from Employees.models import Attendance
from common.work_calendar import get_work_calendar_service
from labour.models import WorkerAttendance
from .base import BaseReport


ZERO = Decimal("0.00")


def decimal_value(value):
    if value is None or value == "":
        return ZERO
    return Decimal(str(value))


def empty_status_summary(status, source_type=None):
    data = {
        "status": status,
        "count": 0,
        "total_overtime": ZERO,
    }
    if source_type:
        data["source_type"] = source_type
    return data


def empty_source_summary(source_type):
    return {
        "source_type": source_type,
        "count": 0,
        "present": 0,
        "absent": 0,
        "half_day": 0,
        "leave": 0,
        "overtime": 0,
        "total_overtime": ZERO,
    }


class AttendanceReport(BaseReport):
    report_name = "Attendance Report"

    def _calendar_summary(self):
        start, end = self.get_date_range()
        if not start or not end:
            return {
                "total_calendar_days": 0,
                "total_working_days": 0,
                "weekly_off_days": 0,
                "official_holidays": 0,
                "days": [],
            }
        return get_work_calendar_service().get_range_summary(start, end)

    def _employee_queryset(self):
        if self.filters.get("source_type") == "daily_worker":
            return Attendance.objects.none()

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

    def _worker_queryset(self):
        if self.filters.get("source_type") == "employee":
            return WorkerAttendance.objects.none()

        qs = WorkerAttendance.objects.select_related("worker", "project")

        employee_id = self.filters.get("employee_id")
        status = self.filters.get("status")
        start, end = self.get_date_range()

        if employee_id:
            qs = qs.filter(worker_id=employee_id)
        if status:
            qs = qs.filter(status=status)
        if start:
            qs = qs.filter(date__gte=start)
        if end:
            qs = qs.filter(date__lte=end)

        return qs

    def _employee_row(self, attendance):
        return {
            "id": f"employee-{attendance.id}",
            "source_type": "Employee",
            "employee": attendance.employee.full_name,
            "employee_id": attendance.employee.employee_id,
            "project": "",
            "date": attendance.date,
            "status": attendance.get_status_display(),
            "status_key": attendance.status,
            "check_in": attendance.check_in,
            "check_out": attendance.check_out,
            "overtime_hours": attendance.overtime_hours,
            "note": attendance.note,
        }

    def _worker_row(self, attendance):
        return {
            "id": f"daily-worker-{attendance.id}",
            "source_type": "Daily Worker",
            "employee": attendance.worker.full_name,
            "employee_id": attendance.worker.worker_id,
            "project": attendance.project.name if attendance.project else "",
            "date": attendance.date,
            "status": attendance.get_status_display(),
            "status_key": attendance.status,
            "check_in": None,
            "check_out": None,
            "overtime_hours": attendance.overtime_hours,
            "note": attendance.notes,
        }

    def _add_status_summary(self, by_status, by_source_status, row):
        status = row["status_key"]
        source_type = row["source_type"]
        overtime = decimal_value(row["overtime_hours"])

        if status not in by_status:
            by_status[status] = empty_status_summary(status)
        by_status[status]["count"] += 1
        by_status[status]["total_overtime"] += overtime

        source_key = (source_type, status)
        if source_key not in by_source_status:
            by_source_status[source_key] = empty_status_summary(status, source_type)
        by_source_status[source_key]["count"] += 1
        by_source_status[source_key]["total_overtime"] += overtime

    def _add_source_summary(self, by_source, row):
        source_type = row["source_type"]
        status = row["status_key"]

        if source_type not in by_source:
            by_source[source_type] = empty_source_summary(source_type)

        summary = by_source[source_type]
        summary["count"] += 1
        summary["total_overtime"] += decimal_value(row["overtime_hours"])

        if status in summary:
            summary[status] += 1

    def _person_summary(self, rows):
        people = {}
        for row in rows:
            key = (row["source_type"], row["employee_id"])
            if key not in people:
                people[key] = {
                    "source_type": row["source_type"],
                    "employee_id": row["employee_id"],
                    "name": row["employee"],
                    "project": row["project"],
                    "present": 0,
                    "absent": 0,
                    "half_day": 0,
                    "leave": 0,
                    "overtime": 0,
                    "total_overtime": ZERO,
                }

            person = people[key]
            status = row["status_key"]
            if status in person:
                person[status] += 1
            person["total_overtime"] += decimal_value(row["overtime_hours"])

            if row["project"] and not person["project"]:
                person["project"] = row["project"]

        return sorted(
            people.values(),
            key=lambda item: (
                item["source_type"],
                item["name"],
            ),
        )

    def generate(self):
        employee_rows = [self._employee_row(a) for a in self._employee_queryset()]
        worker_rows = [self._worker_row(a) for a in self._worker_queryset()]
        rows = sorted(
            [*employee_rows, *worker_rows],
            key=lambda row: (row["date"], row["source_type"], row["employee"]),
            reverse=True,
        )

        by_status = {}
        by_source_status = {}
        by_source = {}

        for row in rows:
            self._add_status_summary(by_status, by_source_status, row)
            self._add_source_summary(by_source, row)

        total_overtime = sum(
            (decimal_value(row["overtime_hours"]) for row in rows),
            ZERO,
        )

        per_employee = self._person_summary(rows)
        calendar_summary = self._calendar_summary()
        effective_attendance_days = sum(
            Decimal("1.00")
            if row["status_key"] in {"present", "overtime"}
            else Decimal("0.50")
            if row["status_key"] == "half_day"
            else ZERO
            for row in rows
        )
        expected_attendance_days = (
            Decimal(calendar_summary["total_working_days"] * len(per_employee))
            if calendar_summary["total_working_days"] and per_employee
            else ZERO
        )
        attendance_percentage = (
            (effective_attendance_days / expected_attendance_days * Decimal("100")).quantize(Decimal("0.01"))
            if expected_attendance_days
            else ZERO
        )

        return {
            **self.get_metadata(),
            "summary": {
                "total_records": len(rows),
                "total_calendar_days": calendar_summary["total_calendar_days"],
                "total_working_days": calendar_summary["total_working_days"],
                "weekly_off_days": calendar_summary["weekly_off_days"],
                "official_holidays": calendar_summary["official_holidays"],
                "attendance_percentage": attendance_percentage,
                "employee_attendance_records": len(employee_rows),
                "daily_worker_attendance_records": len(worker_rows),
                "total_overtime_hours": total_overtime,
                "status_breakdown": list(by_status.values()),
                "by_source": list(by_source.values()),
                "calendar_summary": calendar_summary,
            },
            "status_by_source": list(by_source_status.values()),
            "per_employee": per_employee,
            "rows": rows,
        }
