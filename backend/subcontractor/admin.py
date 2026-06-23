from django.contrib import admin
from .models import (
    Subcontractor,
    Contract,
    ContractDocument,
    ContractPayment,
    ContractVariation,
)


class ContractDocumentInline(admin.TabularInline):
    model = ContractDocument
    extra = 0
    readonly_fields = ['uploaded_at']


class ContractPaymentInline(admin.TabularInline):
    model = ContractPayment
    extra = 0
    readonly_fields = ['created_at']


class ContractVariationInline(admin.TabularInline):
    model = ContractVariation
    extra = 0
    readonly_fields = ['created_at']


@admin.register(Subcontractor)
class SubcontractorAdmin(admin.ModelAdmin):
    list_display  = ['name', 'contact_person', 'specialization', 'is_active', 'created_at']
    list_filter   = ['specialization', 'is_active']
    search_fields = ['name', 'contact_person', 'registration_number', 'tax_number']
    actions       = ['activate', 'deactivate']

    @admin.action(description='Activate selected')
    def activate(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description='Deactivate selected')
    def deactivate(self, request, queryset):
        queryset.update(is_active=False)


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display  = [
        'contract_number', 'title', 'subcontractor', 'project',
        'contract_value', 'status', 'completion_percentage',
    ]
    list_filter   = ['status', 'subcontractor__specialization']
    search_fields = ['contract_number', 'title']
    inlines       = [
        ContractPaymentInline,
        ContractVariationInline,
        ContractDocumentInline,
    ]
    readonly_fields = ['retention_amount', 'created_at', 'updated_at']