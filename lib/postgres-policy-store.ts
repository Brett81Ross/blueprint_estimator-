import { randomUUID } from 'node:crypto'
import type { AdmissionDecision, AnalysisIdentity, AnalysisPolicyStore, PolicyLimits, ProviderUsageDecision } from './analysis-policy'

export type SqlQuery = <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<{ rows: T[] }>
export type SqlExecutor = { transaction<T>(work: (sql: SqlQuery) => Promise<T>): Promise<T> }

type RuntimeRow = { analysis_enabled: boolean }
type ReservationRow = { id: string; subject_hash: string; ip_hash: string; plan: 'free' | 'pro'; provider_started_at: Date | string | null }

const utcDay = (now: Date) => now.toISOString().slice(0, 10)

export function postgresPolicyStore(db: SqlExecutor): AnalysisPolicyStore {
  return {
    async reserveAdmission(input: AnalysisIdentity, limits: PolicyLimits): Promise<AdmissionDecision> {
      return db.transaction(async (sql) => {
        const control = await sql<RuntimeRow>('select analysis_enabled from rapid_runtime_control where singleton = true for update')
        if (control.rows.length !== 1 || control.rows[0].analysis_enabled !== true) return { allowed: false, status: 503, reason: 'analysis_disabled' }

        const burst = await sql<{ count: string }>(
          `select count(*)::text as count from rapid_analysis_reservations
           where ip_hash = $1 and created_at >= $2::timestamptz - ($3::text || ' seconds')::interval`,
          [input.ipHash, input.now.toISOString(), limits.ipBurstWindowSeconds]
        )
        if (Number(burst.rows[0]?.count || 0) >= limits.ipBurst) return { allowed: false, status: 429, reason: 'ip_burst_limit' }

        const reservationId = randomUUID()
        await sql(
          `insert into rapid_analysis_reservations (id, subject_hash, ip_hash, plan, day_utc, created_at)
           values ($1, $2, $3, $4, $5::date, $6::timestamptz)`,
          [reservationId, input.subjectHash, input.ipHash, input.plan, utcDay(input.now), input.now.toISOString()]
        )
        return { allowed: true, reservationId }
      })
    },

    async reserveProviderUsage(reservationId: string, input: AnalysisIdentity, limits: PolicyLimits): Promise<ProviderUsageDecision> {
      return db.transaction(async (sql) => {
        const control = await sql<RuntimeRow>('select analysis_enabled from rapid_runtime_control where singleton = true for update')
        const reservation = await sql<ReservationRow>(
          'select id, subject_hash, ip_hash, plan, provider_started_at from rapid_analysis_reservations where id = $1 for update',
          [reservationId]
        )
        const row = reservation.rows[0]
        if (!row || row.subject_hash !== input.subjectHash || row.ip_hash !== input.ipHash || row.plan !== input.plan || row.provider_started_at) {
          return { allowed: false, status: 503, reason: 'invalid_reservation' }
        }

        if (control.rows.length !== 1 || control.rows[0].analysis_enabled !== true) {
          await sql("update rapid_analysis_reservations set outcome = 'policy_rejected' where id = $1 and provider_started_at is null", [reservationId])
          return { allowed: false, status: 503, reason: 'analysis_disabled' }
        }

        const subjectLimit = input.plan === 'pro' ? limits.proDaily : limits.freeDaily
        const counts = await sql<{ subject_count: string; ip_count: string; global_count: string }>(
          `select count(*) filter (where subject_hash = $1)::text as subject_count,
                  count(*) filter (where ip_hash = $2)::text as ip_count,
                  count(*)::text as global_count
             from rapid_analysis_reservations
            where day_utc = $3::date and provider_started_at is not null`,
          [input.subjectHash, input.ipHash, utcDay(input.now)]
        )
        const current = counts.rows[0] || { subject_count: '0', ip_count: '0', global_count: '0' }
        let reason: string | undefined
        if (Number(current.subject_count) >= subjectLimit) reason = 'subject_daily_limit'
        else if (Number(current.ip_count) >= limits.ipDaily) reason = 'ip_daily_limit'
        else if (Number(current.global_count) >= limits.globalDaily) reason = 'global_daily_limit'

        if (reason) {
          await sql("update rapid_analysis_reservations set outcome = 'policy_rejected' where id = $1 and provider_started_at is null", [reservationId])
          return { allowed: false, status: 429, reason }
        }

        await sql('update rapid_analysis_reservations set provider_started_at = $2::timestamptz where id = $1 and provider_started_at is null', [reservationId, input.now.toISOString()])
        return { allowed: true }
      })
    },

    async recordResult(input) {
      await db.transaction(async (sql) => {
        await sql('update rapid_analysis_reservations set outcome = $2, input_tokens = $3, output_tokens = $4 where id = $1',
          [input.reservationId, input.outcome, input.inputTokens ?? null, input.outputTokens ?? null])
      })
    },

    async logRejection(input) {
      await db.transaction(async (sql) => {
        await sql('insert into rapid_security_rejections (reason, ip_hash, subject_hash, user_agent, content_length) values ($1, $2, $3, $4, $5)',
          [input.reason, input.ipHash, input.subjectHash, input.userAgent ?? null, input.contentLength ?? null])
      })
    },
  }
}
