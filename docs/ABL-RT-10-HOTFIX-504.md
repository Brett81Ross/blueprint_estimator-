# ABL-RT-10 Hotfix — Provider HTTP 504 Failover

Status: VERIFIED LIVE — PRODUCTION RELEASE COMPLETE

Baseline: 29b72895ebfd48049fbc1d5cc5fa8511129f5b4a

Live RT-10 verification exposed provider-originated HTTP 504 responses. The existing failover taxonomy handled 429, 503, and SDK timeouts but did not classify explicit 504 as transient.

## Changes

- [x] Classify provider HTTP 504 as transient provider unavailability.
- [x] Primary 504 triggers model fallback.
- [x] Fallback 504 can receive the existing one bounded retry.
- [x] If the provider route ultimately ends on 504, the API maps it to the existing controlled PROVIDER_TEMPORARY HTTP 503 contract.
- [x] Preserve the 49-second model-route wait budget.
- [x] Preserve 429 fail-fast semantics.
- [x] Add regression coverage for primary and fallback 504 recovery.

No schema changes. No production data mutation.


## Production verification — 2026-10-12

- Merge SHA: 60ca1e943c9f6c9ff35fe0231bff49dadc80ed8d
- Vercel deployment: dpl_FrSZJKvgbqE314Y7C2RRZEDAnFQu
- Public alias: https://blueprint-estimator.vercel.app
- Rollback SHA preserved: ef8b5428c2a1c3f26b70cfc4be177bf8cf69b640
- Deployment state: READY
- Live provider HTTP 504 events triggered model fallback to gemini-3.5-flash-lite.
- All four live API reservations on the hotfix run reached success.
- No Vercel Runtime Timeout Error observed.
- No post-hotfix Rapid Takeoff analysis-request failure observed.
- Stale reservation self-healing left 0 admission-only null outcomes and 0 provider-started null outcomes.
- General Contractor live report contained 600 SF, ~7.41 CY, four plumbing fixtures, SheetLink™, Conflict Radar™, $145/CY user pricing, and UNPRICED for unsupported components.
- The production workflow remained red only because the fixture regex did not accept LaTeX-formatted `$4$ fixtures`; this was confirmed as a harness false negative, not a product defect.
