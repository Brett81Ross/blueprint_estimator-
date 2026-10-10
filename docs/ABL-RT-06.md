# ABL-RT-06 — Provider Timeout Budget

Status: DEVELOPMENT — NO PRODUCTION DEPLOYMENT AUTHORIZED

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
