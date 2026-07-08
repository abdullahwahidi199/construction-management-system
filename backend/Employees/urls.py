from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import PayrollPDFExportView,AttendancePDFExportView


urlpatterns=[
    path('payrolls/export-pdf/',PayrollPDFExportView.as_view()),
    path('attendance/export-pdf/',AttendancePDFExportView.as_view())
]