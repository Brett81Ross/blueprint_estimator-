# ABL-RT-09 — Gemini Provider Modernization + Model Failover

Status: READY FOR RELEASE REVIEW — NO PRODUCTION DEPLOYMENT AUTHORIZED

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


## Final branch QA

Run: https://github.com/Brett81Ross/blueprint_estimator-/actions/runs/38270172150

- [x] @google/genai 2.28.0 installs successfully.
- [x] Typecheck.
- [x] Firewall/security tests.
- [x] Project-input tests.
- [x] Neon executor regression tests.
- [x] Analysis prompt / pricing guardrail tests.
- [x] Provider retry/timeout regression tests.
- [x] Provider model-router tests.
- [x] Pricing output guard tests.
- [x] Analysis error contract tests.
- [x] Provider cooldown tests.
- [x] Next.js production build.

Production remains on RT-08 / c69841888acd0e6cfb82eb67df890a61f9d00050 until explicit owner approval for RT-09.


## Production release verification — 2026-10-12

Release authorization received and PR #11 merged to main.

Production release:
- Merge SHA: ef8b5428c2a1c3f26b70cfc4be177bf8cf69b640
- Vercel deployment: dpl_7ha1YoDqjnVc6SGSwvogxMTcKrhc
- Public alias: https://blueprint-estimator.vercel.app
- Deployment state: READY
- Rollback SHA preserved: c69841888acd0e6cfb82eb67df890a61f9d00050

Live provider-routing evidence:
- [x] Exact production SHA gate passed.
- [x] gemini-3.8-flash returned HTTP 503 on all three fixtures.
- [x] Rapid Takeoff switched each request to gemini-3.5-flash-lite.
- [x] Concrete completed successfully through fallback.
- [x] Painter completed successfully through fallback.
- [x] Plumbing completed successfully through fallback.
- [x] No Vercel Runtime Timeout Error occurred.
- [x] Neon recorded three consecutive success outcomes.

Known-answer production fixture run:
- Run: https://github.com/Brett81Ross/blueprint_estimator-/actions/runs/38270681465
- Concrete: PASS 600 SF slab area.
- Concrete: PASS approximately 7.41 CY concrete.
- Painter: PASS 715 SF net painted wall area.
- Plumbing: PASS four fixtures.
- Plumbing: PASS does not double-count to eight.
- All three: PASS missing pricing basis marked UNPRICED.
- All three: PASS no invented currency amounts without pricing basis.
- All three successful JSON payloads report providerModel gemini-3.5-flash-lite and providerFallback true.

Release result:
- ABL-RT-09 is VERIFIED LIVE.
- The persistent provider-capacity blocker is functionally bypassed by bounded model failover.
- gemini-3.8-flash remains degraded with 503 responses during this release window, but Rapid Takeoff is operational through gemini-3.5-flash-lite.
- Production should remain on ef8b5428c2a1c3f26b70cfc4be177bf8cf69b640.
