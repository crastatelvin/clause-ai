# ============================================
# Project: CLAUSE — AI Contract Risk Analyzer
# Author: Telvin Crasta
# GitHub: github.com/crastatelvin
# License: CC BY-NC 4.0
# Original design and architecture by Telvin Crasta
# ============================================

from __future__ import annotations

import re
from typing import Any

RISK_PATTERNS: list[dict[str, Any]] = [
    {
        "id": "unlimited_liability",
        "name": "Unlimited Liability",
        "dimension": "liability",
        "severity": "critical",
        "patterns": [
            r"(?i)(unlimited liability|liable for all|responsible for any and all)",
            r"(?i)(indemnif.*without limit|indemnif.*all loss)",
        ],
        "explanation": "This clause exposes you to unlimited financial liability with no cap.",
        "recommendation": "Negotiate a liability cap equal to fees paid or 3 months of contract value.",
    },
    {
        "id": "unilateral_termination",
        "name": "One-Sided Termination",
        "dimension": "termination",
        "severity": "high",
        "patterns": [
            r"(?i)(terminate.*at (any time|will|sole discretion))",
            r"(?i)(either party may terminate.*immediately)",
        ],
        "explanation": "Only one party can terminate freely — this creates significant power imbalance.",
        "recommendation": "Add mutual termination rights with equal notice periods for both parties.",
    },
    {
        "id": "ip_assignment",
        "name": "Broad IP Assignment",
        "dimension": "ip",
        "severity": "critical",
        "patterns": [
            r"(?i)(all.*intellectual property.*belongs to|assign.*all.*rights)",
            r"(?i)(work made for hire|work product.*property of company)",
        ],
        "explanation": "All work you create — including pre-existing work — may be assigned to the other party.",
        "recommendation": "Carve out pre-existing IP. Limit assignment to work created specifically for this contract.",
    },
    {
        "id": "non_compete_broad",
        "name": "Overly Broad Non-Compete",
        "dimension": "non_compete",
        "severity": "high",
        "patterns": [
            r"(?i)(non-compete.*\d+ year)",
            r"(?i)(not.*compete.*worldwide|not.*compete.*global)",
            r"(?i)(compete.*any.*business.*similar)",
        ],
        "explanation": "This non-compete clause is unusually broad in scope, duration, or geography.",
        "recommendation": "Limit to 6-12 months, specific geography, and direct competitors only.",
    },
    {
        "id": "forced_arbitration",
        "name": "Mandatory Arbitration",
        "dimension": "dispute",
        "severity": "medium",
        "patterns": [
            r"(?i)(binding arbitration|mandatory arbitration|waive.*right.*court)",
            r"(?i)(disputes.*resolved.*arbitration.*only)",
        ],
        "explanation": "You waive your right to sue in court. Arbitration favors repeat players like companies.",
        "recommendation": "Negotiate for optional arbitration or add small claims court exception.",
    },
    {
        "id": "auto_renewal",
        "name": "Automatic Renewal",
        "dimension": "termination",
        "severity": "medium",
        "patterns": [
            r"(?i)(automatically renew|auto-renew|renewal.*unless.*notice)",
            r"(?i)(continue.*unless.*\d+ days notice)",
        ],
        "explanation": "Contract renews automatically without explicit action from you.",
        "recommendation": "Set calendar reminders for renewal dates. Negotiate shorter notice windows.",
    },
    {
        "id": "unilateral_amendment",
        "name": "Unilateral Amendment Right",
        "dimension": "liability",
        "severity": "high",
        "patterns": [
            r"(?i)(may.*modify.*terms.*at any time|change.*terms.*without notice)",
            r"(?i)(amend.*agreement.*sole discretion)",
        ],
        "explanation": "The other party can change contract terms without your consent.",
        "recommendation": "Require mutual written consent for any amendments.",
    },
    {
        "id": "payment_delay",
        "name": "Unfavorable Payment Terms",
        "dimension": "payment",
        "severity": "medium",
        "patterns": [
            r"(?i)(payment.*net 90|payment.*net 120|payment.*\d{2,} days)",
            r"(?i)(payment.*at company.*discretion|payment.*subject to.*approval)",
        ],
        "explanation": "Payment terms are unusually long or subject to discretionary approval.",
        "recommendation": "Negotiate Net 30 maximum. Add late payment interest clause.",
    },
    {
        "id": "data_sharing",
        "name": "Broad Data Sharing",
        "dimension": "confidentiality",
        "severity": "high",
        "patterns": [
            r"(?i)(share.*data.*third part|disclose.*information.*affiliates)",
            r"(?i)(use.*data.*any purpose|data.*without restriction)",
        ],
        "explanation": "Your data or confidential information may be shared broadly without restriction.",
        "recommendation": "Limit data sharing to specific named purposes and add explicit deletion obligations.",
    },
    {
        "id": "governing_law_unfavorable",
        "name": "Unfavorable Jurisdiction",
        "dimension": "dispute",
        "severity": "low",
        "patterns": [
            r"(?i)(governed by.*laws of.*(?!india|your state))",
            r"(?i)(jurisdiction.*courts of.*foreign)",
        ],
        "explanation": "Disputes must be resolved in a jurisdiction that may be inconvenient or costly for you.",
        "recommendation": "Negotiate for your local jurisdiction or a mutually convenient neutral location.",
    },
    {
        "id": "class_action_waiver",
        "name": "Class Action Waiver",
        "dimension": "dispute",
        "severity": "high",
        "patterns": [
            r"(?i)(waive.*right.*class action|no.*class action|class action waiver)",
            r"(?i)(disputes.*individual(ly)? only|no.*representative proceeding)",
        ],
        "explanation": "You cannot band together with others to sue, even when many people are harmed the same way.",
        "recommendation": "Strike the waiver, or carve out an exception for claims over a set threshold.",
    },
    {
        "id": "perpetual_confidentiality",
        "name": "Perpetual Confidentiality",
        "dimension": "confidentiality",
        "severity": "medium",
        "patterns": [
            r"(?i)(confidential.*in perpetuity|confidentiality.*indefinite(ly)?)",
            r"(?i)(obligations.*survive.*forever)",
        ],
        "explanation": "Confidentiality obligations never expire, creating a compliance burden that outlives the contract.",
        "recommendation": "Limit confidentiality duration to 3–5 years post-termination for non-trade-secret information.",
    },
    {
        "id": "as_is_no_warranty",
        "name": "No Warranty / AS IS",
        "dimension": "liability",
        "severity": "medium",
        "patterns": [
            r"(?i)(provided.*as[- ]is|no warranty.*any kind)",
            r"(?i)(disclaim.*all warranties|merchantability.*fitness for.*purpose)",
        ],
        "explanation": "The other party disclaims all warranties — you have no recourse if the service or product fails.",
        "recommendation": "Retain at minimum a warranty that the service conforms to documentation and is free of viruses.",
    },
    {
        "id": "one_way_attorney_fees",
        "name": "One-Way Attorney Fees",
        "dimension": "dispute",
        "severity": "high",
        "patterns": [
            r"(?i)(pay.*reasonable attorney.*fees.*company|prevailing party.*company)",
            r"(?i)(indemnif.*attorney.*fees.*all)",
        ],
        "explanation": "If there's a dispute you pay their legal fees win-or-lose, but they don't reciprocate.",
        "recommendation": "Make the attorney-fees clause mutual and limit to the prevailing party only.",
    },
    {
        "id": "personal_guarantee",
        "name": "Personal Guarantee",
        "dimension": "liability",
        "severity": "critical",
        "patterns": [
            r"(?i)(personal(ly)? guarantee|personally liable for)",
            r"(?i)(individual.*guarantor)",
        ],
        "explanation": "You're personally on the hook — your savings, home, and assets are reachable, not just the company's.",
        "recommendation": "Strike personal guarantees or cap exposure to a defined dollar amount.",
    },
    {
        "id": "liquidated_damages",
        "name": "Liquidated Damages",
        "dimension": "liability",
        "severity": "medium",
        "patterns": [
            r"(?i)(liquidated damages.*\$|pre-agreed damages)",
            r"(?i)(penalty.*breach.*fixed amount)",
        ],
        "explanation": "A fixed-sum penalty triggers on breach, often disproportionate to actual harm.",
        "recommendation": "Replace with actual damages or ensure the sum is a reasonable estimate of real loss.",
    },
    {
        "id": "change_of_control",
        "name": "Change of Control Termination",
        "dimension": "termination",
        "severity": "medium",
        "patterns": [
            r"(?i)(change of control|acquisition.*terminate|merger.*terminate)",
            r"(?i)(sale of.*assets.*terminate)",
        ],
        "explanation": "The contract can be terminated if your company is acquired — devaluing you in any M&A.",
        "recommendation": "Negotiate consent-not-unreasonably-withheld rather than automatic termination.",
    },
    {
        "id": "anti_assignment_one_sided",
        "name": "One-Sided Assignment Restriction",
        "dimension": "liability",
        "severity": "low",
        "patterns": [
            r"(?i)(you.*not.*assign|recipient.*shall not.*transfer)",
            r"(?i)(assignment.*prior written consent.*company)",
        ],
        "explanation": "You can't assign the contract but the other party can — creating a one-way restriction.",
        "recommendation": "Make assignment restrictions mutual, or carve out assignment to affiliates and successors.",
    },
]

MISSING_CLAUSE_CHECKS: list[dict[str, Any]] = [
    {
        "name": "Limitation of Liability Cap",
        "patterns": [r"(?i)(liability.*capped|maximum liability|liability.*not exceed)"],
        "importance": "critical",
    },
    {
        "name": "Force Majeure",
        "patterns": [r"(?i)(force majeure|act of god|beyond.*control)"],
        "importance": "high",
    },
    {
        "name": "Dispute Resolution Process",
        "patterns": [r"(?i)(dispute|arbitration|mediation|court)"],
        "importance": "high",
    },
    {
        "name": "Confidentiality Obligations",
        "patterns": [r"(?i)(confidential|non-disclosure|proprietary)"],
        "importance": "medium",
    },
    {
        "name": "Payment Terms",
        "patterns": [r"(?i)(payment|invoice|fee|compensation)"],
        "importance": "high",
    },
    {
        "name": "Notice Requirements",
        "patterns": [r"(?i)(notice|notification|written notice)"],
        "importance": "medium",
    },
    {
        "name": "Termination Procedure",
        "patterns": [r"(?i)(terminat|cancel|end of agreement)"],
        "importance": "high",
    },
    {
        "name": "IP Ownership Clarity",
        "patterns": [r"(?i)(intellectual property|ownership|work product)"],
        "importance": "critical",
    },
]

SEVERITY_SCORE = {"critical": 90, "high": 70, "medium": 45, "low": 20}


def _nearest_section(position: int, sections: list[dict] | None) -> str:
    if not sections:
        return ""
    best = ""
    for section in sections:
        start = section.get("start", 0)
        if start <= position:
            best = section.get("title", "") or best
        else:
            break
    return best


def analyze_risks(text: str, sections: list[dict] | None = None) -> dict:
    """Regex-driven risk detection with position + nearest-section metadata."""
    detected_risks: list[dict] = []
    seen_ids: set[str] = set()

    for risk_def in RISK_PATTERNS:
        if risk_def["id"] in seen_ids:
            continue
        for pattern in risk_def["patterns"]:
            match = re.search(pattern, text)
            if not match:
                continue
            start = max(0, match.start() - 100)
            end = min(len(text), match.end() + 100)
            excerpt = text[start:end].strip()[:300]

            detected_risks.append(
                {
                    "id": risk_def["id"],
                    "name": risk_def["name"],
                    "dimension": risk_def["dimension"],
                    "severity": risk_def["severity"],
                    "severity_score": SEVERITY_SCORE[risk_def["severity"]],
                    "explanation": risk_def["explanation"],
                    "recommendation": risk_def["recommendation"],
                    "excerpt": excerpt,
                    "position": {"start": match.start(), "end": match.end()},
                    "section": _nearest_section(match.start(), sections),
                }
            )
            seen_ids.add(risk_def["id"])
            break

    missing_clauses: list[dict] = []
    for check in MISSING_CLAUSE_CHECKS:
        if not any(re.search(p, text) for p in check["patterns"]):
            missing_clauses.append(
                {
                    "name": check["name"],
                    "importance": check["importance"],
                    "message": f"No {check['name'].lower()} found in this document.",
                }
            )

    if detected_risks:
        avg_score = sum(r["severity_score"] for r in detected_risks) / len(detected_risks)
        missing_penalty = sum(10 for m in missing_clauses if m["importance"] == "critical")
        overall_score = min(100, avg_score + missing_penalty)
    else:
        overall_score = 15

    dimension_scores: dict[str, int] = {}
    for risk in detected_risks:
        dim = risk["dimension"]
        dimension_scores[dim] = max(dimension_scores.get(dim, 0), risk["severity_score"])

    return {
        "risks": detected_risks,
        "missing_clauses": missing_clauses,
        "overall_score": round(overall_score),
        "risk_level": get_risk_level(overall_score),
        "dimension_scores": dimension_scores,
        "total_risks": len(detected_risks),
        "critical_count": sum(1 for r in detected_risks if r["severity"] == "critical"),
        "high_count": sum(1 for r in detected_risks if r["severity"] == "high"),
        "medium_count": sum(1 for r in detected_risks if r["severity"] == "medium"),
        "low_count": sum(1 for r in detected_risks if r["severity"] == "low"),
    }


def get_risk_level(score: float) -> str:
    if score >= 75:
        return "CRITICAL"
    if score >= 55:
        return "HIGH"
    if score >= 35:
        return "MEDIUM"
    return "LOW"
