from django.shortcuts import render

# Create your views here.
from decimal import Decimal

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Prefetch

from .models import (
    Subcontractor,
    Contract,
    ContractDocument,
    ContractPayment,
    ContractVariation,
    ContractStatusChoices,
    ContractInvoiceDocument,
    ContractInvoice
)
from .serializers import (
    SubcontractorListSerializer,
    SubcontractorDetailSerializer,
    ContractListSerializer,
    ContractDetailSerializer,
    ContractWriteSerializer,
    ContractDocumentSerializer,
    ContractDocumentCreateSerializer,
    ContractPaymentSerializer,
    ContractPaymentCreateSerializer,
    ContractVariationSerializer,
    ContractVariationCreateSerializer,
    FinancialSummarySerializer,
    SubcontractorFinancialSummarySerializer,
    ContractInvoiceSerializer,
    ContractInvoiceDetailsSerializer,
    ContractInvoiceDocumentSerializer,
    ContractInvoiceDocumentCreateSerializer,
)
from .filters import (
    SubcontractorFilter,
    ContractFilter,
    ContractPaymentFilter,
    ContractVariationFilter,
)
from .permissions import IsAdminOrReadOnly
from .pagination import StandardPagination
from .services import ContractService
from accounts.permissions import RBACPermission


# ──────────────────────────────────────────────
# Subcontractor ViewSet
# ──────────────────────────────────────────────

class SubcontractorViewSet(viewsets.ModelViewSet):
    """
    CRUD + soft-delete + nested contract list + financial summary.
    """
    queryset = Subcontractor.objects.all()
    permission_classes  = [RBACPermission]
    rbac_resource       = "subcontractors"
    pagination_class    = StandardPagination
    filter_backends     = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class     = SubcontractorFilter
    search_fields       = ['name', 'contact_person', 'specialization']
    ordering_fields     = ['name', 'specialization', 'created_at']
    ordering            = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return SubcontractorListSerializer
        return SubcontractorDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'list':
            # annotate contract count to avoid N+1
            qs = qs.annotate(_contract_count=Count('contracts'))
        elif self.action == 'retrieve':
            qs = qs.prefetch_related(
                Prefetch('contracts', queryset=Contract.objects.select_related('project')),
            )
        return qs

    def perform_destroy(self, instance):
        """Soft delete instead of real deletion."""
        instance.soft_delete()

    # ── custom actions ─────────────────────────

    @action(detail=True, methods=['get'])
    def contracts(self, request, pk=None):
        """List all contracts for this subcontractor."""
        subcontractor = self.get_object()
        qs = Contract.objects.filter(
            subcontractor=subcontractor,
        ).select_related('project', 'subcontractor')

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ContractListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ContractListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def financial_summary(self, request, pk=None):
        subcontractor = self.get_object()
        summary = ContractService.get_subcontractor_financial_summary(subcontractor)

        return Response(summary)


# ──────────────────────────────────────────────
# Contract ViewSet
# ──────────────────────────────────────────────

class ContractViewSet(viewsets.ModelViewSet):
    """
    CRUD + nested payments / variations / documents + financial summary.
    """
    queryset = Contract.objects.all()
    permission_classes  = [RBACPermission]
    rbac_resource       = "contracts"
    pagination_class    = StandardPagination
    filter_backends     = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class     = ContractFilter
    search_fields = [
    'contract_number',
    'title',
    'scope_of_work',
    'project__name',
    'subcontractor__name',
]
    ordering_fields     = [
        'contract_value', 'start_date', 'end_date',
        'completion_percentage', 'created_at',
    ]
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ContractListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ContractWriteSerializer
        return ContractDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'list':
            qs = qs.select_related('project', 'subcontractor')
        elif self.action == 'retrieve':
            qs = qs.select_related(
                'project', 'subcontractor',
            ).prefetch_related(
                'payments', 'documents', 'variations',
            )
        else:
            qs = qs.select_related('project', 'subcontractor')
        return qs

    # ── custom actions ─────────────────────────

    @action(detail=True, methods=['get'])
    def financial_summary(self, request, pk=None):
        contract = self.get_object()
        summary = ContractService.get_financial_summary(contract)
        serializer = FinancialSummarySerializer(summary)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'])
    def payments(self, request, pk=None):
        contract = self.get_object()

        if request.method == 'GET':
            qs = contract.payments.all()
            page = self.paginate_queryset(qs)
            if page is not None:
                serializer = ContractPaymentSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            return Response(ContractPaymentSerializer(qs, many=True).data)

        # POST — create payment via service (transaction-safe)
        serializer = ContractPaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payment = ContractService.create_payment(
                contract=contract,
                validated_data=serializer.validated_data,
            )
        except ValueError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        output = ContractPaymentSerializer(payment)
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'])
    def variations(self, request, pk=None):
        contract = self.get_object()

        if request.method == 'GET':
            qs = contract.variations.all()
            page = self.paginate_queryset(qs)
            if page is not None:
                serializer = ContractVariationSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            return Response(ContractVariationSerializer(qs, many=True).data)

        # POST
        serializer = ContractVariationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variation = ContractVariation.objects.create(
            contract=contract, **serializer.validated_data,
        )
        output = ContractVariationSerializer(variation)
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=['get', 'post'],
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def documents(self, request, pk=None):
        contract = self.get_object()

        if request.method == 'GET':
            qs = contract.documents.all()
            page = self.paginate_queryset(qs)
            if page is not None:
                serializer = ContractDocumentSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            return Response(ContractDocumentSerializer(qs, many=True).data)

        # POST
        serializer = ContractDocumentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = ContractDocument.objects.create(
            contract=contract, **serializer.validated_data,
        )
        output = ContractDocumentSerializer(document)
        return Response(output.data, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────
# Standalone Resource ViewSets
# ──────────────────────────────────────────────

class ContractDocumentViewSet(viewsets.ModelViewSet):
    queryset = ContractDocument.objects.select_related('contract')
    permission_classes  = [RBACPermission]
    rbac_resource       = "contract_documents"
    pagination_class    = StandardPagination
    filter_backends     = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields     = ['uploaded_at', 'title']
    ordering            = ['-uploaded_at']
    parser_classes      = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ContractDocumentCreateSerializer
        return ContractDocumentSerializer


class ContractPaymentViewSet(viewsets.ModelViewSet):
    queryset = ContractPayment.objects.select_related('contract')
    permission_classes  = [RBACPermission]
    rbac_resource       = "contract_payments"
    pagination_class    = StandardPagination
    filter_backends     = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class     = ContractPaymentFilter
    ordering_fields     = ['payment_date', 'amount', 'created_at']
    ordering            = ['-payment_date']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ContractPaymentCreateSerializer
        return ContractPaymentSerializer

    def destroy(self, request, *args, **kwargs):
        """Payments are permanent audit records — disallow deletion."""
        return Response(
            {'detail': 'Payments cannot be deleted. They are permanent records.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class ContractVariationViewSet(viewsets.ModelViewSet):
    queryset = ContractVariation.objects.select_related('contract')
    permission_classes  = [RBACPermission]
    rbac_resource       = "contract_variations"
    pagination_class    = StandardPagination
    filter_backends     = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class     = ContractVariationFilter
    ordering_fields     = ['date', 'amount_change', 'created_at']
    ordering            = ['-date']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ContractVariationCreateSerializer
        return ContractVariationSerializer

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a variation with financial-impact validation."""
        variation = self.get_object()
        try:
            ContractService.approve_variation(variation)
        except ValueError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ContractVariationSerializer(variation)
        return Response(serializer.data)
    

class ContractInvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = ContractInvoiceSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "contract_invoices"

    queryset = (
        ContractInvoice.objects
        .select_related(
            "contract",
            "contract__project",
            "contract__subcontractor",
        )
        .prefetch_related("documents")
    )

    filterset_fields = [
        "contract",
        "status",
    ]

    search_fields = [
        "invoice_number",
        "contract__contract_number",
        "contract__title",
        "contract__subcontractor__name",
    ]

    ordering_fields = [
        "invoice_date",
        "amount",
        "created_at",
    ]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ContractInvoiceDetailsSerializer

        return ContractInvoiceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        contract_id = self.request.query_params.get("contract")

        if contract_id:
            queryset = queryset.filter(
                contract_id=contract_id
            )

        return queryset
class ContractInvoiceDocumentViewSet(viewsets.ModelViewSet):
    queryset = (
        ContractInvoiceDocument.objects
        .select_related(
            "invoice",
            "invoice__contract",
        )
    )

    permission_classes = [RBACPermission]
    rbac_resource = "invoice_documents"

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ContractInvoiceDocumentCreateSerializer

        return ContractInvoiceDocumentSerializer
