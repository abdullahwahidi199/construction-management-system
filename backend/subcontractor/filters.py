import django_filters
from .models import Subcontractor, Contract, ContractPayment, ContractVariation


class SubcontractorFilter(django_filters.FilterSet):
    name            = django_filters.CharFilter(lookup_expr='icontains')
    specialization  = django_filters.CharFilter(field_name='specialization', lookup_expr='exact')
    is_active       = django_filters.BooleanFilter()

    class Meta:
        model  = Subcontractor
        fields = ['name', 'specialization', 'is_active']


class ContractFilter(django_filters.FilterSet):
    project          = django_filters.NumberFilter(field_name='project_id')
    subcontractor    = django_filters.NumberFilter(field_name='subcontractor_id')
    status           = django_filters.CharFilter(field_name='status', lookup_expr='exact')
    start_date_after = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    start_date_before= django_filters.DateFilter(field_name='start_date', lookup_expr='lte')
    end_date_after   = django_filters.DateFilter(field_name='end_date', lookup_expr='gte')
    end_date_before  = django_filters.DateFilter(field_name='end_date', lookup_expr='lte')
    min_value        = django_filters.NumberFilter(field_name='contract_value', lookup_expr='gte')
    max_value        = django_filters.NumberFilter(field_name='contract_value', lookup_expr='lte')

    class Meta:
        model  = Contract
        fields = [
            'project', 'subcontractor', 'status',
            'start_date_after', 'start_date_before',
            'end_date_after', 'end_date_before',
            'min_value', 'max_value',
        ]


class ContractPaymentFilter(django_filters.FilterSet):
    payment_type       = django_filters.CharFilter(field_name='payment_type', lookup_expr='exact')
    payment_date_after = django_filters.DateFilter(field_name='payment_date', lookup_expr='gte')
    payment_date_before= django_filters.DateFilter(field_name='payment_date', lookup_expr='lte')
    contract           = django_filters.NumberFilter(field_name='contract_id')

    class Meta:
        model  = ContractPayment
        fields = ['payment_type', 'payment_date_after', 'payment_date_before', 'contract']


class ContractVariationFilter(django_filters.FilterSet):
    approved   = django_filters.BooleanFilter(field_name='approved')
    date_after = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date_before= django_filters.DateFilter(field_name='date', lookup_expr='lte')
    contract   = django_filters.NumberFilter(field_name='contract_id')

    class Meta:
        model  = ContractVariation
        fields = ['approved', 'date_after', 'date_before', 'contract']