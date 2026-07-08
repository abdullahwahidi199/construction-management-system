from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import ExpenseViewSet, ExpensePDFExportView

router = DefaultRouter()
router.register(r'', ExpenseViewSet, basename='expenses')

urlpatterns = [
    path(
        "export-pdf/",
        ExpensePDFExportView.as_view(),
        name="expense-export-pdf",
    ),
]

urlpatterns += router.urls