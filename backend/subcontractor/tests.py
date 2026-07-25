from decimal import Decimal
from unittest.mock import patch

from rest_framework.test import APITestCase

from common.test_helpers import (
    create_admin,
    create_contract,
    create_contract_payment,
    create_contract_variation,
    create_project,
    create_subcontractor,
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
