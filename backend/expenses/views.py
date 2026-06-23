# views.py

from rest_framework import viewsets, filters
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from .models import Expense
from django.db.models import F, ExpressionWrapper, DecimalField

from accounts.permissions import RBACPermission
from accounts.constants import Role
from accounts.services import get_user_role, has_permission
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
    permission_classes = [RBACPermission]
    rbac_resource = "expenses"
    
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

    def get_queryset(self):
        queryset = super().get_queryset()
        if get_user_role(self.request.user) == Role.DATA_ENTRY:
            assigned_project_ids = self.request.user.project_assignments.values_list(
                "project_id",
                flat=True,
            )
            queryset = queryset.filter(project_id__in=assigned_project_ids)
        return queryset

    def perform_create(self, serializer):
        project = serializer.validated_data.get("project")
        if get_user_role(self.request.user) == Role.DATA_ENTRY:
            assigned = self.request.user.project_assignments.filter(project=project).exists()
            if not assigned:
                raise PermissionDenied("You are not assigned to this project.")
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        if not has_permission(self.request.user, "expenses.update"):
            instance = self.get_object()
            if instance.created_by_id != self.request.user.id:
                raise PermissionDenied("You can only update your own expense entries.")
        serializer.save()
