import assert from 'node:assert/strict'
import test from 'node:test'
import { providerErrorStatus, withTransientProviderRetry } from '../lib/provider-retry'

const statusError = (message: string, status: number) => {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

test('reads provider status fields', () => {
  assert.equal(providerErrorStatus({ status: 503 }), 503)
  assert.equal(providerErrorStatus({ statusCode: '503' }), 503)
  assert.equal(providerErrorStatus(null), undefined)
})

test('returns immediately on success', async () => {
  let attempts = 0
  const value = await withTransientProviderRetry(async () => {
    attempts += 1
    return 'ok'
  }, { sleep: async () => {} })

  assert.equal(value, 'ok')
  assert.equal(attempts, 1)
})

test('recovers after two transient 503 responses', async () => {
  let attempts = 0
  const sleeps: number[] = []

  const value = await withTransientProviderRetry(async () => {
    attempts += 1
    if (attempts < 3) throw statusError('temporary provider failure', 503)
    return 'recovered'
  }, {
    maxAttempts: 3,
    delaysMs: [1000, 2500],
    sleep: async ms => { sleeps.push(ms) },
  })

  assert.equal(value, 'recovered')
  assert.equal(attempts, 3)
  assert.deepEqual(sleeps, [1000, 2500])
})

test('does not retry a 429 response', async () => {
  let attempts = 0

  await assert.rejects(() => withTransientProviderRetry(async () => {
    attempts += 1
    throw statusError('provider limit', 429)
  }, { sleep: async () => {} }))

  assert.equal(attempts, 1)
})

test('stops after three 503 attempts', async () => {
  let attempts = 0

  await assert.rejects(() => withTransientProviderRetry(async () => {
    attempts += 1
    throw statusError('provider unavailable', 503)
  }, {
    maxAttempts: 3,
    sleep: async () => {},
  }))

  assert.equal(attempts, 3)
})
