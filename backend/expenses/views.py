# views.py

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Expense
from django.db.models import F, ExpressionWrapper, DecimalField

from .serializers import ExpenseSerializer
from rest_framework.pagination import PageNumberPagination

# Define Custom Pagination
class ExpensePagination(PageNumberPagination):
    page_size = 25  # Items per page
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related("project").annotate(
        total_usd_calc=ExpressionWrapper(
            F("amount_usd") + (F("amount_afn") / F("exchange_rate")),
            output_field=DecimalField(max_digits=20, decimal_places=2),
        )
    )
    serializer_class = ExpenseSerializer
    
    # Enable filtering, search and sorting
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    # --- Filter Options (Matches frontend search/category) ---
    filterset_fields = {
    "project": ["exact"],
    "expense_type": ["exact"],
    "expense_date": ["gte", "lte", "exact"],
    "serial_number": ["exact"],
}

    # --- Global Search ---
    # Searches across description, remarks, paid_to
    search_fields = [
        "serial_number",
        "description",
        "remarks",
        "paid_to",
    ]

    # Sort options
    ordering_fields = [
    "expense_date",
    "serial_number",
    "total_usd_calc",
]
    default_ordering = ["expense_date", "desc"] # Changed to desc so newest appear first

    pagination_class = ExpensePagination