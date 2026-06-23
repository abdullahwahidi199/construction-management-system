import os
from decimal import Decimal
from django.core.exceptions import ValidationError


def validate_contract_value(value):
    if value <= Decimal('0'):
        raise ValidationError('Contract value must be positive.', code='invalid')


def validate_payment_amount(value):
    if value <= Decimal('0'):
        raise ValidationError('Payment amount must be positive.', code='invalid')


def validate_completion_percentage(value):
    if value < Decimal('0') or value > Decimal('100'):
        raise ValidationError(
            'Completion percentage must be between 0 and 100.',
            code='invalid',
        )


def validate_date_range(start_date, end_date):
    if start_date and end_date and start_date > end_date:
        raise ValidationError(
            {'end_date': 'End date must be on or after start date.'},
            code='invalid',
        )


ALLOWED_FILE_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.jpg', '.jpeg', '.png', '.dwg', '.zip',
]
MAX_FILE_SIZE_MB = 50


def validate_file_extension(value, allowed=None):
    allowed = allowed or ALLOWED_FILE_EXTENSIONS
    ext = os.path.splitext(value.name)[1].lower()
    if ext not in allowed:
        raise ValidationError(
            f'File type "{ext}" is not allowed. '
            f'Allowed types: {", ".join(allowed)}',
            code='invalid_file_type',
        )


def validate_file_size(value, max_mb=None):
    max_mb = max_mb or MAX_FILE_SIZE_MB
    if value.size > max_mb * 1024 * 1024:
        raise ValidationError(
            f'File size must be under {max_mb} MB.',
            code='file_too_large',
        )