from django.conf import settings
from django.http import HttpResponse


def schema_view(request):
    schema_path = settings.BASE_DIR.parent / "docs" / "OPENAPI_SCHEMA.yaml"
    if not schema_path.exists():
        return HttpResponse(
            "OPENAPI_SCHEMA.yaml has not been generated yet.",
            status=404,
            content_type="text/plain",
        )
    return HttpResponse(
        schema_path.read_text(encoding="utf-8"),
        content_type="application/yaml",
    )


def swagger_ui(request):
    return HttpResponse(
        """
        <!doctype html>
        <html>
          <head>
            <title>CMS API Swagger</title>
            <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
          </head>
          <body>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
            <script>
              SwaggerUIBundle({ url: "/api/schema/", dom_id: "#swagger-ui" });
            </script>
          </body>
        </html>
        """,
        content_type="text/html",
    )


def redoc_ui(request):
    return HttpResponse(
        """
        <!doctype html>
        <html>
          <head><title>CMS API ReDoc</title></head>
          <body>
            <redoc spec-url="/api/schema/"></redoc>
            <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
          </body>
        </html>
        """,
        content_type="text/html",
    )
