-- Rapid Takeoff Batch 0 policy-store reference schema.
-- DESIGN ONLY. Do not apply to any database until a Rapid Takeoff-specific store is approved.

create table if not exists rapid_runtime_control (
  singleton boolean primary key default true check (singleton),
  analysis_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists rapid_analysis_reservations (
  id uuid primary key,
  subject_hash text not null,
  ip_hash text not null,
  plan text not null check (plan in ('free','pro')),
  day_utc date not null,
  created_at timestamptz not null default now(),
  provider_started_at timestamptz,
  outcome text check (outcome in ('success','provider_error','server_error','client_rejected')),
  input_tokens bigint,
  output_tokens bigint
);

create index if not exists rapid_analysis_subject_day_idx
  on rapid_analysis_reservations (subject_hash, day_utc);
create index if not exists rapid_analysis_ip_day_idx
  on rapid_analysis_reservations (ip_hash, day_utc);
create index if not exists rapid_analysis_created_idx
  on rapid_analysis_reservations (created_at);

create table if not exists rapid_security_rejections (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  reason text not null,
  ip_hash text not null,
  subject_hash text not null,
  user_agent text,
  content_length bigint
);

-- The implementation uses TWO atomic transactions so concurrent requests cannot all pass
-- a daily provider limit before any one of them is marked provider-started.
--
-- Stage 1: reserveAdmission, BEFORE multipart parsing:
-- 1) SELECT runtime control FOR UPDATE and reject if disabled.
-- 2) Count ALL recent reservations for IP burst protection.
-- 3) Reject when the approved burst threshold is exceeded.
-- 4) Insert one attempt reservation before returning ALLOW.
--
-- Stage 2: reserveProviderUsage, AFTER upload validation and IMMEDIATELY BEFORE Gemini:
-- 1) Lock runtime control again and reject if disabled.
-- 2) Lock the reservation and verify it belongs to the same subject/IP/plan and is not started.
-- 3) Count provider-started reservations for subject/day, IP/day, and global/day.
-- 4) Reject when any approved daily threshold is reached.
-- 5) Set provider_started_at in this SAME transaction before returning ALLOW.
--
-- If upload validation fails between stages, record client_rejected. It still counts for burst
-- abuse protection but never consumes provider-backed daily usage.
--
-- Threshold values come from explicit RAPID_* environment configuration. The durable runtime
-- table owns the kill switch only, avoiding two competing sources of truth for quota limits.
