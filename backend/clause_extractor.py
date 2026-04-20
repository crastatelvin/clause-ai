# ============================================
# Project: CLAUSE — AI Contract Risk Analyzer
# Author: Telvin Crasta
# GitHub: github.com/crastatelvin
# License: CC BY-NC 4.0
# Original design and architecture by Telvin Crasta
# ============================================

from __future__ import annotations

import re

# (clause_type, compiled pattern). Ordered by specificity — first match wins.
_CLAUSE_TYPES: list[tuple[str, re.Pattern[str]]] = [
    ("payment", re.compile(r"\b(payment|compensation|salary|fees?)\b", re.I)),
    ("termination", re.compile(r"\b(termination|cancellation|end of agreement)\b", re.I)),
    ("confidentiality", re.compile(r"\b(confidential|non-disclosure|nda)\b", re.I)),
    ("ip", re.compile(r"\b(intellectual property|ip|work product|ownership)\b", re.I)),
    ("non_compete", re.compile(r"\b(non-compete|non-solicitation|restriction)\b", re.I)),
    ("liability", re.compile(r"\b(liability|indemnif|limitation of liability)\b", re.I)),
    ("dispute", re.compile(r"\b(dispute|arbitration|jurisdiction|governing law)\b", re.I)),
    ("warranty", re.compile(r"\b(warranty|representation|guarantee)\b", re.I)),
    ("force_majeure", re.compile(r"\b(force majeure|act of god)\b", re.I)),
    ("amendment", re.compile(r"\b(amendment|modification|change)\b", re.I)),
    ("assignment", re.compile(r"\b(assignment|transfer)\b", re.I)),
    ("notice", re.compile(r"\b(notice|notification)\b", re.I)),
]

_SPLIT_PATTERN = re.compile(
    r"""
    \n\d+\.\s+            # 1. , 2. , ...
    | \n[A-Z]\.\s+        # A. , B. , ...
    | \n[A-Z]{2,}[:\s]    # ALL CAPS HEADING
    | \n\n(?=[A-Z])       # double newline before capital
    """,
    re.VERBOSE,
)


def _classify(text: str) -> str:
    head = text[:300]
    for clause_type, pattern in _CLAUSE_TYPES:
        if pattern.search(head):
            return clause_type
    return "general"


def split_into_clauses(text: str, max_clauses: int = 50) -> list[dict]:
    """Return up to ``max_clauses`` clause dicts with char offsets preserved."""
    if not text:
        return []

    # Record the character offset of each split point so callers can map risks
    # back to the clauses they live inside.
    offsets = [0]
    for match in _SPLIT_PATTERN.finditer(text):
        offsets.append(match.end())
    offsets.append(len(text))

    clauses: list[dict] = []
    for i in range(len(offsets) - 1):
        start = offsets[i]
        end = offsets[i + 1]
        raw = text[start:end]
        stripped = raw.strip()
        if len(stripped) < 30:
            continue

        clauses.append(
            {
                "index": len(clauses),
                "text": stripped[:1000],
                "type": _classify(stripped),
                "word_count": len(stripped.split()),
                "start": start,
                "end": end,
            }
        )
        if len(clauses) >= max_clauses:
            break

    return clauses


_SECTION_HEADING = re.compile(r"^\d+\.\s*(.+)$")


def get_document_sections(text: str, max_sections: int = 20) -> list[dict]:
    """Return a list of ``{title, start}`` section markers.

    The previous implementation returned plain strings; the richer shape lets
    the risk analyser attach each detected risk to its nearest section header.
    """
    if not text:
        return []

    sections: list[dict] = []
    cursor = 0
    for line in text.split("\n"):
        stripped = line.strip()
        line_len = len(line) + 1  # +1 for the newline consumed by split
        is_heading = (
            5 < len(stripped) < 100
            and (stripped.isupper() or _SECTION_HEADING.match(stripped))
        )
        if is_heading:
            sections.append({"title": stripped, "start": cursor})
            if len(sections) >= max_sections:
                break
        cursor += line_len

    return sections
