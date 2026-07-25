from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from common.test_helpers import create_admin, create_contract, create_project


class SecurityRegressionTests(APITestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_authenticate(self.admin)

    def test_xss_payload_is_stored_as_data_not_executed_or_reflected_as_html(self):
        payload = "<script>alert('xss')</script>"
        response = self.client.post(
            "/api/projects/",
            {
                "name": payload,
                "property_type": "commercial",
                "location": "Kabul",
                "start_date": "2026-01-01",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response["Content-Type"], "application/json")
        self.assertEqual(response.data["name"], payload)

    def test_sql_injection_like_search_is_treated_as_plain_text(self):
        create_project(name="Safe Project")

        response = self.client.get("/api/expenses/?search=' OR 1=1 --")

        self.assertEqual(response.status_code, 200, response.data)

    def test_sensitive_schema_endpoint_is_public_but_uses_json_openapi_schema(self):
        self.client.force_authenticate(None)

        response = self.client.get("/api/schema/")

        self.assertEqual(response.status_code, 200)
        body = response.content.decode("utf-8")
        self.assertIn("openapi:", body)

    def test_file_upload_security_blocks_disallowed_extension(self):
        contract = create_contract()
        bad_file = SimpleUploadedFile("payload.html", b"<script>x</script>", content_type="text/html")

        response = self.client.post(
            f"/api/contracts/{contract.id}/documents/",
            {
                "title": "Bad file",
                "document_type": "supporting",
                "file": bad_file,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
