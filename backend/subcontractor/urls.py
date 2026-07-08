from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import ContractPDFExportView,ContractDetailPDFView



urlpatterns = [
    path(
        "export-pdf/",
        ContractPDFExportView.as_view(),
        name="expense-export-pdf",
    ),
    path(
        "<int:pk>/export-pdf/",
        ContractDetailPDFView.as_view(),
        name="contract-detail-pdf",
    ),
]
