# ABL-RT-04 — Provider Resilience + QA Harness Hardening

Status: READY FOR RELEASE REVIEW — NO PRODUCTION DEPLOYMENT AUTHORIZED

Branch: dev-rt-abl-04
Production baseline: b580127e242bdf39e06f8e0626d5c9dca4de09e2
Previous rollback candidate: 70d5bd5392f01c4a57ec52f638b4a13673fe9cee
Production deployment: dpl_FDERcFAy9kftbr3Bf942a7mMEP7z

## ABL-RT-03 production verification

The ABL-RT-03 release is live on production and its pricing-integrity behavior is verified.

Corrected live known-answer recheck:
- [x] Exact production SHA b580127e242bdf39e06f8e0626d5c9dca4de09e2 verified before analysis.
- [x] Concrete C-01: 600 SF.
- [x] Concrete C-01: approximately 7.41 CY.
- [x] Concrete C-01: UNPRICED when no pricing basis supplied.
- [x] Concrete C-01: no invented currency amount.
- [x] Painter P-01: 715 SF.
- [x] Painter P-01: UNPRICED when no pricing basis supplied.
- [x] Painter P-01: no invented currency amount.
- [x] Plumbing PL-01: four fixtures.
- [x] Plumbing PL-01: no plan/schedule double-count to eight.
- [x] Plumbing PL-01: UNPRICED when no pricing basis supplied.
- [x] Plumbing PL-01: no invented currency amount.

## QA harness correction

The first ABL-RT-03 release run reported a false pricing failure because the detector treated Gemini's LaTeX math delimiters as currency. Example: $20\text{'-}0\text{"}$ represented a dimension, not a dollar value.

Development correction:
- [x] Currency detector ignores LaTeX math-delimited expressions containing LaTeX commands.
- [x] Real currency patterns remain prohibited when no pricing basis is supplied.
- [x] Provider requests are globally paced at 25 seconds in the production fixture harness.
- [x] Fixture harness retries only transient HTTP 429/503 responses, maximum three attempts.
- [x] Temporary one-off ABL-RT-03 live recheck workflow removed after successful verification.

## Provider reliability finding

The corrected production recheck revealed a real provider reliability issue:
- Concrete attempt 1: Gemini/provider HTTP 503.
- Concrete attempt 2: Gemini/provider HTTP 503.
- Concrete attempt 3: HTTP 200 and all assertions passed.
- Painter: HTTP 200.
- Plumbing: HTTP 200.

The hardened Rapid Takeoff policy layer remained healthy during these attempts: reservations reached provider_started_at. The 503s were provider-side failures, not Stage-1/Stage-2 policy failures.

## Product reliability fix on dev-rt-abl-04

- [x] Added lib/provider-retry.ts.
- [x] Rapid Takeoff now retries provider status 503 inside the same analysis request.
- [x] Maximum provider attempts: 3 total.
- [x] Retry delays: 1.0s then 2.5s.
- [x] Status 429 is not retried inside the app.
- [x] Same policy reservation is retained across provider retry attempts.
- [x] Retry logging exposes only attempt/nextAttempt/status, not secrets or provider payloads.
- [x] Added provider retry regression suite.
- [x] Normal QA now gates provider retry behavior.

## Final branch QA

Run: https://github.com/Brett81Ross/blueprint_estimator-/actions/runs/37885268787

- [x] Typecheck.
- [x] Firewall/security tests.
- [x] Project-input tests.
- [x] Neon executor regression tests.
- [x] Analysis prompt / pricing guardrail tests.
- [x] Provider retry regression tests.
- [x] Next.js production build.
- [x] Vercel preview deployments for dev-rt-abl-04: zero.

## Release gate

Production remains on b580127e242bdf39e06f8e0626d5c9dca4de09e2.

Do not merge/deploy the provider-retry fix until explicit owner approval.
After any approved deployment:
1. Confirm exact production SHA through /api/build-info.
2. Run the known-answer Concrete/Painter/Plumbing production harness.
3. Confirm quantity assertions, UNPRICED behavior, and zero unsupported currency amounts.
4. Confirm Neon provider_started_at and success outcomes.
