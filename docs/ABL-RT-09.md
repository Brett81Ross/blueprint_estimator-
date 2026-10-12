# ABL-RT-09 — Gemini Provider Modernization + Model Failover

Status: DEVELOPMENT — NO PRODUCTION DEPLOYMENT AUTHORIZED

Branch: dev-rt-abl-09
Production lineage baseline: c69841888acd0e6cfb82eb67df890a61f9d00050
Immediate rollback before RT-08: a3c99f892b6aef471d0b8eb0fa71f0db5fc7c81a

## Why this batch exists

Rapid Takeoff has remained blocked by repeated provider HTTP 429 responses while using the deprecated @google/generative-ai library and deprecated gemini-3.5-flash model alias. Current Google guidance recommends @google/genai, and gemini-3.5-flash now routes to a newer model behind the alias.

## Implemented

- [x] Replace deprecated @google/generative-ai with @google/genai 2.28.0.
- [x] Use explicit primary model gemini-3.8-flash.
- [x] Use explicit fallback model gemini-3.5-flash-lite.
- [x] Preserve inline PDF/image blueprint analysis.
- [x] Disable SDK-internal retries so Rapid Takeoff owns retry/failover behavior.
- [x] Keep each provider attempt bounded by the existing 16-second deadline.
- [x] Primary gets one attempt.
- [x] On primary 429, 503, or timeout, switch models instead of repeatedly hammering the same model.
- [x] Fallback gets at most two attempts, with a single 1-second retry only for transient 503/timeout.
- [x] Fallback 429 fails immediately.
- [x] Maximum provider wait budget is 49 seconds, below the 60-second Vercel ceiling.
- [x] Successful API responses report providerModel and providerFallback for release verification.
- [x] Add deterministic model-router regression tests.
- [x] Add the model-router suite to standard CI.

## External basis checked 2026-10-12

- Google documents gemini-3.8-flash as GA and current.
- Google documents gemini-3.5-flash as deprecated and automatically routed to gemini-3.6-flash.
- Google recommends migrating from @google/generative-ai to @google/genai.
- Google documents gemini-3.5-flash-lite as suited to high-volume data analysis and document extraction.
- Current @google/genai release line supports per-attempt timeouts and configurable retries.

## Release gate

Do not merge/deploy until the full branch and PR-specific QA gates pass and owner approves the production release.
