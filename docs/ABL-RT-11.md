# ABL-RT-11 — Fixture Assertion Hardening

Status: READY FOR RELEASE REVIEW — NO PRODUCTION DEPLOYMENT AUTHORIZED

Baseline production: 60ca1e943c9f6c9ff35fe0231bff49dadc80ed8d

RT-10 live verification produced correct General Contractor output but the QA harness marked one assertion false because Gemini formatted the count as `$4$ fixtures total`.

The actual report contained:
- four fixture line items, one each for WC-1, LAV-1, SH-1, KS-1;
- `Plumbing Fixtures ... | 4 EA`;
- SheetLink™ confirmation that the plan matched the four-row fixture schedule;
- no eight-fixture double count.

## Changes

- [x] Centralize four/eight plumbing fixture count regexes.
- [x] Accept plain counts and Markdown/LaTeX-wrapped numeric counts.
- [x] Apply the hardened regex to both standalone plumbing and General Contractor fixture assertions.
- [x] Harden the negative eight-fixture guard so `$8$ fixtures` cannot evade detection.
- [x] Add deterministic Node tests for the fixture patterns.
- [x] Add fixture-pattern tests to normal branch/PR QA.

No production app behavior changes. No deploy in this batch.


## Final branch QA

Run: https://github.com/Brett81Ross/blueprint_estimator-/actions/runs/38338389231

- [x] Typecheck.
- [x] Firewall/security tests.
- [x] Project-input tests.
- [x] Neon executor regression tests.
- [x] Postgres policy-store regression tests.
- [x] Analysis prompt/pricing guardrail tests.
- [x] Provider retry/timeout regression tests.
- [x] Provider model-router tests.
- [x] Pricing output guard tests.
- [x] Analysis error contract tests.
- [x] Provider cooldown tests.
- [x] Version consistency tests.
- [x] New engine fixture pattern tests.
- [x] Next.js production build.

Production remains on 60ca1e943c9f6c9ff35fe0231bff49dadc80ed8d. No RT-11 deployment occurred.
