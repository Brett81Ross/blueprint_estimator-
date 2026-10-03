# ABL-RT-PLAY-01 — Batch 0 Firewall

Status: DEVELOPMENT ONLY — NOT AUTHORIZED FOR PRODUCTION

Baseline: main @ 617ca5fd174ee4ac44c1268e6b4e608cf6b33965 (Rapid Takeoff v0.3.0)
Branch: dev/rt-play-batch0-firewall

## Locked scope
1. Upload validation before expensive work.
2. Analysis authorization/quota enforcement before multipart parsing.
3. Layered abuse controls: user/session, IP, daily IP, global daily.
4. Durable fail-closed kill switch checked before Gemini.
5. Minimal security/usage logging without file contents or raw IP retention.
6. Cost instrumentation sufficient to calibrate real limits.

## Immediate mitigation already completed outside code
The dedicated Google AI key identified as blueprint_estimator_key was revoked by the owner. Do not reuse the deleted credential.

## Implemented in branch
- Bounded file count, per-file bytes, total bytes, and MIME allow-list.
- Default upload envelope is 4 MiB total/per-file plus at most 256 KiB multipart framing, intentionally below Vercel's documented 4.5 MB Function request payload ceiling. Larger-document architecture must use a different upload path rather than raising this route above the host limit.
- Content-Length rejection before multipart parsing when the header is present.
- Temporary fail-closed RAPID_ANALYSIS_ENABLED gate before multipart parsing.
- Missing Gemini key fails closed.
- Backend exception details are no longer returned to clients or dumped wholesale into server logs.
- Provider 429/503 responses are generic and non-cacheable; they do not make unapproved Free-tier/product-policy claims.
- Model-input boundary treats uploaded document text/filenames as untrusted evidence rather than instructions; document labels and project-context form fields are normalized and bounded before entering the model prompt.
- RAPID_ACCESS_SECRET no longer falls back to GEMINI_API_KEY.

## Deliberately not claimed complete
- RAPID_ANALYSIS_ENABLED is NOT the final kill switch because changing an environment variable may require deployment/restart behavior. The release requires a durable runtime-readable flag.
- Durable quota/rate-limit storage is not implemented yet. A fail-closed AnalysisPolicyStore interface now defines the runtime boundary; no existing CactusByte database is assumed or modified.
- No arbitrary Free/Pro quotas are approved yet.
- No replacement Gemini key has been created or installed.
- No production environment variables have been changed.
- No production deployment has occurred.

## Compatibility item
Existing Pro cookies may have been signed with the legacy GEMINI_API_KEY fallback. Before release, establish RAPID_ACCESS_SECRET and define a migration path so legitimate lifetime access is not silently lost.

## Release gates
- Durable store selected and isolated for Rapid Takeoff.
- Kill switch fails closed and is fire-drilled.
- Layered quota/rate controls verified.
- Rejection logging verified without sensitive file contents/raw IP.
- Upload guard tests pass.
- Build/lint pass.
- Rollback path verified.
- Explicit owner approval before production deployment.

## Durable policy invariants
- Authorization/quota reservation occurs before multipart body parsing.
- Runtime kill switch is read from durable storage as part of reservation.
- Store failure rejects analysis; it never fails open.
- Two atomic reservations are required: Stage 1 admission before multipart parsing (kill switch + IP burst + attempt insert), then Stage 2 provider usage immediately before Gemini (kill switch re-check + subject/IP/global daily limits + provider_started mark in the same transaction). This prevents concurrent requests racing past daily limits.
- Global kill switch is manual-recovery by default; in-flight provider calls are allowed to finish.
- Raw IP addresses and file contents are not persisted in rejection logs.
- Hashing uses a dedicated RAPID_LOG_HASH_SECRET.
- Rejection logs retain reason, stable privacy hash, truncated user agent, and content length only at the pre-parse stage.
- Uploads rejected during parsing/validation are marked client_rejected and do not consume provider-backed daily usage, while still contributing to burst-abuse protection.
- A Stage 2 kill-switch/quota denial finalizes its existing attempt reservation as policy_rejected atomically; it must not leave an ambiguous pending reservation.
- Provider token/cost fields are recorded only when authoritative usage metadata is available; no fabricated dollar estimate.

## Identity model
Rapid Takeoff currently has no account login. Batch 0 therefore does not pretend Free traffic has authenticated user identity.
- Free: signed anonymous subject cookie, hashed before durable logging/counting.
- Pro: existing verified Pro entitlement plus the same signed subject identity.
- IP: separately privacy-hashed and used only as an abuse-control dimension.
- Global: independent daily ceiling across all subjects/IPs.
Deleting cookies cannot bypass IP/global controls; changing IP cannot bypass subject/global controls.

## Reference persistence design
docs/rapid-policy-schema.sql is design-only and has NOT been applied to any database.
The final store must provide the documented two-stage atomic reservation flow so concurrent serverless requests cannot race past the limits. Quota thresholds have one source of truth: explicit RAPID_* environment configuration; durable runtime control owns the live kill switch only.
