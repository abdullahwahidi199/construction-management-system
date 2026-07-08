from pypdf import PdfReader, PdfWriter
from io import BytesIO
from django.core.files.base import ContentFile


def compress_pdf(uploaded_file):
    reader = PdfReader(uploaded_file)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    # Enable basic compression
    writer.compress_content_streams()

    buffer = BytesIO()
    writer.write(buffer)

    return ContentFile(buffer.getvalue(), name=uploaded_file.name)

import os
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile


def compress_image(uploaded_file, quality=70):
    """
    Compress image and return Django ContentFile.
    """

    img = Image.open(uploaded_file)

    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=quality, optimize=True)

    return ContentFile(buffer.getvalue(), name=uploaded_file.name)


def is_image(file):
    return file.content_type.startswith("image")