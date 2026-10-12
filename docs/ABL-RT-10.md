# ABL-RT-10 — Ledger Self-Healing + Expanded Contractor QA

Status: DEVELOPMENT — NO PRODUCTION DEPLOYMENT AUTHORIZED

Branch: dev-rt-abl-10
Production baseline: ef8b5428c2a1c3f26b70cfc4be177bf8cf69b640
Rollback candidate: c69841888acd0e6cfb82eb67df890a61f9d00050

## Why this batch exists

RT-09 restored reliable analysis through bounded Gemini model failover. The next priority is to remove old accounting ambiguity from pre-timeout releases and expand production known-answer coverage beyond three single-trade fixtures.

Production inspection before this batch found:
- 2 provider-started reservations with null outcome, both from 2026-10-10 before RT-06.
- 3 admission-only reservations with null outcome, also legacy rows.
- Current RT-09 requests terminalize correctly and produced three consecutive success outcomes.
- The existing database outcome constraint already provides server_error as a safe terminal state, so no schema migration is required.

## Implemented

### Reservation ledger self-healing
- [x] Terminalize null-outcome reservations older than five minutes as server_error during the next admission transaction.
- [x] Five-minute cutoff is far beyond the current 49-second provider route budget and Vercel 60-second ceiling.
- [x] Cleanup is idempotent because it only targets outcome IS NULL.
- [x] Cleanup covers both legacy provider-started and admission-only interrupted reservations.
- [x] recordResult now writes only while outcome IS NULL, preventing a late or duplicate result from overwriting a terminal ledger state.
- [x] No production schema migration.
- [x] No production data mutation during development.
- [x] Added deterministic policy-store regression coverage.

### Expanded production engine QA
- [x] Preserve Concrete known answer: 600 SF and ~7.41 CY.
- [x] Preserve Painter known answer: 715 SF.
- [x] Preserve Plumbing known answer: four fixtures, never eight.
- [x] Add General Contractor two-sheet fixture using concrete + plumbing plans.
- [x] General Contractor fixture checks both trade quantities without double-counting.
- [x] General Contractor fixture checks SheetLink and Conflict Radar presence.
- [x] General Contractor fixture supplies a controlled $145/CY concrete price and verifies legitimate user-supplied currency survives the pricing guard.
- [x] Unpriced components must still remain UNPRICED.
- [x] Successful fixture payloads must report an allowed providerModel.
- [x] QA artifacts now include machine-readable summary.json with PASS, FAIL_PRODUCT, BLOCKED_PROVIDER_CAPACITY, BLOCKED_PROVIDER_TEMPORARY, or FAIL_REQUEST classifications.
- [x] Per-attempt durations are recorded.

### Version reconciliation
- [x] Bump package/application/build-info version from 0.3.0 to 0.4.0.
- [x] Centralize displayed application version in lib/app-version.ts.
- [x] Add a package/application version consistency regression test.

## Release gate

Do not merge/deploy until the full branch and PR-specific QA gates pass and owner approves production.
