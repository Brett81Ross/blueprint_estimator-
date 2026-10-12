# ABL-RT-08 — Provider Cooldown UX

Status: READY FOR RELEASE REVIEW — NO PRODUCTION DEPLOYMENT AUTHORIZED

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


## Final branch QA

Run: https://github.com/Brett81Ross/blueprint_estimator-/actions/runs/38257304299

- [x] Typecheck.
- [x] Firewall/security tests.
- [x] Project-input tests.
- [x] Neon executor regression tests.
- [x] Analysis prompt / pricing guardrail tests.
- [x] Provider retry/timeout regression tests.
- [x] Pricing output guard tests.
- [x] Analysis error contract tests.
- [x] Provider cooldown tests.
- [x] Next.js production build.

Production remains on a3c99f892b6aef471d0b8eb0fa71f0db5fc7c81a until explicit owner approval.


## Production release verification — 2026-10-12

Release authorized as part of the super-large batch and PR #10 merged to main.

Production release:
- Merge SHA: c69841888acd0e6cfb82eb67df890a61f9d00050
- Vercel deployment: dpl_83QcUYEQuaXBU9vDMVbChs8bu9JH
- Public alias: https://blueprint-estimator.vercel.app
- Deployment state: READY
- Rollback SHA: a3c99f892b6aef471d0b8eb0fa71f0db5fc7c81a

Live fixture status:
- Exact production SHA gate passed.
- Concrete, Painter, and Plumbing each returned provider HTTP 429.
- RT-07 fail-fast behavior remained intact: one provider attempt per case.
- Full quantity assertions remain blocked by provider capacity.
- RT-08 UI cooldown release is live; no rollback signal was observed.
