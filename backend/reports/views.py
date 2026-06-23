from django.http import FileResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .pdf_utils import generate_pdf
from .reports.project_report import ProjectSummaryReport
from .reports.expense_report import ExpenseReport
from .reports.payroll_report import PayrollReport
from .reports.attendance_report import AttendanceReport
from .reports.employee_report import EmployeeReport
from .reports.contract_report import ContractReport
from .reports.financial_report import FinancialOverviewReport
from .serializers import (
    ProjectReportFilterSerializer,
    ExpenseReportFilterSerializer,
    PayrollReportFilterSerializer,
    AttendanceReportFilterSerializer,
    EmployeeReportFilterSerializer,
    ContractReportFilterSerializer,
    FinancialReportFilterSerializer,
)


class BaseReportView(APIView):
    """
    Generic report view.
    Subclasses set: report_class, serializer_class, pdf_columns, filename.
    """
    # permission_classes = [IsAuthenticated]
    report_class = None
    serializer_class = None
    pdf_columns = None          # list of (key, header) tuples
    filename = "report.pdf"

    def get(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        filters = serializer.validated_data

        export = filters.pop("export", "json")

        report = self.report_class(filters=filters)
        data = report.generate()

        if export == "pdf":
            pdf_buffer = generate_pdf(data, columns=self.pdf_columns)
            return FileResponse(
                pdf_buffer,
                as_attachment=True,
                filename=self.filename,
                content_type="application/pdf",
            )

        return Response(data, status=status.HTTP_200_OK)


class ProjectReportView(BaseReportView):
    report_class = ProjectSummaryReport
    serializer_class = ProjectReportFilterSerializer
    filename = "project_report.pdf"
    pdf_columns = [
        ("name", "Project"),
        ("property_type", "Type"),
        ("location", "Location"),
        ("status", "Status"),
        ("estimated_budget", "Budget"),
        ("total_expense_usd", "Spent (USD)"),
        ("budget_remaining", "Remaining"),
    ]


class ExpenseReportView(BaseReportView):
    report_class = ExpenseReport
    serializer_class = ExpenseReportFilterSerializer
    filename = "expense_report.pdf"
    pdf_columns = [
        ("serial_number", "S/N"),
        ("project", "Project"),
        ("expense_date", "Date"),
        ("description", "Description"),
        ("amount_afn", "AFN"),
        ("amount_usd", "USD"),
        ("total_usd", "Total USD"),
        ("expense_type", "Type"),
    ]


class PayrollReportView(BaseReportView):
    report_class = PayrollReport
    serializer_class = PayrollReportFilterSerializer
    filename = "payroll_report.pdf"
    pdf_columns = [
        ("employee", "Employee"),
        ("department", "Dept"),
        ("period_start", "From"),
        ("period_end", "To"),
        ("currency", "Cur"),
        ("gross_pay", "Gross"),
        ("deductions", "Deduct"),
        ("net_pay", "Net"),
    ]


class AttendanceReportView(BaseReportView):
    report_class = AttendanceReport
    serializer_class = AttendanceReportFilterSerializer
    filename = "attendance_report.pdf"
    pdf_columns = [
        ("employee", "Employee"),
        ("date", "Date"),
        ("status", "Status"),
        ("check_in", "In"),
        ("check_out", "Out"),
        ("overtime_hours", "OT Hrs"),
    ]


class EmployeeReportView(BaseReportView):
    report_class = EmployeeReport
    serializer_class = EmployeeReportFilterSerializer
    filename = "employee_report.pdf"
    pdf_columns = [
        ("employee_id", "ID"),
        ("full_name", "Name"),
        ("department", "Dept"),
        ("position", "Position"),
        ("employment_type", "Type"),
        ("hire_date", "Hired"),
        ("salary", "Salary"),
        ("is_active", "Active"),
    ]


class ContractReportView(BaseReportView):
    report_class = ContractReport
    serializer_class = ContractReportFilterSerializer
    filename = "contract_report.pdf"
    pdf_columns = [
        ("contract_number", "Contract #"),
        ("project", "Project"),
        ("subcontractor", "Subcontractor"),
        ("currency", "Cur"),
        ("contract_value", "Value"),
        ("total_paid", "Paid"),
        ("remaining_amount", "Remaining"),
        ("status", "Status"),
    ]


class FinancialReportView(BaseReportView):
    report_class = FinancialOverviewReport
    serializer_class = FinancialReportFilterSerializer
    filename = "financial_report.pdf"
    # No "rows" in this report — PDF will show summary only
    pdf_columns = None