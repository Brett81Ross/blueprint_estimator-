# ABL-RT-11 — Fixture Assertion Hardening

Status: DEVELOPMENT — NO PRODUCTION DEPLOYMENT AUTHORIZED

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
