import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PROVIDER_ATTEMPT_TIMEOUT_MS,
  PROVIDER_MAX_ATTEMPTS,
  PROVIDER_MAX_WAIT_BUDGET_MS,
  providerErrorStatus,
  providerRetryReason,
  withTransientProviderRetry,
} from '../lib/provider-retry'

const statusError = (message: string, status: number) => {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

test('provider retry budget stays below the 60-second function ceiling', () => {
  assert.equal(PROVIDER_ATTEMPT_TIMEOUT_MS, 16_000)
  assert.equal(PROVIDER_MAX_ATTEMPTS, 3)
  assert.equal(PROVIDER_MAX_WAIT_BUDGET_MS, 51_500)
  assert.ok(PROVIDER_MAX_WAIT_BUDGET_MS < 60_000)
})

test('reads provider status fields and classifies 503/504 as transient unavailable', () => {
  assert.equal(providerErrorStatus({ status: 503 }), 503)
  assert.equal(providerErrorStatus({ statusCode: '503' }), 503)
  assert.equal(providerRetryReason({ status: 503 }), 'provider_503')
  assert.equal(providerErrorStatus({ status: 504 }), 504)
  assert.equal(providerRetryReason({ status: 504 }), 'provider_503')
  assert.equal(providerErrorStatus(null), undefined)
})

test('classifies SDK abort and timeout failures as retryable timeouts', () => {
  assert.equal(
    providerRetryReason({ name: 'GoogleGenerativeAIAbortError', message: 'This operation was aborted' }),
    'timeout'
  )
  assert.equal(
    providerRetryReason({ name: 'Error', message: 'Provider request timed out' }),
    'timeout'
  )
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

test('recovers after an SDK timeout', async () => {
  let attempts = 0
  const reasons: string[] = []

  const value = await withTransientProviderRetry(async () => {
    attempts += 1
    if (attempts === 1) {
      const error = new Error('This operation was aborted')
      error.name = 'GoogleGenerativeAIAbortError'
      throw error
    }
    return 'recovered'
  }, {
    sleep: async () => {},
    onRetry: input => reasons.push(input.reason),
  })

  assert.equal(value, 'recovered')
  assert.equal(attempts, 2)
  assert.deepEqual(reasons, ['timeout'])
})

test('does not retry a 429 response', async () => {
  let attempts = 0

  await assert.rejects(() => withTransientProviderRetry(async () => {
    attempts += 1
    throw statusError('provider limit', 429)
  }, { sleep: async () => {} }))

  assert.equal(attempts, 1)
})

test('stops after three timeout attempts', async () => {
  let attempts = 0

  await assert.rejects(() => withTransientProviderRetry(async () => {
    attempts += 1
    const error = new Error('request timeout')
    error.name = 'GoogleGenerativeAIAbortError'
    throw error
  }, {
    maxAttempts: 3,
    sleep: async () => {},
  }))

  assert.equal(attempts, 3)
})


test('recovers after a transient 504 response', async () => {
  let attempts = 0
  const value = await withTransientProviderRetry(async () => {
    attempts += 1
    if (attempts === 1) throw statusError('gateway timeout', 504)
    return 'recovered'
  }, { sleep: async () => {} })

  assert.equal(value, 'recovered')
  assert.equal(attempts, 2)
})
