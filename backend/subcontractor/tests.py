from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.core.files.base import ContentFile
from rest_framework.test import APITestCase

from common.test_helpers import (
    create_admin,
    create_contract,
    create_contract_payment,
    create_contract_variation,
    create_expense,
    create_project,
    create_subcontractor,
    create_user,
    contract_payload,
    uploaded_file,
)
from subcontractor.models import Contract, ContractDocument, ContractPayment, Subcontractor


class SubcontractorAndContractAPITests(APITestCase):
    def setUp(self):
        self.admin = create_admin()
        self.project = create_project()
        self.client.force_authenticate(self.admin)

    def test_subcontractor_crud_search_filter_and_soft_delete(self):
        subcontractor = create_subcontractor(name="Alpha Concrete", specialization="concrete")
        create_subcontractor(name="Beta Electric", specialization="electrical")

        listed = self.client.get("/api/subcontractors/?search=Alpha&specialization=concrete")
        self.assertEqual(listed.status_code, 200, listed.data)
        self.assertEqual(listed.data["count"], 1)

        patched = self.client.patch(
            f"/api/subcontractors/{subcontractor.id}/",
            {"phone": "0711111111"},
            format="json",
        )
        self.assertEqual(patched.status_code, 200, patched.data)

        deleted = self.client.delete(f"/api/subcontractors/{subcontractor.id}/")
        self.assertEqual(deleted.status_code, 204)
        subcontractor.refresh_from_db()
        self.assertFalse(subcontractor.is_active)

    def test_contract_crud_validation_status_and_financial_summary(self):
        subcontractor = create_subcontractor()
        invalid = self.client.post(
            "/api/contracts/",
            contract_payload(self.project, subcontractor, start_date="2026-07-01", end_date="2026-06-01"),
            format="json",
        )
        self.assertEqual(invalid.status_code, 400)

        created = self.client.post(
            "/api/contracts/",
            contract_payload(self.project, subcontractor, completion_percentage="100.00"),
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)
        contract = Contract.objects.get(title="Foundation Works")
        self.assertEqual(contract.status, "completed")
        self.assertEqual(contract.retention_amount, Decimal("100.00"))

        summary = self.client.get(f"/api/contracts/{contract.id}/financial_summary/")
        self.assertEqual(summary.status_code, 200, summary.data)
        self.assertEqual(Decimal(summary.data["retention_amount"]), Decimal("100.00"))

    def test_contract_payments_do_not_exceed_adjusted_value_and_cannot_be_deleted(self):
        contract = create_contract(project=self.project, contract_value=Decimal("100.00"))
        create_contract_payment(contract=contract, amount=Decimal("75.00"))

        too_much = self.client.post(
            "/api/contract-payments/",
            {
                "contract": contract.id,
                "amount": "30.00",
                "payment_date": "2026-03-02",
                "payment_type": "progress",
            },
            format="json",
        )
        self.assertEqual(too_much.status_code, 400)

        payment = ContractPayment.objects.get(contract=contract)
        delete = self.client.delete(f"/api/contract-payments/{payment.id}/")
        self.assertEqual(delete.status_code, 405)

    def test_nested_contract_payment_and_variation_update_balance(self):
        contract = create_contract(project=self.project, contract_value=Decimal("100.00"))

        variation = self.client.post(
            f"/api/contracts/{contract.id}/variations/",
            {
                "description": "Approved change",
                "amount_change": "50.00",
                "days_added": 3,
                "date": "2026-03-01",
                "approved": True,
            },
            format="json",
        )
        payment = self.client.post(
            f"/api/contracts/{contract.id}/payments/",
            {
                "amount": "120.00",
                "payment_date": "2026-03-05",
                "payment_type": "progress",
            },
            format="json",
        )

        self.assertEqual(variation.status_code, 201, variation.data)
        self.assertEqual(payment.status_code, 201, payment.data)
        contract.refresh_from_db()
        self.assertEqual(contract.adjusted_contract_value, Decimal("150.00"))
        self.assertEqual(contract.remaining_amount, Decimal("30.00"))

    def test_contract_financial_timeline_treats_payments_and_expenses_as_outflows(self):
        contract = create_contract(project=self.project, contract_value=Decimal("1000.00"))
        payment = create_contract_payment(
            contract=contract,
            amount=Decimal("500.00"),
            payment_date=date(2026, 1, 1),
            reference_number="ADV-001",
        )
        expense = create_expense(
            self.project,
            contract=contract,
            description="Purchased cement",
            amount_usd=Decimal("120.00"),
            expense_date=date(2026, 1, 5),
        )
        create_expense(
            self.project,
            contract=contract,
            description="Pending steel",
            amount_usd=Decimal("80.00"),
            approval_status="pending",
            expense_date=date(2026, 1, 6),
        )

        response = self.client.get(f"/api/contracts/{contract.id}/financial-timeline/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["count"], 2)
        rows = response.data["results"]["results"]
        self.assertEqual([row["transaction_type"] for row in rows], ["payment", "expense"])
        self.assertEqual(rows[0]["payment_id"], payment.id)
        self.assertEqual(rows[1]["expense_id"], expense.id)
        self.assertEqual(rows[0]["direction"], "out")
        self.assertEqual(rows[1]["direction"], "out")
        self.assertEqual(Decimal(rows[0]["signed_amount"]), Decimal("-500.00"))
        self.assertEqual(Decimal(rows[1]["signed_amount"]), Decimal("-120.00"))
        self.assertEqual(
            Decimal(response.data["results"]["summary"]["payments_made_usd"]),
            Decimal("500.00"),
        )
        self.assertEqual(
            Decimal(response.data["results"]["summary"]["total_contract_expenses_usd"]),
            Decimal("120.00"),
        )
        self.assertEqual(
            Decimal(response.data["results"]["summary"]["total_cash_outflow_usd"]),
            Decimal("620.00"),
        )
        self.assertEqual(
            Decimal(response.data["results"]["summary"]["net_position_usd"]),
            Decimal("-620.00"),
        )
        self.assertEqual(ContractPayment.objects.count(), 1)

    def test_contract_financial_timeline_filters_by_type_date_and_search(self):
        contract = create_contract(project=self.project)
        create_contract_payment(
            contract=contract,
            amount=Decimal("250.00"),
            payment_date=date(2026, 1, 1),
            reference_number="ADV-001",
        )
        create_expense(
            self.project,
            contract=contract,
            description="Steel purchase",
            amount_usd=Decimal("75.00"),
            expense_date=date(2026, 1, 10),
        )

        response = self.client.get(
            f"/api/contracts/{contract.id}/financial-timeline/"
            "?type=expense&date_from=2026-01-05&search=Steel"
        )

        self.assertEqual(response.status_code, 200, response.data)
        rows = response.data["results"]["results"]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["transaction_type"], "expense")
        self.assertEqual(rows[0]["description"], "Steel purchase")

    def test_nested_payment_create_uses_contract_payment_permission(self):
        contract = create_contract(project=self.project, contract_value=Decimal("100.00"))
        user = create_user(
            username="payment-clerk",
            role="data_entry",
            permissions=["contract_payments.create"],
        )
        self.client.force_authenticate(user)

        response = self.client.post(
            f"/api/contracts/{contract.id}/payments/",
            {
                "amount": "25.00",
                "payment_date": "2026-03-05",
                "payment_type": "progress",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(ContractPayment.objects.filter(contract=contract, amount=Decimal("25.00")).exists())

    def test_contract_document_upload_download_and_invalid_type(self):
        contract = create_contract(project=self.project)

        with patch("subcontractor.models.compress_pdf", side_effect=lambda file_obj: file_obj):
            uploaded = self.client.post(
                f"/api/contracts/{contract.id}/documents/",
                {
                    "title": "Signed Contract",
                    "document_type": "signed_contract",
                    "file": uploaded_file(),
                },
                format="multipart",
            )
        self.assertEqual(uploaded.status_code, 201, uploaded.data)
        self.assertTrue(ContractDocument.objects.filter(contract=contract).exists())

        invalid = self.client.post(
            f"/api/contracts/{contract.id}/documents/",
            {
                "title": "Executable",
                "document_type": "supporting",
                "file": uploaded_file("bad.exe", b"binary", "application/octet-stream"),
            },
            format="multipart",
        )
        self.assertEqual(invalid.status_code, 400)

    def test_contract_document_upload_compresses_image_before_size_validation(self):
        contract = create_contract(project=self.project)
        large_image = uploaded_file(
            "site-photo.jpg",
            b"x" * ((1024 * 1024) + 1),
            "image/jpeg",
        )

        with patch("subcontractor.validators.MAX_FILE_SIZE_MB", 1), patch(
            "subcontractor.serializers.compress_image",
            return_value=ContentFile(b"compressed image", name="site-photo.jpg"),
        ) as compress_image:
            response = self.client.post(
                f"/api/contracts/{contract.id}/documents/",
                {
                    "title": "Site Photo",
                    "document_type": "supporting",
                    "file": large_image,
                },
                format="multipart",
            )

        self.assertEqual(response.status_code, 201, response.data)
        compress_image.assert_called_once()
        document = ContractDocument.objects.get(contract=contract, title="Site Photo")
        self.assertLessEqual(document.file.size, 1024 * 1024)

    def test_contract_invoice_crud_filter_search_and_documents(self):
        contract = create_contract(project=self.project)

        invoice = self.client.post(
            "/api/invoices/",
            {
                "contract": contract.id,
                "invoice_date": "2026-03-10",
                "due_date": "2026-03-20",
                "description": "Progress invoice",
                "amount": "100.00",
                "status": "pending",
            },
            format="json",
        )
        self.assertEqual(invoice.status_code, 201, invoice.data)

        listed = self.client.get(f"/api/invoices/?contract={contract.id}&search={contract.contract_number}")
        self.assertEqual(listed.status_code, 200, listed.data)
        self.assertEqual(len(listed.data), 1)

        with patch("subcontractor.models.compress_pdf", side_effect=lambda file_obj: file_obj):
            document = self.client.post(
                "/api/invoice-documents/",
                {"invoice": invoice.data["id"], "file": uploaded_file("invoice.pdf")},
                format="multipart",
            )
        self.assertEqual(document.status_code, 201, document.data)

    def test_subcontractor_financial_summary_counts_contracts(self):
        subcontractor = create_subcontractor()
        contract = create_contract(project=self.project, subcontractor=subcontractor)
        create_contract_variation(contract=contract, amount_change=Decimal("50.00"))
        create_contract_payment(contract=contract, amount=Decimal("100.00"))

        response = self.client.get(f"/api/subcontractors/{subcontractor.id}/financial_summary/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["USD"]["total_contracts"], 1)
