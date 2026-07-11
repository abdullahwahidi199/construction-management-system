"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static

from Employees.views import EmployeeViewSet,PayrollViewSet,AttendanceViewSet
from subcontractor.views import (
    SubcontractorViewSet,
    ContractViewSet,
    ContractDocumentViewSet,
    ContractPaymentViewSet,
    ContractVariationViewSet,
    ContractInvoiceViewSet,
    ContractInvoiceDocumentViewSet
)
from labour.views import (
    DailyWorkerViewSet,
    WorkerAttendanceViewSet,
    WorkerAdvanceViewSet,
    WorkerPayrollViewSet
)
router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'payrolls', PayrollViewSet)
router.register(r'attendance', AttendanceViewSet)

router.register(r'daily-workers', DailyWorkerViewSet, basename='daily-worker')
router.register(r'worker-attendance', WorkerAttendanceViewSet, basename='worker-attendance')
router.register(r'worker-payroll', WorkerPayrollViewSet, basename='worker-payroll')
router.register(r'worker-advances', WorkerAdvanceViewSet, basename='worker-advance')

router.register(r'subcontractors',      SubcontractorViewSet)
router.register(r'contracts',           ContractViewSet)
router.register(r'contract-documents',   ContractDocumentViewSet,  basename='contract-document')
router.register(r'contract-payments',    ContractPaymentViewSet,   basename='contract-payment')
router.register(r'contract-variations',  ContractVariationViewSet, basename='contract-variation')
router.register(
    r"invoices",
    ContractInvoiceViewSet,
    basename="contract-invoice"
)

router.register(
    r"invoice-documents",
    ContractInvoiceDocumentViewSet,
    basename="contract-invoice-document"
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include("accounts.urls")),
    path('api/projects/', include("project.urls")),
    path('api/expenses/', include("expenses.urls")),
    path('api/employees/', include("Employees.urls")),
    path('api/contracts/', include("subcontractor.urls")),
    path('api/dashboard/', include("dashboard.urls")),
    path('api/reports/', include("reports.urls")),
    path('api/audit/', include("audit.urls")),
    path('api/', include(router.urls)),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
