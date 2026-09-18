"""
Extracts raw text from an uploaded lab report.
PDF -> PyMuPDF text extraction.
Image -> Tesseract OCR.
Text -> used as-is.
"""
import io

import fitz  # PyMuPDF
from PIL import Image
import pytesseract

from fastapi import HTTPException


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        if not text.strip():
            raise ValueError("empty")
        return text
    except Exception:
        raise HTTPException(status_code=422, detail="Could not extract text from this PDF. Try a different file.")


def extract_text_from_image(file_bytes: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(file_bytes))
        text = pytesseract.image_to_string(image)
        if not text.strip():
            raise ValueError("empty")
        return text
    except Exception:
        raise HTTPException(status_code=422, detail="Could not read text from this image. Try a clearer scan.")


def extract_text(file_bytes: bytes, content_type: str, filename: str) -> tuple[str, str]:
    """Returns (raw_text, file_type)."""
    name = (filename or "").lower()
    if content_type == "application/pdf" or name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes), "pdf"
    if content_type in ("image/png", "image/jpeg", "image/jpg") or name.endswith((".png", ".jpg", ".jpeg")):
        return extract_text_from_image(file_bytes), "image"
    if content_type in ("text/plain",) or name.endswith(".txt"):
        try:
            return file_bytes.decode("utf-8"), "text"
        except UnicodeDecodeError:
            raise HTTPException(status_code=422, detail="Could not read this text file as UTF-8.")
    raise HTTPException(status_code=415, detail="Unsupported file type. Upload a PDF, image, or plain text file.")
