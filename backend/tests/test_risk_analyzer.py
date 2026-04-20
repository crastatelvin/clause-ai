from clause_extractor import get_document_sections, split_into_clauses
from risk_analyzer import analyze_risks, get_risk_level


RISKY_CONTRACT = """EMPLOYMENT AGREEMENT

1. COMPENSATION
Employee shall receive $80,000, payable net 90 days, subject to Company approval.

2. INTELLECTUAL PROPERTY
All work product and intellectual property belongs to the Company.
Employee hereby assigns all rights to Company.

3. TERMINATION
Company may terminate at any time at its sole discretion without cause.

4. NON-COMPETE
Employee agrees not to compete worldwide for a period of 3 years.

5. INDEMNIFICATION
Employee agrees to indemnify Company for any and all claims without limitation.

6. AMENDMENTS
Company may modify terms at any time at its sole discretion.

7. ARBITRATION
All disputes shall be resolved exclusively through binding arbitration.
"""

CLEAN_DOCUMENT = """MUTUAL SERVICE AGREEMENT

1. PAYMENT
Payment is due Net 30. Both parties may issue written notice.

2. CONFIDENTIALITY
Each party shall keep confidential information proprietary and not disclose it.

3. TERMINATION
Either party may terminate with 30 days written notice.

4. FORCE MAJEURE
Neither party is liable for events beyond control.
"""


def test_split_into_clauses_assigns_offsets_and_types():
    clauses = split_into_clauses(RISKY_CONTRACT)
    assert len(clauses) >= 5
    types = {c["type"] for c in clauses}
    assert "termination" in types
    assert "ip" in types
    # Every clause must carry its char offsets back to the source text.
    for clause in clauses:
        assert clause["end"] > clause["start"] >= 0
        assert RISKY_CONTRACT[clause["start"] : clause["end"]].strip().startswith(clause["text"][:20])


def test_get_document_sections_returns_dicts():
    sections = get_document_sections(RISKY_CONTRACT)
    assert sections, "expected at least one section heading"
    assert all(isinstance(s, dict) and "title" in s and "start" in s for s in sections)


def test_analyze_risks_detects_many_issues_and_computes_level():
    sections = get_document_sections(RISKY_CONTRACT)
    result = analyze_risks(RISKY_CONTRACT, sections=sections)

    assert result["total_risks"] >= 5
    assert result["critical_count"] >= 1
    assert result["risk_level"] in {"CRITICAL", "HIGH"}

    ids = {r["id"] for r in result["risks"]}
    assert "unlimited_liability" in ids or "ip_assignment" in ids

    for risk in result["risks"]:
        assert "position" in risk and "start" in risk["position"]
        assert "section" in risk
        assert risk["severity_score"] > 0


def test_analyze_risks_clean_document_is_low_risk():
    result = analyze_risks(CLEAN_DOCUMENT)
    assert result["risk_level"] in {"LOW", "MEDIUM"}
    assert result["overall_score"] < 75


def test_get_risk_level_bounds():
    assert get_risk_level(10) == "LOW"
    assert get_risk_level(40) == "MEDIUM"
    assert get_risk_level(60) == "HIGH"
    assert get_risk_level(90) == "CRITICAL"


def test_missing_clauses_for_bare_document():
    result = analyze_risks("Two parties agree to do the thing. " * 10)
    names = {m["name"] for m in result["missing_clauses"]}
    assert "IP Ownership Clarity" in names
    assert "Force Majeure" in names


def test_expanded_rules_fire_individually():
    cases = {
        "class_action_waiver": "You waive your right to class action lawsuits entirely.",
        "perpetual_confidentiality": "These obligations remain confidential in perpetuity.",
        "as_is_no_warranty": "The service is provided as-is with no warranty of any kind.",
        "one_way_attorney_fees": "You agree to pay reasonable attorney fees of the Company.",
        "personal_guarantee": "You personally guarantee the obligations under this contract.",
        "liquidated_damages": "Liquidated damages of $50,000 shall apply upon breach.",
        "change_of_control": "Upon any change of control the Company may terminate immediately.",
    }
    for rule_id, snippet in cases.items():
        result = analyze_risks(snippet + " " + " ".join(["word"] * 40))
        ids = {r["id"] for r in result["risks"]}
        assert rule_id in ids, f"Expected {rule_id} to fire on: {snippet!r} (got {ids})"
