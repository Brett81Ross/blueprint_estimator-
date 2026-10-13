import assert from 'node:assert/strict'
import test from 'node:test'
import {
  STALE_RESERVATION_AFTER_MS,
  postgresPolicyStore,
  staleReservationCutoff,
  type SqlExecutor,
} from '../lib/postgres-policy-store'

const limits = {
  freeDaily: 2,
  proDaily: 20,
  ipBurst: 3,
  ipBurstWindowSeconds: 60,
  ipDaily: 10,
  globalDaily: 100,
}

test('stale reservation cutoff stays safely beyond request runtime budget', () => {
  assert.equal(STALE_RESERVATION_AFTER_MS, 300_000)
  const now = new Date('2026-10-12T12:00:00.000Z')
  assert.equal(staleReservationCutoff(now).toISOString(), '2026-10-12T11:55:00.000Z')
})

test('admission terminalizes only old null-outcome reservations before burst accounting', async () => {
  const statements: Array<{ text: string; params?: unknown[] }> = []
  const db: SqlExecutor = {
    async transaction(work) {
      return work(async (text, params) => {
        statements.push({ text, params })
        if (text.includes('select analysis_enabled')) return { rows: [{ analysis_enabled: true }] } as any
        if (text.includes('select count(*)::text as count')) return { rows: [{ count: '0' }] } as any
        return { rows: [] } as any
      })
    },
  }

  const store = postgresPolicyStore(db)
  const decision = await store.reserveAdmission({
    plan: 'free',
    subjectHash: 'subject',
    ipHash: 'ip',
    now: new Date('2026-10-12T12:00:00.000Z'),
  }, limits)

  assert.equal(decision.allowed, true)
  const cleanup = statements.find(statement =>
    statement.text.includes("set outcome = 'server_error'") &&
    statement.text.includes('outcome is null') &&
    statement.text.includes('created_at < $1::timestamptz')
  )
  assert.ok(cleanup)
  assert.deepEqual(cleanup?.params, ['2026-10-12T11:55:00.000Z'])

  const cleanupIndex = statements.indexOf(cleanup!)
  const burstIndex = statements.findIndex(statement => statement.text.includes('select count(*)::text as count'))
  assert.ok(cleanupIndex >= 0 && cleanupIndex < burstIndex)
})

test('recordResult cannot overwrite an already-terminal reservation', async () => {
  const statements: Array<{ text: string; params?: unknown[] }> = []
  const db: SqlExecutor = {
    async transaction(work) {
      return work(async (text, params) => {
        statements.push({ text, params })
        return { rows: [] } as any
      })
    },
  }

  const store = postgresPolicyStore(db)
  await store.recordResult({ reservationId: 'reservation', outcome: 'success' })

  assert.equal(statements.length, 1)
  assert.match(statements[0].text, /where id = \$1 and outcome is null/i)
  assert.deepEqual(statements[0].params, ['reservation', 'success', null, null])
})
