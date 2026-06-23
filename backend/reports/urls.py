from django.urls import path
from .views import (
    ProjectReportView,
    ExpenseReportView,
    PayrollReportView,
    AttendanceReportView,
    EmployeeReportView,
    ContractReportView,
    FinancialReportView,
)

app_name = "reports"

urlpatterns = [
    path("projects/", ProjectReportView.as_view(), name="project-report"),
    path("expenses/", ExpenseReportView.as_view(), name="expense-report"),
    path("payroll/", PayrollReportView.as_view(), name="payroll-report"),
    path("attendance/", AttendanceReportView.as_view(), name="attendance-report"),
    path("employees/", EmployeeReportView.as_view(), name="employee-report"),
    path("contracts/", ContractReportView.as_view(), name="contract-report"),
    path("financial/", FinancialReportView.as_view(), name="financial-report"),
]