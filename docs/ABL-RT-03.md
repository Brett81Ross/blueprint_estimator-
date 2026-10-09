# ABL-RT-03 — Pricing Integrity + Estimate Evidence Batch

Status: IN PROGRESS — NO DEPLOYMENT AUTHORIZED

Branch: dev-rt-abl-03
Baseline production SHA: 70d5bd5392f01c4a57ec52f638b4a13673fe9cee
Rollback SHA from prior release: ab0927c30f2f0ac1a8ffa33acb5f2dcf999814f0
Production version: v0.3.0

## North star
Rapid Takeoff may estimate quantities from supported drawing evidence, but it must never make unsupported market pricing look like a contractor-grade estimate. Quantity confidence and pricing confidence are separate evidence layers.

## Implemented in this batch
- [x] Centralized the analysis protocol in lib/analysis-prompt.ts so pricing rules are directly testable.
- [x] Added explicit Pricing Authority state for user-supplied labor rate and material/unit-price basis.
- [x] Forbid standard-industry, typical, average, regional, national, catalog, retail, supplier, RSMeans-like, or other inferred market pricing when not supplied.
- [x] Location is context only and never authorizes a price lookup/guess.
- [x] Material costs without supported unit pricing must report: UNPRICED — pricing basis not supplied.
- [x] Labor costs without a user-supplied labor rate must report: UNPRICED — labor rate not supplied.
- [x] Productivity assumptions may support estimated labor hours when useful, but may not be labeled VERIFIED.
- [x] Grand-total dollar estimates are prohibited unless every included major dollar component has a supported basis.
- [x] Every dollar amount must identify its pricing Basis.
- [x] Added Cost / Unit Price Basis field to the contractor UI.
- [x] Added explicit UI copy explaining that blank pricing is not guessed.
- [x] Added UNPRICED count/status to the Rapid Review Console.
- [x] Added UNPRICED report highlighting.
- [x] Added analysis-prompt regression tests.
- [x] Added pricing-guardrail suite to standard Rapid Takeoff CI.
- [x] Extended the known-answer production harness so no-price fixtures must contain UNPRICED and must contain no dollar amounts.

## Release gates
- [ ] Final branch QA: typecheck.
- [ ] Firewall/security suite.
- [ ] Project-input suite.
- [ ] Neon executor regression suite.
- [ ] Analysis-prompt pricing guardrail suite.
- [ ] Next.js production build.
- [ ] Preserve zero Vercel preview deployments.
- [ ] Explicit owner approval before production merge/deploy.
- [ ] After deployment only: rerun Concrete, Painter, and Plumbing known-answer fixtures.
- [ ] After deployment only: each no-price fixture must remain quantity-correct, show UNPRICED, and contain no invented dollar amounts.
- [ ] Verify new production Neon reservations reach provider start and success.

## Deferred / next candidates
- Long-report export beyond mailto.
- Lifetime Pro recovery across device/browser loss.
- Saved jobs/projects workflow.
- Physical Galaxy Z Fold folded/unfolded QA plus standard Android/iOS viewport QA.
- NativeInstall/SplashGate disposition.
