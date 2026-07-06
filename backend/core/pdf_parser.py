"""
PDF text extraction using PyMuPDF (fitz).
Handles lab reports, discharge summaries, and prescription PDFs.
"""

import fitz  # PyMuPDF
import io


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract plain text from a PDF file.

    Args:
        file_bytes: Raw PDF bytes (from uploaded file).

    Returns:
        Extracted text as a single string.
    """
    doc = fitz.open(stream=io.BytesIO(file_bytes), filetype="pdf")
    pages = []
    for page in doc:
        pages.append(page.get_text("text"))
    doc.close()
    return "\n\n".join(pages).strip()


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Decode plain text files."""
    return file_bytes.decode("utf-8", errors="replace").strip()
