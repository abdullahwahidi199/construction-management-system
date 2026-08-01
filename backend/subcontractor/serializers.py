from decimal import Decimal
from datetime import date

from rest_framework import serializers
from django.db.models import Sum
from common.serializers import CalendarModelSerializer

from .models import (
    Subcontractor,
    Contract,
    ContractDocument,
    ContractPayment,
    ContractVariation,
    SpecializationChoices,
    ContractStatusChoices,
    PaymentTypeChoices,
    DocumentTypeChoices,
    ContractInvoice,
    ContractInvoiceDocument
)
from .services import ContractService
from .validators import validate_file_extension, validate_file_size
from .utils.file_compress import compress_image, compress_pdf


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def _reset_file_pointer(file_obj):
    try:
        file_obj.seek(0)
    except (AttributeError, OSError):
        pass


def _file_extension(file_obj):
    name = getattr(file_obj, "name", "") or ""
    return f".{name.rsplit('.', 1)[-1].lower()}" if "." in name else ""


def compress_upload_before_size_check(value):
    """
    Apply the same compression used at save time before size validation runs.
    Large photos should be judged by their upload-ready size, not the raw camera file.
    """
    content_type = getattr(value, "content_type", "") or ""
    extension = _file_extension(value)

    try:
        if content_type.startswith("image/") or extension in IMAGE_EXTENSIONS:
            _reset_file_pointer(value)
            return compress_image(value, quality=70)

        if content_type == "application/pdf" or extension == ".pdf":
            _reset_file_pointer(value)
            return compress_pdf(value)
    except Exception:
        _reset_file_pointer(value)

    return value


# ──────────────────────────────────────────────
# Financial Summary Serializers
# ──────────────────────────────────────────────

class FinancialSummarySerializer(serializers.Serializer):
    """Typed schema for a single contract's financial summary."""
    original_contract_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    retention_percentage    = serializers.DecimalField(max_digits=5,  decimal_places=2)
    retention_amount        = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_variation_amount  = serializers.DecimalField(max_digits=15, decimal_places=2)
    adjusted_contract_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_paid              = serializers.DecimalField(max_digits=15, decimal_places=2)
    remaining_amount        = serializers.DecimalField(max_digits=15, decimal_places=2)
    retention_balance       = serializers.DecimalField(max_digits=15, decimal_places=2)
    adjusted_end_date       = serializers.DateField()
    completion_percentage   = serializers.DecimalField(max_digits=5,  decimal_places=2)
    total_invoiced = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True,
    )

    invoice_balance = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True,
    )


class SubcontractorFinancialSummarySerializer(serializers.Serializer):
    """Typed schema for a subcontractor's aggregated financial summary."""
    total_contracts         = serializers.IntegerField()
    active_contracts        = serializers.IntegerField()
    total_contract_value    = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_variation_amount  = serializers.DecimalField(max_digits=15, decimal_places=2)
    adjusted_contract_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_paid              = serializers.DecimalField(max_digits=15, decimal_places=2)
    remaining_amount        = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_retention         = serializers.DecimalField(max_digits=15, decimal_places=2)
    retention_balance       = serializers.DecimalField(max_digits=15, decimal_places=2)


# ──────────────────────────────────────────────
# Subcontractor Serializers
# ──────────────────────────────────────────────

class SubcontractorListSerializer(CalendarModelSerializer):
    calendar_module = "subcontractors"
    """Lightweight serializer for list views."""
    contract_count = serializers.SerializerMethodField()
    specialization_display = serializers.CharField(
        source='get_specialization_display', read_only=True,
    )

    class Meta:
        model  = Subcontractor
        fields = [
            'id', 'name', 'contact_person', 'phone', 'email',
            'specialization', 'specialization_display',
            'is_active', 'contract_count', 'created_at', 'updated_at',
        ]

    def get_contract_count(self, obj):
        # Use prefetched data if available, else query
        if hasattr(obj, '_contract_count'):
            return obj._contract_count
        return obj.contracts.count()


class SubcontractorDetailSerializer(CalendarModelSerializer):
    calendar_module = "subcontractors"
    """Full detail with nested contracts and financial summary."""
    contracts         = serializers.SerializerMethodField()
    financial_summary = serializers.SerializerMethodField()
    specialization_display = serializers.CharField(
        source='get_specialization_display', read_only=True,
    )

    class Meta:
        model  = Subcontractor
        fields = [
            'id', 'name', 'contact_person', 'phone', 'email',
            'address', 'tax_number', 'registration_number',
            'specialization', 'specialization_display',
            'notes', 'is_active',
            'contracts', 'financial_summary',
            'created_at', 'updated_at',
        ]

    def get_contracts(self, obj):
        qs = obj.contracts.select_related('project').all()
        return ContractListSerializer(qs, many=True).data

    def get_financial_summary(self, obj):
        return ContractService.get_subcontractor_financial_summary(obj)


# ──────────────────────────────────────────────
# Contract Serializers
# ──────────────────────────────────────────────

class ContractListSerializer(CalendarModelSerializer):
    calendar_module = "contracts"
    """Lightweight serializer for list / nested views."""
    subcontractor_name = serializers.CharField(source='subcontractor.name', read_only=True)
    project_name       = serializers.CharField(source='project.name', read_only=True)
    status_display     = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = Contract
        fields = [
            'id', 'contract_number', 'title',
            'project', 'project_name','retention_percentage','completion_percentage',
            'subcontractor', 'subcontractor_name','currency',
            'contract_value', 'status', 'status_display',
            'start_date', 'end_date', 'completion_percentage',
            'created_at','adjusted_contract_value'
        ]


class ContractDetailSerializer(CalendarModelSerializer):
    calendar_module = "contracts"
    """Full detail with nested related objects and financials."""
    subcontractor     = SubcontractorListSerializer(read_only=True)
    project_name      = serializers.CharField(source='project.name', read_only=True)
    payments          = serializers.SerializerMethodField()
    documents         = serializers.SerializerMethodField()
    variations        = serializers.SerializerMethodField()
    financial_summary = serializers.SerializerMethodField()
    status_display    = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model  = Contract
        fields = [
            'id', 'project', 'project_name', 'subcontractor',
            'contract_number', 'title', 'scope_of_work','currency',
            'contract_value', 'retention_percentage', 'retention_amount',
            'start_date', 'end_date', 'completion_percentage',
            'status', 'status_display', 'notes',
            'payments', 'documents', 'variations',
            'financial_summary','adjusted_contract_value',
            'created_at', 'updated_at',
        ]

    def get_payments(self, obj):
        return ContractPaymentSerializer(obj.payments.all(), many=True).data

    def get_documents(self, obj):
        return ContractDocumentSerializer(obj.documents.all(), many=True).data

    def get_variations(self, obj):
        return ContractVariationSerializer(obj.variations.all(), many=True).data

    def get_financial_summary(self, obj):
        return ContractService.get_financial_summary(obj)


class ContractWriteSerializer(CalendarModelSerializer):
    calendar_module = "contracts"
    """
    Serializer for creating/updating contracts.
    Separates write concerns from the read-heavy detail serializer.
    """

    class Meta:
        model  = Contract
        fields = [
            'project', 'subcontractor', 'contract_number', 'title',
            'scope_of_work', 'contract_value','currency',
            'retention_percentage', 'start_date', 'end_date',
            'completion_percentage', 'status', 'notes',
        ]

    def validate(self, data):
        start = data.get('start_date')
        end   = data.get('end_date')
        if self.instance:
            start = start or self.instance.start_date
            end   = end   or self.instance.end_date
        if start and end and start > end:
            raise serializers.ValidationError(
                {'end_date': 'End date must be on or after start date.'}
            )
        return data


# ──────────────────────────────────────────────
# Contract Document Serializers
# ──────────────────────────────────────────────

class ContractDocumentSerializer(CalendarModelSerializer):
    calendar_module = "documents"
    document_type_display = serializers.CharField(
        source='get_document_type_display', read_only=True,
    )

    class Meta:
        model  = ContractDocument
        fields = [
            'id', 'contract', 'title', 'document_type',
            'document_type_display', 'file', 'uploaded_at',
        ]
        read_only_fields = ['uploaded_at']

    def validate_file(self, value):
        validate_file_extension(value)
        compressed = compress_upload_before_size_check(value)
        validate_file_size(compressed)
        return compressed


class ContractDocumentCreateSerializer(CalendarModelSerializer):
    calendar_module = "documents"
    """
    Used when creating through the nested endpoint
    /contracts/{id}/documents/ — the contract comes from the URL.
    """
    document_type_display = serializers.CharField(
        source='get_document_type_display', read_only=True,
    )

    class Meta:
        model  = ContractDocument
        fields = [
            'id', 'title', 'document_type',
            'document_type_display', 'file', 'uploaded_at',
        ]
        read_only_fields = ['uploaded_at']

    def validate_file(self, value):
        validate_file_extension(value)
        compressed = compress_upload_before_size_check(value)
        validate_file_size(compressed)
        return compressed


# ──────────────────────────────────────────────
# Contract Payment Serializers
# ──────────────────────────────────────────────

class ContractPaymentSerializer(CalendarModelSerializer):
    calendar_module = "contract_payments"
    payment_type_display = serializers.CharField(
        source='get_payment_type_display', read_only=True,
    )
    contract_number = serializers.CharField(source='contract.contract_number', read_only=True)
    contract_title = serializers.CharField(source='contract.title', read_only=True)
    project_name = serializers.CharField(source='contract.project.name', read_only=True)
    subcontractor_name = serializers.CharField(source='contract.subcontractor.name', read_only=True)
    currency = serializers.CharField(source='contract.currency', read_only=True)

    class Meta:
        model  = ContractPayment
        fields = [
            'id', 'contract', 'amount', 'payment_date',
            'payment_type', 'payment_type_display',
            'reference_number', 'notes', 'created_at',
            'contract_number', 'contract_title', 'project_name',
            'subcontractor_name', 'currency',
        ]
        read_only_fields = ['created_at']

    def validate_amount(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError('Payment amount must be positive.')
        return value

    def validate(self, data):
        contract = data.get('contract') or getattr(self.instance, 'contract', None)
        amount   = data.get('amount')   or getattr(self.instance, 'amount', None)

        if contract and amount:
            existing = contract.payments.exclude(
                pk=getattr(self.instance, 'pk', None),
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            if existing + amount > contract.adjusted_contract_value:
                raise serializers.ValidationError({
                    'amount': (
                        f'Total payments ({existing + amount}) would exceed '
                        f'adjusted contract value ({contract.adjusted_contract_value}).'
                    ),
                })
        return data


class ContractPaymentCreateSerializer(CalendarModelSerializer):
    calendar_module = "contract_payments"
    """
    Used when creating through the nested endpoint
    /contracts/{id}/payments/ — the contract comes from the URL.
    """
    payment_type_display = serializers.CharField(
        source='get_payment_type_display', read_only=True,
    )
    contract_number = serializers.CharField(source='contract.contract_number', read_only=True)
    contract_title = serializers.CharField(source='contract.title', read_only=True)
    project_name = serializers.CharField(source='contract.project.name', read_only=True)
    subcontractor_name = serializers.CharField(source='contract.subcontractor.name', read_only=True)
    currency = serializers.CharField(source='contract.currency', read_only=True)

    class Meta:
        model  = ContractPayment
        fields = [
            'id', 'amount', 'payment_date',
            'payment_type', 'payment_type_display',
            'reference_number', 'notes', 'created_at',
            'contract_number', 'contract_title', 'project_name',
            'subcontractor_name', 'currency',
        ]
        read_only_fields = ['created_at']

    def validate_amount(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError('Payment amount must be positive.')
        return value


# ──────────────────────────────────────────────
# Contract Variation Serializers
# ──────────────────────────────────────────────

class ContractVariationSerializer(CalendarModelSerializer):
    calendar_module = "contract_variations"
    class Meta:
        model  = ContractVariation
        fields = [
            'id', 'contract', 'variation_number', 'description',
            'amount_change', 'days_added', 'date', 'approved', 'created_at',
        ]
        read_only_fields = ['created_at']


class ContractVariationCreateSerializer(CalendarModelSerializer):
    calendar_module = "contract_variations"
    """
    Used when creating through the nested endpoint
    /contracts/{id}/variations/ — the contract comes from the URL.
    """
    class Meta:
        model  = ContractVariation
        fields = [
            'id', 'description',
            'amount_change', 'days_added', 'date', 'approved', 'created_at',
        ]
        read_only_fields = ['created_at']

class ContractInvoiceDocumentSerializer(CalendarModelSerializer):
    calendar_module = "documents"
    class Meta:
        model = ContractInvoiceDocument
        fields = [
            "id",
            "file",
            "uploaded_at",
        ]
        read_only_fields = [
            "id",
            "uploaded_at",
        ]

    def validate_file(self, value):
        validate_file_extension(value)
        compressed = compress_upload_before_size_check(value)
        validate_file_size(compressed)
        return compressed

class ContractInvoiceSerializer(CalendarModelSerializer):
    calendar_module = "invoices"
    

    project_name = serializers.CharField(
        source="contract.project.name",
        read_only=True,
    )

    subcontractor_name = serializers.CharField(
        source="contract.subcontractor.name",
        read_only=True,
    )

    
    class Meta:
        model = ContractInvoice
        fields = [
            "id",
            "project_name",
            "contract",
            "subcontractor_name",
            "invoice_number",
            "invoice_date",
            "due_date",
            "description",
            "amount",
            "status",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "contract_number",
            "project_name",
            "subcontractor_name",
            "documents",
            "created_at",
        ]

class ContractInvoiceDetailsSerializer(CalendarModelSerializer):
    calendar_module = "invoices"
    contract_number = serializers.CharField(
        source="contract.contract_number",
        read_only=True,
    )

    project_name = serializers.CharField(
        source="contract.project.name",
        read_only=True,
    )

    subcontractor_name = serializers.CharField(
        source="contract.subcontractor.name",
        read_only=True,
    )

    documents = ContractInvoiceDocumentSerializer(
        many=True,
        read_only=True,
    )
    class Meta:
        model = ContractInvoice
        fields = [
            "id",
            "contract",
            "contract_number",
            "project_name",
            "subcontractor_name",
            "invoice_number",
            "invoice_date",
            "due_date",
            "description",
            "amount",
            "status",
            "notes",
            "documents",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "contract_number",
            "project_name",
            "subcontractor_name",
            "documents",
            "created_at",
        ]



class ContractInvoiceDocumentCreateSerializer(CalendarModelSerializer):
    calendar_module = "documents"
    class Meta:
        model = ContractInvoiceDocument
        fields = [
            "id",
            "invoice",
            "file",
            "uploaded_at",
        ]

        read_only_fields = [
            "id",
            "uploaded_at",
        ]

    def validate_file(self, value):
        validate_file_extension(value)
        compressed = compress_upload_before_size_check(value)
        validate_file_size(compressed)
        return compressed
