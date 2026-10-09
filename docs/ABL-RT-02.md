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
