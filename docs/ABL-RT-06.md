# ABL-RT-06 — Provider Timeout Budget

Status: READY FOR RELEASE REVIEW — NO PRODUCTION DEPLOYMENT AUTHORIZED

Branch: dev-rt-abl-06
Production baseline: e5044aa7a4b59585631df75341e37c3d57f9913a
Rollback candidate: 00855c3634d4569fcfdcc28f2de9d1dd0c9325b7

## Production finding

The ABL-RT-05 release deployed successfully, but live fixture verification exposed a retry-budget problem during a Gemini 503 incident.

Observed:
- Internal provider retry logging fired in production.
- One request exhausted provider 503 retries and recorded provider_error.
- A subsequent outer QA attempt exceeded the Vercel 60-second function ceiling and was terminated by the runtime.
- That timed-out reservation could not record a terminal outcome because the function was killed.

## Fix

- [x] Add a 16-second timeout to each Gemini generateContent attempt.
- [x] Keep at most 3 provider attempts.
- [x] Keep retry delays at 1.0s and 2.5s.
- [x] Maximum configured provider wait budget: 51.5 seconds.
- [x] Leave remaining function time for upload parsing, policy transactions, output guard, ledger recording, and response serialization.
- [x] Treat SDK abort/timeout failures as transient and retryable.
- [x] Continue retrying HTTP/provider 503.
- [x] Continue NOT retrying 429 quota/limit responses.
- [x] Return final provider timeout/abort failures as HTTP 503 rather than generic 500.
- [x] Log retry reason without provider payloads or secrets.
- [x] Add regression coverage for timeout classification, recovery, attempt ceiling, and maximum wait budget.

## Release gate

Do not merge/deploy until explicit owner approval.


## Final branch QA

Run: https://github.com/Brett81Ross/blueprint_estimator-/actions/runs/38075556639

- [x] Typecheck, including installed Gemini SDK timeout request-options signature.
- [x] Firewall/security suite.
- [x] Project-input suite.
- [x] Neon executor regression suite.
- [x] Analysis prompt / pricing guardrail suite.
- [x] Provider retry suite, including timeout/abort recovery and 51.5-second maximum wait budget.
- [x] Pricing output guard suite.
- [x] Next.js production build.

Production remains on e5044aa7a4b59585631df75341e37c3d57f9913a until explicit owner approval.


## Production release verification — 2026-10-10

Release authorization received and PR #8 merged to main.

Production release:
- Merge SHA: c6af09695b3d3e05f3225f3b7e1a231432790ed9
- Vercel deployment: dpl_Ge4xxKEYBtey5ZW2ttMxnpTPS9jK
- Public alias: https://blueprint-estimator.vercel.app
- Deployment state: READY
- Rollback SHA preserved: e5044aa7a4b59585631df75341e37c3d57f9913a

Live timeout-budget evidence:
- [x] Exact production SHA verified by /api/build-info before fixture execution.
- [x] Internal retry logging recorded provider_503 and timeout reasons.
- [x] A request containing provider 503 + SDK timeouts terminated as controlled provider_error before the 60-second Vercel ceiling.
- [x] A separate request with repeated SDK timeouts also terminated as controlled provider_error.
- [x] No Vercel Runtime Timeout Error occurred on the ABL-RT-06 deployment during this release run.
- [x] Provider-error reservations reached provider_started_at and recorded terminal outcomes.
- [x] 429 capacity responses were not internally retried by Rapid Takeoff and were returned as controlled HTTP 429 responses.

Known-answer production gate status:
- [ ] Concrete quantity assertions could not execute because all three outer attempts ended in provider 503/timeout/429 responses.
- [ ] Painter quantity assertions could not execute because all three attempts ended in provider 429 capacity responses.
- [ ] Plumbing quantity assertions could not execute because all three attempts ended in provider 429 capacity responses.
- The failure is provider availability/capacity, not an application runtime crash or a Vercel timeout regression.
- Prior successful controlled runs remain the latest positive quantity evidence until the provider is available again.

Release result:
- ABL-RT-06 timeout-budget objective is VERIFIED LIVE.
- Full quantity/pricing fixture verification remains BLOCKED BY PROVIDER AVAILABILITY.
- Do not change production solely to chase this external provider incident.
