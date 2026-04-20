import ai_service


def test_ai_service_returns_stub_when_no_api_key(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    result = ai_service.analyze_document_ai("some contract text", [], [])
    assert set(result.keys()) >= {
        "document_type",
        "executive_summary",
        "top_concerns",
        "negotiation_leverage",
        "red_flags",
        "overall_verdict",
    }
    assert result["top_concerns"] == []
    assert "GROQ_API_KEY" in result["overall_verdict"]


def test_normalise_coerces_missing_fields():
    normalised = ai_service._normalise({"document_type": "NDA"})
    assert normalised["document_type"] == "NDA"
    assert normalised["top_concerns"] == []
    assert normalised["executive_summary"] == ""


def test_normalise_filters_invalid_concern_entries():
    raw = {
        "top_concerns": [
            {"name": "Good", "why": "because", "action": "fix it"},
            "not a dict",
            {"name": "Also good"},
        ]
    }
    normalised = ai_service._normalise(raw)
    assert len(normalised["top_concerns"]) == 2
    assert normalised["top_concerns"][0]["name"] == "Good"
    assert normalised["top_concerns"][1]["name"] == "Also good"


def test_chat_without_key_yields_placeholder(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    tokens = list(
        ai_service.chat_with_document(
            document_text="some contract",
            risks=[],
            history=[],
            user_message="hi",
        )
    )
    assert len(tokens) == 1
    assert "GROQ_API_KEY" in tokens[0]


def test_build_chat_context_includes_risks_and_truncates():
    big_text = "X" * (ai_service._CHAT_MAX_DOC_CHARS + 500)
    risks = [
        {"severity": "high", "name": "Thing", "explanation": "because reasons"},
    ]
    ctx = ai_service._build_chat_context(big_text, risks)
    assert "THIS specific document" in ctx
    assert "[HIGH] Thing" in ctx
    assert len(ctx.split("DOCUMENT (truncated")[1]) < ai_service._CHAT_MAX_DOC_CHARS + 600
