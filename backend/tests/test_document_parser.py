import io

import pytest

from document_parser import parse_document


def test_parse_txt_document():
    info = parse_document(b"hello world this is a contract " * 5, "sample.txt")
    assert info["file_type"] == "text"
    assert info["word_count"] > 10
    assert info["filename"] == "sample.txt"


def test_parse_docx_document():
    docx = pytest.importorskip("docx")  # python-docx
    document = docx.Document()
    document.add_paragraph("EMPLOYMENT AGREEMENT")
    document.add_paragraph(
        "Section 1: Compensation shall be paid net 90 days subject to approval."
    )
    document.add_paragraph("Section 2: All intellectual property belongs to the Company.")
    buffer = io.BytesIO()
    document.save(buffer)
    buffer.seek(0)

    info = parse_document(buffer.read(), "employment.docx")
    assert info["file_type"] == "docx"
    assert "intellectual property" in info["text"].lower()
    assert info["word_count"] > 10


def test_parse_unknown_extension_falls_back_to_text():
    info = parse_document(b"Agreement between two parties " * 5, "contract.rtf")
    assert info["file_type"] == "text"
    assert info["word_count"] > 5
