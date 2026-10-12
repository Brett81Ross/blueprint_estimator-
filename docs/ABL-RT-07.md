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


## Production release verification — 2026-10-11

Release authorization received and PR #9 merged to main.

Production release:
- Merge SHA: a3c99f892b6aef471d0b8eb0fa71f0db5fc7c81a
- Vercel deployment: dpl_8hqcjWLpKycJAkLHy3RX586fQh8s
- Public alias: https://blueprint-estimator.vercel.app
- Deployment state: READY
- Rollback SHA preserved: c6af09695b3d3e05f3225f3b7e1a231432790ed9

Live capacity-handling evidence:
- [x] Exact production SHA verified by /api/build-info before fixture execution.
- [x] Provider remained capacity-limited with HTTP 429 responses.
- [x] Concrete, Painter, and Plumbing each issued one provider attempt only.
- [x] 429 responses failed fast; no three-attempt provider hammering.
- [x] Painter and Plumbing responses included code PROVIDER_CAPACITY and retryAfterSeconds 60.
- [x] Runtime logs show Painter and Plumbing executed on dpl_8hqcjWLpKycJAkLHy3RX586fQh8s.
- [x] Concrete fired during alias propagation and hit the prior deployment once; later requests consistently used the RT-07 deployment.
- [x] Neon recorded terminal provider_error outcomes for all three fixture reservations.

Known-answer quantity gate:
- [ ] Concrete quantity assertions remain blocked by provider 429.
- [ ] Painter quantity assertions remain blocked by provider 429.
- [ ] Plumbing quantity assertions remain blocked by provider 429.

Release result:
- ABL-RT-07 capacity-aware failure handling is VERIFIED LIVE.
- Full takeoff quantity verification remains BLOCKED BY PROVIDER CAPACITY.
- Production should remain on a3c99f892b6aef471d0b8eb0fa71f0db5fc7c81a; no rollback is indicated by this provider incident.
