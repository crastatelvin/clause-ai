# ============================================
# Project: CLAUSE — AI Contract Risk Analyzer
# Author: Telvin Crasta
# GitHub: github.com/crastatelvin
# License: CC BY-NC 4.0
# Original design and architecture by Telvin Crasta
# ============================================

from __future__ import annotations

from datetime import datetime, timezone


def build_report(doc_info: dict, risk_analysis: dict, ai_analysis: dict) -> dict:
    return {
        "document": {
            "filename": doc_info["filename"],
            "file_type": doc_info["file_type"],
            "word_count": doc_info["word_count"],
            "char_count": doc_info["char_count"],
            "document_type": ai_analysis.get("document_type", "Contract"),
        },
        "risk_score": {
            "overall": risk_analysis["overall_score"],
            "level": risk_analysis["risk_level"],
            "critical": risk_analysis["critical_count"],
            "high": risk_analysis["high_count"],
            "medium": risk_analysis["medium_count"],
            "low": risk_analysis["low_count"],
            "total": risk_analysis["total_risks"],
        },
        "risks": risk_analysis["risks"],
        "missing_clauses": risk_analysis["missing_clauses"],
        "dimension_scores": risk_analysis["dimension_scores"],
        "ai_analysis": ai_analysis,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
