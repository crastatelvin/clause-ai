# ============================================
# Project: CLAUSE — AI Contract Risk Analyzer
# Author: Telvin Crasta
# GitHub: github.com/crastatelvin
# License: CC BY-NC 4.0
# Original design and architecture by Telvin Crasta
# ============================================

"""Groq-powered deep legal analysis.

Uses Groq's OpenAI-compatible chat completions API with JSON response mode,
which removes the fragile string parsing the previous Gemini implementation
needed. Falls back to a deterministic stub if the API is unreachable so the
rest of the pipeline still produces a usable report.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Iterator

from dotenv import load_dotenv
from groq import Groq, GroqError

load_dotenv()

log = logging.getLogger(__name__)

_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
_MAX_DOC_CHARS = 6000
_MAX_RISKS_IN_PROMPT = 15

_EMPTY_RESULT: dict[str, Any] = {
    "document_type": "Contract",
    "executive_summary": "",
    "top_concerns": [],
    "negotiation_leverage": "",
    "red_flags": "",
    "overall_verdict": "",
}

_SYSTEM_PROMPT = (
    "You are CLAUSE, an elite AI legal document analyst. "
    "You read contracts carefully and explain risk to smart non-lawyers in plain English. "
    "You ALWAYS respond with a single JSON object that exactly matches the requested schema. "
    "Never include prose outside the JSON."
)

_SCHEMA_INSTRUCTIONS = """
Return a JSON object with EXACTLY these keys:

{
  "document_type": "string — e.g. Employment Contract, NDA, Service Agreement, Freelance Contract",
  "executive_summary": "string — 3 to 4 sentences summarising the overall risk profile and what the signing party should know immediately",
  "top_concerns": [
    {
      "name": "short concern title",
      "why": "plain-English real-world impact in 1-2 sentences",
      "action": "specific actionable advice"
    }
  ],
  "negotiation_leverage": "string — 2 to 3 sentences on where the signing party has negotiation leverage and why",
  "red_flags": "string — any unusual, predatory or lawyer-flag-worthy language; be specific",
  "overall_verdict": "string — one sentence: is this document reasonable, concerning, or dangerous?"
}

Rules:
- "top_concerns" must contain 2 to 3 items.
- Keep every string concise and practical.
- Do not invent clauses that aren't supported by the document or the detected risks.
""".strip()


def _get_client() -> Groq | None:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        log.warning("GROQ_API_KEY is not set; AI analysis will be skipped.")
        return None
    return Groq(api_key=api_key)


def _build_user_prompt(text: str, risks: list[dict], missing: list[dict]) -> str:
    risk_summary = (
        "\n".join(
            f"- [{r.get('severity', '?').upper()}] {r.get('name', '')}: {r.get('explanation', '')}"
            for r in risks[:_MAX_RISKS_IN_PROMPT]
        )
        or "No major pattern-based risks detected."
    )
    missing_summary = (
        "\n".join(
            f"- {m.get('name', '')} ({m.get('importance', '')} importance)" for m in missing
        )
        or "All standard clauses appear to be present."
    )

    return (
        f"DOCUMENT EXCERPT (first {_MAX_DOC_CHARS} chars):\n"
        f"{text[:_MAX_DOC_CHARS]}\n\n"
        f"DETECTED RISKS:\n{risk_summary}\n\n"
        f"MISSING STANDARD CLAUSES:\n{missing_summary}\n\n"
        f"{_SCHEMA_INSTRUCTIONS}"
    )


def _normalise(raw: dict[str, Any]) -> dict[str, Any]:
    """Coerce the model's JSON into the exact shape the frontend expects."""
    result = {**_EMPTY_RESULT}

    for key in ("document_type", "executive_summary", "negotiation_leverage", "red_flags", "overall_verdict"):
        value = raw.get(key, "")
        result[key] = value.strip() if isinstance(value, str) else str(value or "")

    concerns_raw = raw.get("top_concerns") or []
    if not isinstance(concerns_raw, list):
        concerns_raw = []

    concerns: list[dict[str, str]] = []
    for item in concerns_raw:
        if not isinstance(item, dict):
            continue
        concerns.append(
            {
                "name": str(item.get("name", "")).strip(),
                "why": str(item.get("why", "")).strip(),
                "action": str(item.get("action", "")).strip(),
            }
        )
    result["top_concerns"] = concerns
    return result


def analyze_document_ai(text: str, risks: list[dict], missing: list[dict]) -> dict[str, Any]:
    """Run Groq-backed deep analysis. Always returns a dict (never raises)."""
    client = _get_client()
    if client is None:
        return {**_EMPTY_RESULT, "overall_verdict": "AI analysis skipped — GROQ_API_KEY not configured."}

    prompt = _build_user_prompt(text, risks, missing)

    try:
        completion = client.chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1400,
        )
    except GroqError as exc:
        log.exception("Groq API call failed")
        return {**_EMPTY_RESULT, "overall_verdict": f"AI analysis unavailable: {exc}"}
    except Exception as exc:  # network, auth, etc.
        log.exception("Unexpected error calling Groq")
        return {**_EMPTY_RESULT, "overall_verdict": f"AI analysis unavailable: {exc}"}

    content = (completion.choices[0].message.content or "").strip()
    if not content:
        return {**_EMPTY_RESULT, "overall_verdict": "AI returned an empty response."}

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        log.warning("Groq returned non-JSON content; returning raw text as verdict")
        return {**_EMPTY_RESULT, "overall_verdict": content[:500]}

    if not isinstance(parsed, dict):
        return {**_EMPTY_RESULT, "overall_verdict": "AI response was not an object."}

    return _normalise(parsed)


# ---------------------------------------------------------------------------
# Chat ("Ask CLAUSE") — follow-up Q&A scoped to the analysed document.
# ---------------------------------------------------------------------------

_CHAT_SYSTEM = (
    "You are CLAUSE, an AI legal assistant. You help a smart non-lawyer understand "
    "a specific contract they've uploaded. You answer ONLY based on the document "
    "content and the risk analysis context provided. If the answer isn't in the "
    "document, say so plainly. Keep answers concise, practical, and free of legal "
    "jargon. Never invent clauses, numbers, or obligations that aren't present."
)

_CHAT_MAX_DOC_CHARS = 8000
_CHAT_MAX_HISTORY = 12


def _build_chat_context(document_text: str, risks: list[dict]) -> str:
    risk_summary = "\n".join(
        f"- [{r.get('severity', '?').upper()}] {r.get('name', '')}: {r.get('explanation', '')}"
        for r in (risks or [])[:10]
    ) or "(no pattern-based risks detected)"
    return (
        "You are answering questions about THIS specific document.\n\n"
        f"DOCUMENT (truncated to {_CHAT_MAX_DOC_CHARS} chars):\n"
        f"{document_text[:_CHAT_MAX_DOC_CHARS]}\n\n"
        f"PREVIOUSLY DETECTED RISKS:\n{risk_summary}"
    )


def chat_with_document(
    *,
    document_text: str,
    risks: list[dict],
    history: list[dict[str, str]],
    user_message: str,
    stream: bool = True,
) -> Iterator[str]:
    """Yield assistant reply tokens (or, if stream=False, a single complete string).

    Always returns an iterator so callers can treat both modes the same.
    """
    client = _get_client()
    if client is None:
        yield "AI chat is unavailable — GROQ_API_KEY is not configured."
        return

    trimmed_history = [
        {"role": m["role"], "content": m["content"]}
        for m in (history or [])[-_CHAT_MAX_HISTORY:]
        if isinstance(m, dict) and m.get("role") in {"user", "assistant"} and m.get("content")
    ]

    messages = [
        {"role": "system", "content": _CHAT_SYSTEM},
        {"role": "system", "content": _build_chat_context(document_text, risks)},
        *trimmed_history,
        {"role": "user", "content": user_message},
    ]

    try:
        completion = client.chat.completions.create(
            model=_MODEL,
            messages=messages,
            temperature=0.4,
            max_tokens=800,
            stream=stream,
        )
    except GroqError as exc:
        log.exception("Groq chat failed")
        yield f"[AI chat error: {exc}]"
        return
    except Exception as exc:
        log.exception("Unexpected chat error")
        yield f"[AI chat error: {exc}]"
        return

    if not stream:
        text = completion.choices[0].message.content or ""
        if text:
            yield text
        return

    for chunk in completion:
        try:
            delta = chunk.choices[0].delta.content
        except (AttributeError, IndexError):
            delta = None
        if delta:
            yield delta
