# Architecture Decisions — CLAUSE AI

## Author: Telvin Crasta | CC BY-NC 4.0

## Why two-layer analysis (regex + AI)?
Regex patterns catch specific legal red flags instantly with zero latency.
Gemini AI provides contextual reasoning and nuanced analysis regex cannot.
Two layers = speed + intelligence combined.

## Why PyMuPDF over pdfplumber?
PyMuPDF (fitz) is 3x faster, handles more PDF formats, and extracts cleaner text.
Critical for large legal documents that may be 50+ pages.

## Why IBM Plex Serif + DM Mono?
IBM Plex Serif signals legal/academic authority — it's what law firms and
publishers use. DM Mono provides technical precision for annotations and
metadata. The combination says "serious tool" without being sterile.

## Why cream/ivory theme over dark?
Legal documents are read on paper. A light, paper-like interface feels
appropriate for the domain and differentiates strongly from dark dashboards.
Each project has a distinct visual identity.

## Why CC BY-NC 4.0?
Allows learning and non-commercial use (portfolio, education, open source)
while preventing commercial exploitation of original architecture and design.
Attribution requirement ensures Telvin Crasta is credited in all derivatives.

## Why FastAPI over Flask/Express?
FastAPI gives automatic OpenAPI docs, built-in async, WebSocket support,
and Pydantic validation — all critical for a real-time AI document pipeline.

## Why WebSockets for progress?
Contract analysis takes 5-15 seconds. Real-time progress updates prevent
users from thinking the app is broken. WebSockets are the cleanest solution.
