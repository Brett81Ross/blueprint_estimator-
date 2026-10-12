# ABL-RT-08 — Provider Cooldown UX

Status: DEVELOPMENT — NO PRODUCTION DEPLOYMENT AUTHORIZED

Branch: dev-rt-abl-08
Production baseline: a3c99f892b6aef471d0b8eb0fa71f0db5fc7c81a
Rollback candidate: c6af09695b3d3e05f3225f3b7e1a231432790ed9

## Why this batch exists

ABL-RT-07 now returns stable provider-capacity codes and Retry-After hints, but the Run button remains immediately clickable after a provider 429/503. A user can therefore issue repeated provider requests even while the UI tells them to wait.

## Implemented

- [x] Read provider retryAfterSeconds from the existing RT-07 error contract.
- [x] Start client cooldown only for PROVIDER_CAPACITY and PROVIDER_TEMPORARY.
- [x] Do not apply provider cooldown to Rapid Takeoff's own ANALYSIS_LIMIT response.
- [x] Preserve all uploaded plans and project inputs during cooldown.
- [x] Disable only the analysis Run button during cooldown.
- [x] Show a visible second-by-second countdown.
- [x] Change the Run button label to Provider busy — retry in Ns.
- [x] Automatically re-enable the Run button when the countdown reaches zero.
- [x] A successful analysis clears any residual cooldown.
- [x] Clamp unexpected retry hints to a five-minute maximum.
- [x] Add deterministic cooldown helper tests and standard CI coverage.
- [x] No automatic provider retry is added in the browser.

## Release gate

Do not merge/deploy until explicit owner approval.
