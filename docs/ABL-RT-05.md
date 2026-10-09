# ABL-RT-05 — Pricing Output Integrity Hotfix

Status: READY FOR RELEASE REVIEW — NO PRODUCTION DEPLOYMENT AUTHORIZED

Branch: dev-rt-abl-05
Production baseline: 00855c3634d4569fcfdcc28f2de9d1dd0c9325b7
Previous production rollback candidate: b580127e242bdf39e06f8e0626d5c9dca4de09e2

## Why this hotfix exists

Post-release ABL-RT-04 fixture verification showed the provider path was healthy and all three controlled analyses completed successfully. The first QA run also exposed brittle report-format assertions, which were corrected.

After the QA correction:
- Concrete quantity assertions passed.
- Painter quantity assertions passed.
- Plumbing fixture count / no-double-count assertions passed.
- All cases reported UNPRICED where no cost basis was supplied.
- Plumbing still emitted $0.00 placeholders in cost cells whose same rows explicitly said UNPRICED / pricing basis not supplied.

That $0.00 behavior is a real pricing-integrity violation even though the report labels the rows unpriced.

## Implemented

- [x] Corrected known-answer quantity assertions to accept structured Markdown table cells.
- [x] Restricted currency checks to the Detailed Cost Breakdown section so dimensional LaTeX is not misclassified as pricing.
- [x] Added lib/pricing-output-guard.ts.
- [x] API now applies the pricing output guard before returning a provider report.
- [x] Currency amounts on lines explicitly marked UNPRICED, pricing basis not supplied, or labor rate not supplied are replaced with literal UNPRICED.
- [x] Legitimately priced rows with a real source/basis remain untouched.
- [x] Added prompt rule explicitly forbidding $0 / $0.00 placeholders for unpriced rows.
- [x] Detailed Cost Breakdown instructions now require Unit Price/Rate and Cost cells both say UNPRICED when basis is absent.
- [x] Added pricing-output regression tests.
- [x] Added the pricing-output guard suite to standard Rapid Takeoff CI.
- [x] Removed the temporary RT-04 production recheck workflow after diagnosis.

## Final QA

Run: https://github.com/Brett81Ross/blueprint_estimator-/actions/runs/37927502973

- [x] Typecheck.
- [x] Firewall/security tests.
- [x] Project-input tests.
- [x] Neon executor regression tests.
- [x] Analysis prompt / pricing guardrail tests.
- [x] Provider retry regression tests.
- [x] Pricing output guard tests.
- [x] Next.js production build.

## Release gate

Do not merge/deploy until explicit owner approval.

After any approved deployment:
1. Confirm exact production SHA through /api/build-info.
2. Run the controlled Concrete/Painter/Plumbing production fixture gate.
3. Confirm quantity assertions.
4. Confirm UNPRICED behavior.
5. Confirm zero unsupported currency amounts in Detailed Cost Breakdown.
6. Confirm Neon reservations reach provider_started_at and success.
