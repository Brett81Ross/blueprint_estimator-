# ABL-RT-10 Hotfix — Provider HTTP 504 Failover

Status: DEVELOPMENT — NO PRODUCTION DEPLOYMENT AUTHORIZED

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
