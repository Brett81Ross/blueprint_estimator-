-- Rapid Takeoff Batch 0 policy-store reference schema.
-- DESIGN ONLY. Do not apply to any database until a Rapid Takeoff-specific store is approved.

create table if not exists rapid_runtime_control (
  singleton boolean primary key default true check (singleton),
  analysis_enabled boolean not null default false,
  global_daily_limit integer not null check (global_daily_limit > 0),
  updated_at timestamptz not null default now()
);

create table if not exists rapid_analysis_reservations (
  id uuid primary key,
  subject_hash text not null,
  ip_hash text not null,
  plan text not null check (plan in ('free','pro')),
  day_utc date not null,
  created_at timestamptz not null default now(),
  outcome text check (outcome in ('success','provider_error','server_error')),
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

-- The implementation must reserve atomically in one transaction:
-- 1) SELECT runtime control FOR UPDATE and reject if disabled.
-- 2) Count subject/day, IP burst window, IP/day, and global/day.
-- 3) Reject when any approved threshold is exceeded.
-- 4) Insert one reservation before returning ALLOW.
-- Threshold values are intentionally not hard-coded here until product limits are approved.
