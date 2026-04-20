# ============================================
# Project: CLAUSE — AI Contract Risk Analyzer
# Author: Telvin Crasta
# GitHub: github.com/crastatelvin
# License: CC BY-NC 4.0
# Original design and architecture by Telvin Crasta
# ============================================

from __future__ import annotations

import asyncio
import json
import logging
import os
import uuid
from collections import OrderedDict
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, File, Request, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from ai_service import analyze_document_ai, chat_with_document
from clause_extractor import get_document_sections, split_into_clauses
from document_parser import parse_document
from report_generator import build_report
from risk_analyzer import analyze_risks

load_dotenv()
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
log = logging.getLogger("clause")

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx", ".md"}
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "10")) * 1024 * 1024
MAX_CACHED_REPORTS = int(os.getenv("MAX_CACHED_REPORTS", "50"))
ANALYZE_RATE_LIMIT = os.getenv("ANALYZE_RATE_LIMIT", "10/minute")
CHAT_RATE_LIMIT = os.getenv("CHAT_RATE_LIMIT", "30/minute")

_origins_env = os.getenv("ALLOWED_ORIGINS", "*").strip()
ALLOWED_ORIGINS = ["*"] if _origins_env == "*" else [o.strip() for o in _origins_env.split(",") if o.strip()]

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="CLAUSE — AI Contract Risk Analyzer", version="1.2")
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": f"Rate limit exceeded: {exc.detail}"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# State: bounded LRU cache of reports keyed by request_id, plus "latest".
# ---------------------------------------------------------------------------

class ReportStore:
    def __init__(self, maxsize: int):
        self.maxsize = maxsize
        self._reports: OrderedDict[str, dict] = OrderedDict()
        self._lock = asyncio.Lock()
        self.latest_id: str | None = None

    async def save(self, request_id: str, report: dict) -> None:
        async with self._lock:
            self._reports[request_id] = report
            self._reports.move_to_end(request_id)
            while len(self._reports) > self.maxsize:
                self._reports.popitem(last=False)
            self.latest_id = request_id

    def get(self, request_id: str) -> dict | None:
        return self._reports.get(request_id)

    def latest(self) -> dict | None:
        if self.latest_id:
            return self._reports.get(self.latest_id)
        return None

    def list(self) -> list[dict]:
        items = []
        for request_id, report in reversed(self._reports.items()):
            items.append(
                {
                    "request_id": request_id,
                    "filename": report.get("document", {}).get("filename"),
                    "document_type": report.get("document", {}).get("document_type"),
                    "risk_level": report.get("risk_score", {}).get("level"),
                    "overall": report.get("risk_score", {}).get("overall"),
                    "generated_at": report.get("generated_at"),
                }
            )
        return items


store = ReportStore(MAX_CACHED_REPORTS)


# ---------------------------------------------------------------------------
# WebSockets: one socket per request_id so broadcasts don't leak across users.
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self) -> None:
        self._by_request: dict[str, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, request_id: str, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._by_request.setdefault(request_id, set()).add(ws)

    async def disconnect(self, request_id: str, ws: WebSocket) -> None:
        async with self._lock:
            conns = self._by_request.get(request_id)
            if conns and ws in conns:
                conns.remove(ws)
                if not conns:
                    self._by_request.pop(request_id, None)

    async def send(self, request_id: str, message: dict) -> None:
        payload = json.dumps(message)
        async with self._lock:
            targets = list(self._by_request.get(request_id, set()))
        if not targets:
            return
        dead: list[WebSocket] = []
        for ws in targets:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        if dead:
            async with self._lock:
                conns = self._by_request.get(request_id)
                if conns:
                    for ws in dead:
                        conns.discard(ws)
                    if not conns:
                        self._by_request.pop(request_id, None)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, request_id: str | None = None) -> None:
    session_id = request_id or websocket.query_params.get("request_id") or "broadcast"
    await manager.connect(session_id, websocket)
    try:
        await websocket.send_text(
            json.dumps({"step": "connected", "request_id": session_id, "message": "socket ready"})
        )
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(session_id, websocket)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root() -> dict:
    return {
        "status": "CLAUSE AI is online",
        "version": app.version,
        "author": "Telvin Crasta",
        "model_provider": "groq",
        "features": [
            "regex + LLM two-layer risk analysis",
            "position-aware risk detection",
            "streaming follow-up chat",
            "PDF / TXT / DOCX parsing",
        ],
    }


def _validate_file(file: UploadFile, size: int) -> str | None:
    if size == 0:
        return "Uploaded file is empty."
    if size > MAX_UPLOAD_BYTES:
        return f"File too large (max {MAX_UPLOAD_BYTES // (1024 * 1024)} MB)."
    filename = (file.filename or "").lower()
    if not any(filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        return f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
    return None


@app.post("/analyze")
@limiter.limit(ANALYZE_RATE_LIMIT)
async def analyze_document(request: Request, file: UploadFile = File(...)):
    # Allow client to request its own WS channel by passing ?request_id=... .
    request_id = request.query_params.get("request_id") or uuid.uuid4().hex

    async def progress(step: str, message: str, **extra: Any) -> None:
        await manager.send(request_id, {"step": step, "message": message, **extra})

    try:
        file_bytes = await file.read()
        validation_error = _validate_file(file, len(file_bytes))
        if validation_error:
            return JSONResponse(status_code=400, content={"error": validation_error})

        await progress("parsing", f"Reading {file.filename}...")

        try:
            doc_info = parse_document(file_bytes, file.filename or "document")
        except Exception as exc:
            log.exception("Failed to parse document")
            return JSONResponse(status_code=400, content={"error": f"Could not read document: {exc}"})

        if not doc_info["text"] or doc_info["word_count"] < 20:
            return JSONResponse(
                status_code=400,
                content={"error": "Document appears empty, image-only, or too short to analyze."},
            )

        await progress("extracting", "Extracting clauses and sections...")
        clauses = split_into_clauses(doc_info["text"])
        sections = get_document_sections(doc_info["text"])

        await progress("analyzing", "Running risk pattern analysis...")
        risk_analysis = analyze_risks(doc_info["text"], sections=sections)

        await progress("ai", "Running deep AI analysis via Groq...")
        ai_analysis = await asyncio.to_thread(
            analyze_document_ai,
            doc_info["text"],
            risk_analysis["risks"],
            risk_analysis["missing_clauses"],
        )

        await progress("building", "Building final report...")
        report = build_report(doc_info, risk_analysis, ai_analysis)
        report["clauses"] = clauses
        report["sections"] = sections
        report["request_id"] = request_id
        # Stash the raw text so /chat can reason over the full document later.
        report["_document_text"] = doc_info["text"]

        await store.save(request_id, report)

        await progress("complete", "Analysis complete!", request_id=request_id)

        # Remove internal fields from the response.
        response_report = {k: v for k, v in report.items() if not k.startswith("_")}
        return JSONResponse(response_report)

    except Exception as exc:
        log.exception("Unhandled error while analysing document")
        await manager.send(request_id, {"step": "error", "message": str(exc)})
        return JSONResponse(status_code=500, content={"error": str(exc)})


@app.get("/latest")
def get_latest():
    report = store.latest()
    if report is None:
        return JSONResponse(status_code=404, content={"error": "No analysis available"})
    return JSONResponse({k: v for k, v in report.items() if not k.startswith("_")})


@app.get("/report/{request_id}")
def get_report(request_id: str):
    report = store.get(request_id)
    if report is None:
        return JSONResponse(status_code=404, content={"error": "Report not found"})
    return JSONResponse({k: v for k, v in report.items() if not k.startswith("_")})


@app.get("/reports")
def list_reports():
    return JSONResponse({"reports": store.list()})


@app.get("/status")
def get_status() -> dict:
    latest = store.latest()
    return {
        "has_analysis": latest is not None,
        "reports_cached": len(store._reports),
        "latest_id": store.latest_id,
    }


# ---------------------------------------------------------------------------
# Streaming "Ask CLAUSE" chat
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    request_id: str
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


@app.post("/chat")
@limiter.limit(CHAT_RATE_LIMIT)
async def chat_endpoint(request: Request, body: ChatRequest):
    report = store.get(body.request_id)
    if report is None:
        return JSONResponse(
            status_code=404,
            content={"error": "Unknown request_id. Analyze a document first."},
        )

    document_text = report.get("_document_text", "")
    risks = report.get("risks", [])
    history = [m.model_dump() for m in body.history]

    def token_stream():
        try:
            for token in chat_with_document(
                document_text=document_text,
                risks=risks,
                history=history,
                user_message=body.message,
                stream=True,
            ):
                yield token
        except Exception as exc:
            log.exception("Chat stream failed")
            yield f"\n[stream error: {exc}]"

    return StreamingResponse(
        _sync_to_async_iter(token_stream()),
        media_type="text/plain; charset=utf-8",
    )


async def _sync_to_async_iter(sync_iter):
    """Bridge a synchronous generator (Groq SDK) into an async one so FastAPI
    can stream it without blocking the event loop."""
    loop = asyncio.get_running_loop()
    sentinel = object()

    def _next(it):
        try:
            return next(it)
        except StopIteration:
            return sentinel

    while True:
        item = await loop.run_in_executor(None, _next, sync_iter)
        if item is sentinel:
            break
        yield item
