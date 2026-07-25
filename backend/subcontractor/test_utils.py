from datetime import date
from decimal import Decimal
from io import BytesIO
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from subcontractor.utils.file_compress import compress_image, compress_pdf, is_image
from subcontractor.validators import (
    validate_completion_percentage,
    validate_contract_value,
    validate_date_range,
    validate_file_extension,
    validate_file_size,
    validate_payment_amount,
)


class SubcontractorValidatorTests(SimpleTestCase):
    def test_positive_money_validators_accept_positive_values(self):
        validate_contract_value(Decimal("1.00"))
        validate_payment_amount(Decimal("0.01"))

        with self.assertRaises(ValidationError):
            validate_contract_value(Decimal("0"))
        with self.assertRaises(ValidationError):
            validate_payment_amount(Decimal("-1"))

    def test_completion_percentage_and_date_range_validation(self):
        validate_completion_percentage(Decimal("0"))
        validate_completion_percentage(Decimal("100"))
        validate_date_range(date(2026, 1, 1), date(2026, 1, 2))

        with self.assertRaises(ValidationError):
            validate_completion_percentage(Decimal("100.1"))
        with self.assertRaises(ValidationError):
            validate_completion_percentage(Decimal("-0.1"))
        with self.assertRaises(ValidationError):
            validate_date_range(date(2026, 2, 1), date(2026, 1, 1))

    def test_file_extension_and_size_validation(self):
        validate_file_extension(SimpleNamespace(name="contract.PDF"))
        validate_file_extension(SimpleNamespace(name="drawing.dwg"), allowed=[".dwg"])
        validate_file_size(SimpleNamespace(size=2 * 1024 * 1024), max_mb=2)

        with self.assertRaises(ValidationError):
            validate_file_extension(SimpleNamespace(name="script.exe"))
        with self.assertRaises(ValidationError):
            validate_file_size(SimpleNamespace(size=(3 * 1024 * 1024) + 1), max_mb=3)


class FileCompressionTests(SimpleTestCase):
    def test_image_detection_uses_content_type(self):
        self.assertTrue(is_image(SimpleNamespace(content_type="image/png")))
        self.assertFalse(is_image(SimpleNamespace(content_type="application/pdf")))

    def test_compress_image_converts_rgba_and_returns_content_file(self):
        uploaded = SimpleNamespace(name="photo.png")
        image = MagicMock()
        converted = MagicMock()
        image.mode = "RGBA"
        image.convert.return_value = converted

        with patch("subcontractor.utils.file_compress.Image.open", return_value=image):
            result = compress_image(uploaded, quality=65)

        image.convert.assert_called_once_with("RGB")
        converted.save.assert_called_once()
        self.assertEqual(result.name, "photo.png")

    def test_compress_pdf_copies_pages_and_returns_content_file(self):
        uploaded = BytesIO(b"%PDF-1.4")
        uploaded.name = "contract.pdf"
        reader = MagicMock()
        reader.pages = ["p1", "p2"]
        writer = MagicMock()

        def write(buffer):
            buffer.write(b"compressed")

        writer.write.side_effect = write

        with patch("subcontractor.utils.file_compress.PdfReader", return_value=reader), patch(
            "subcontractor.utils.file_compress.PdfWriter",
            return_value=writer,
        ):
            result = compress_pdf(uploaded)

        self.assertEqual(writer.add_page.call_count, 2)
        writer.compress_content_streams.assert_called_once()
        self.assertEqual(result.read(), b"compressed")
        self.assertEqual(result.name, "contract.pdf")
