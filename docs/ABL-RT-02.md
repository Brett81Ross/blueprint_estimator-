# ABL-RT-02 — Rapid Takeoff Product + Engine QA Batch

Status: IN PROGRESS — NO DEPLOYMENT AUTHORIZED

Branch: dev-rt-abl-02
Baseline: main @ ab0927c30f2f0ac1a8ffa33acb5f2dcf999814f0
Production: Rapid Takeoff v0.3.0

## Verified current state — 2026-10-08
- Production homepage responds successfully and displays Rapid Takeoff v0.3.0.
- Expanded trade selector is live with 37 trade choices.
- Rapid Matrix Engine, ProofTrace, SheetLink, Conflict Radar, and Confidence Matrix UI/report flow are present.
- Free/Pro coupon UI and /api/access endpoint are live.
- Dedicated Rapid Takeoff Neon policy database is connected.
- rapid_runtime_control.analysis_enabled is currently true.
- Production Rapid Takeoff environment configuration includes the isolated database, signed subject identity, privacy hash secret, dedicated Pro signing secret, abuse/usage caps, and Gemini API configuration.
- Vercel reported no grouped runtime errors in the prior 7-day window checked during this QA pass.
- Hardened analysis policy ledger currently contains zero recorded analysis reservations, so the hardened AI path is configured but still needs a representative end-to-end takeoff QA run.
- Preview deployments are disabled for the Vercel project so development-branch commits do not consume preview deployment quota.

## Atomic build candidates
1. Reconcile stale ABL-RT-PLAY-01 checkpoint text with the current production/infrastructure state without erasing its historical checkpoint value.
2. Preserve and regression-test all 37 current construction trades.
3. Make required project fields trade-aware. Ceiling height must not block trades where it is irrelevant, including excavation, landscaping, roofing, crane/heavy-equipment, hauling, and similar scopes.
4. Improve drawing-scale handling: add Auto Detect / Unknown and support mixed/per-sheet scale instead of assuming one project-wide scale.
5. Fix upload UX for PDFs: the current UI treats every selected file as an image preview even though PDFs are valid backend inputs.
6. Restrict the file picker to supported types in the UI: PDF, JPEG, PNG, WebP.
7. Show upload limits before submission: maximum file count, per-file size, and combined upload envelope.
8. Add a clear per-file upload card with filename, type, size, remove control, and image thumbnail only when appropriate.
9. Add Settings required by CactusByte app standards.
10. Add Share control plus Rapid Takeoff-branded QR sharing flow.
11. Make the Cactus🌵Byte Studios™ footer text tappable to the CactusByte Studios app/site.
12. Review unused NativeInstall and SplashGate components. Either intentionally wire them into the current product flow or remove dead code; do not change behavior until the intended flow is approved.
13. Generalize CI. Current firewall QA workflow watches only the legacy dev/rt-play-batch0-firewall branch; future QA must cover the active development branch and release candidate without causing Vercel previews.
14. Add hardened-path end-to-end QA using representative, legally reusable construction plans across multiple trades.
15. Verify engine behavior when scale/dimensions are missing: it must lower confidence rather than invent quantities.
16. Verify ProofTrace source locators, SheetLink reconciliation, Conflict Radar distinctions, and Confidence Matrix classifications against known plan facts.
17. Verify rate-limit / quota outcomes and policy ledger recording under controlled QA without burning provider calls unnecessarily.
18. Strengthen lifetime Pro recovery. Current entitlement is primarily represented by a long-lived device/browser cookie; define a safe recovery path for cleared browser data or device replacement.
19. Replace or supplement mailto report export for long reports, since large generated reports can exceed practical mailto/client limits.
20. Add saved-project/job workflow as a future monetization-ready capability, but keep it outside the current release unless explicitly approved.
21. Run responsive QA on Galaxy Z Fold folded/unfolded plus regular Android and iOS-sized layouts before release.
22. Keep v0.3.0 during development; bump version only when this atomic release scope is locked.
23. No Vercel production deployment until owner approval.

## Current release gate
Do not deploy. Continue accumulating, implementing, and QA-validating approved ABL items on dev-rt-abl-02. Before production release: typecheck, firewall tests, build, UI smoke test, representative takeoff test, policy ledger verification, rollback SHA capture, and explicit owner approval.


## Implementation checkpoint — 2026-10-08

Completed on dev-rt-abl-02:
- [x] Centralized the 37-trade catalog and scale/input policy in lib/project-inputs.ts.
- [x] Made ceiling-height validation trade-aware so exterior/site/equipment/hauling scopes are not universally blocked.
- [x] Added Auto Detect / Mixed Sheets and Unknown / Not Provided scale workflows.
- [x] Passed Number of Floors through the analyzer route; it was previously collected in the UI but ignored by the model context.
- [x] Added explicit mixed-sheet/unknown-scale instructions so the engine lowers confidence instead of assuming one project-wide scale.
- [x] Restricted upload pickers to PDF, JPEG, PNG, and WebP.
- [x] Added client-side upload-envelope checks after image compression.
- [x] Replaced broken PDF image previews with typed file cards showing filename, format, size, and remove control.
- [x] Fixed object-URL lifecycle handling for image previews.
- [x] Added device-local Settings for default trade, project type, and scale handling.
- [x] Added Share with native share fallback, copy-link support, and an on-brand Rapid Takeoff QR card generated locally in the browser.
- [x] Made the Cactus🌵Byte Studios™ footer link open the CactusByte Studios app/site.
- [x] Generalized GitHub QA to active Rapid Takeoff development branches and pull requests to main.
- [x] Added project-input regression tests for trade count, trade-aware ceiling rules, scale modes, and upload limits.
- [x] Disabled Vercel preview deployments for the project so development-branch work does not consume preview deployment quota.
- [x] Added CI paths-ignore for documentation-only changes to avoid wasting Actions minutes.
- [x] Full branch QA passed after implementation: TypeScript, firewall tests, project-input tests, and Next.js production build.

Still pending in this ABL:
- [ ] Reconcile the historical ABL-RT-PLAY-01 checkpoint with current production state without rewriting history.
- [ ] Run representative end-to-end blueprint takeoff QA across multiple trades on the hardened production path.
- [ ] Validate ProofTrace, SheetLink, Conflict Radar, and Confidence Matrix output against known plan facts.
- [ ] Verify controlled quota/policy ledger recording with real analysis traffic.
- [ ] Define lifetime-Pro recovery across cleared browser data or device replacement.
- [ ] Improve long-report export beyond mailto.
- [ ] Decide whether saved projects/jobs belongs in this release or a later monetization batch.
- [ ] Run physical responsive QA on Galaxy Z Fold folded/unfolded plus standard Android/iOS viewport sizes.
- [ ] Review NativeInstall.tsx and SplashGate.tsx intent before wiring or deleting them.
- [ ] Capture final rollback SHA and bump version only after release scope is locked.
- [ ] No production deployment until explicit owner approval.


## Hardened-path failure discovery — 2026-10-08

Controlled production QA fixtures:
- Concrete C-01 known answer: 600 SF slab, approximately 7.41 CY.
- Painter P-01 known answer: 715 SF net painted wall area.
- Plumbing PL-01 known answer: 4 fixtures with plan/schedule reconciliation and no double-counting.

Observed production result before provider execution:
- All three /api/analyze requests returned HTTP 500.
- Neon recorded three Stage-1 admission reservations.
- All three had provider_started_at = null and outcome = null.
- No security rejection rows were created.
- Therefore the failure occurred after durable admission and before Gemini provider start.

Root cause:
- neonPolicyExecutor() created one Pool when the policy store was constructed.
- reserveAdmission() completed its transaction and called pool.end().
- reserveProviderUsage() then attempted a second transaction using that already-ended Pool.
- The request therefore failed before Gemini, and the older executor could not reliably record the terminal outcome either.

Development fix:
- [x] neonPolicyExecutor now creates and closes a fresh Pool for each transaction.
- [x] Added a regression test proving two sequential policy transactions both succeed and use separate pools.
- [x] Added rollback/cleanup regression coverage.
- [x] Added the executor regression test to the standard Rapid Takeoff QA gate.
- [ ] The fix is NOT deployed. Production remains v0.3.0 on the prior main SHA.
- [ ] Known-answer fixture QA must be rerun only after an explicitly approved production deployment of the fix.


## Production release verification — 2026-10-08

Release authorization received and PR #4 merged to main.

Production release:
- Merge SHA: 70d5bd5392f01c4a57ec52f638b4a13673fe9cee
- Vercel deployment: dpl_9a68EStcQrLrFgrRrDuP3KY2gGJ7
- Public alias: https://blueprint-estimator.vercel.app
- Deployment state: READY
- Rollback SHA preserved: ab0927c30f2f0ac1a8ffa33acb5f2dcf999814f0

Known-answer production rerun after the Neon pool lifecycle fix:
- [x] Concrete C-01 returned HTTP 200 and correctly identified 600 SF slab area.
- [x] Concrete C-01 correctly calculated approximately 7.41 CY.
- [x] Painter P-01 returned HTTP 200 and correctly identified 715 SF net painted wall area.
- [x] Plumbing PL-01 returned HTTP 200 and correctly identified four fixtures.
- [x] Plumbing PL-01 correctly reconciled plan + fixture schedule without double-counting to eight.
- [x] All three new Neon reservations recorded provider_started_at.
- [x] All three new reservations recorded outcome = success.
- [x] ProofTrace sources matched the controlled fixture sheet/notes.
- [x] SheetLink reconciliations matched known fixture facts.
- [x] Conflict Radar distinguished no verified conflicts from missing-scope/RFI risks.
- [x] Confidence Matrix kept missing piping/specification data in NEEDS REVIEW instead of fabricating quantities.

Release result:
- Stage-2 hardened analysis path is operational in production.
- Controlled known-answer takeoff gate passed 5/5 quantity assertions.
- The prior three pre-fix stuck reservations remain preserved as historical failure evidence.

Next accuracy guardrail:
- [ ] Tighten cost/labor basis behavior so absent user/project pricing does not produce market-like numbers without an explicit UNVERIFIED ASSUMPTION/allowance treatment and source/date/location basis.
