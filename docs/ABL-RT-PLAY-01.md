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
- Content-Length rejection before multipart parsing when the header is present.
- Temporary fail-closed RAPID_ANALYSIS_ENABLED gate before multipart parsing.
- Missing Gemini key fails closed.
- Backend exception details are no longer returned to clients.
- RAPID_ACCESS_SECRET no longer falls back to GEMINI_API_KEY.

## Deliberately not claimed complete
- RAPID_ANALYSIS_ENABLED is NOT the final kill switch because changing an environment variable may require deployment/restart behavior. The release requires a durable runtime-readable flag.
- Durable quota/rate-limit storage is not implemented yet.
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
