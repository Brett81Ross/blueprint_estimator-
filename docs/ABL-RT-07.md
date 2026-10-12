# ABL-RT-07 — Capacity-Aware Failure Handling

Status: READY FOR RELEASE REVIEW — NO PRODUCTION DEPLOYMENT AUTHORIZED

Branch: dev-rt-abl-07
Production baseline: c6af09695b3d3e05f3225f3b7e1a231432790ed9
Rollback candidate: e5044aa7a4b59585631df75341e37c3d57f9913a

## Why this batch exists

Gemini/provider capacity remained limited after ABL-RT-06. Rapid Takeoff correctly bounded provider timeouts, but provider 429 responses were still presented similarly to Rapid Takeoff's own usage limits, and the controlled fixture harness retried 429 responses three times.

## Implemented

- [x] Distinguish Rapid Takeoff analysis-limit responses from external provider-capacity responses.
- [x] Provider capacity uses stable code PROVIDER_CAPACITY.
- [x] Provider temporary/unavailable uses stable code PROVIDER_TEMPORARY.
- [x] Rapid Takeoff usage limits use stable code ANALYSIS_LIMIT.
- [x] Provider 429 returns Retry-After: 60 and retryAfterSeconds: 60.
- [x] Provider timeout/503 returns Retry-After: 30 and retryAfterSeconds: 30.
- [x] UI tells users their plans are still loaded and gives concrete retry guidance.
- [x] No automatic browser retry is introduced, avoiding duplicate provider work.
- [x] Production fixture harness fails fast on HTTP 429 instead of issuing three provider attempts.
- [x] Fixture harness continues paced retries for HTTP 503.
- [x] Added regression coverage for the analysis error contract.
- [x] Added the analysis-error contract suite to standard CI.

## Release gate

Do not merge/deploy until explicit owner approval.


## Final branch QA

Run: https://github.com/Brett81Ross/blueprint_estimator-/actions/runs/38198796138

- [x] Typecheck.
- [x] Firewall/security tests.
- [x] Project-input tests.
- [x] Neon executor regression tests.
- [x] Analysis prompt / pricing guardrail tests.
- [x] Provider retry/timeout regression tests.
- [x] Pricing output guard tests.
- [x] Analysis error contract tests.
- [x] Next.js production build.

Production remains on c6af09695b3d3e05f3225f3b7e1a231432790ed9 until explicit owner approval.
