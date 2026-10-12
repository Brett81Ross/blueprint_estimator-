import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PROVIDER_FALLBACK_MODEL,
  PROVIDER_MODEL_ROUTE_MAX_WAIT_MS,
  PROVIDER_PRIMARY_MODEL,
  withProviderModelFallback,
} from '../lib/provider-model-router'

function providerError(status?: number, message = 'provider failure') {
  const error = new Error(message) as Error & { status?: number }
  if (status !== undefined) error.status = status
  return error
}

test('provider route budget stays under Vercel 60 second ceiling', () => {
  assert.equal(PROVIDER_MODEL_ROUTE_MAX_WAIT_MS, 49_000)
  assert.ok(PROVIDER_MODEL_ROUTE_MAX_WAIT_MS < 60_000)
})

test('primary model success does not call fallback', async () => {
  const calls: string[] = []
  const result = await withProviderModelFallback(async model => {
    calls.push(model)
    return 'ok'
  })
  assert.equal(result.value, 'ok')
  assert.equal(result.model, PROVIDER_PRIMARY_MODEL)
  assert.equal(result.usedFallback, false)
  assert.deepEqual(calls, [PROVIDER_PRIMARY_MODEL])
})

test('429 on primary falls back immediately', async () => {
  const calls: string[] = []
  const fallbackEvents: string[] = []
  const result = await withProviderModelFallback(async model => {
    calls.push(model)
    if (model === PROVIDER_PRIMARY_MODEL) throw providerError(429)
    return 'fallback-ok'
  }, {
    onFallback: event => fallbackEvents.push(`${event.from}->${event.to}`),
  })
  assert.equal(result.value, 'fallback-ok')
  assert.equal(result.model, PROVIDER_FALLBACK_MODEL)
  assert.equal(result.usedFallback, true)
  assert.deepEqual(calls, [PROVIDER_PRIMARY_MODEL, PROVIDER_FALLBACK_MODEL])
  assert.deepEqual(fallbackEvents, [`${PROVIDER_PRIMARY_MODEL}->${PROVIDER_FALLBACK_MODEL}`])
})

test('503 on primary falls back', async () => {
  let primaryCalls = 0
  let fallbackCalls = 0
  const result = await withProviderModelFallback(async model => {
    if (model === PROVIDER_PRIMARY_MODEL) {
      primaryCalls += 1
      throw providerError(503)
    }
    fallbackCalls += 1
    return 'fallback-ok'
  })
  assert.equal(primaryCalls, 1)
  assert.equal(fallbackCalls, 1)
  assert.equal(result.model, PROVIDER_FALLBACK_MODEL)
})

test('timeout on primary falls back', async () => {
  const result = await withProviderModelFallback(async model => {
    if (model === PROVIDER_PRIMARY_MODEL) throw new Error('request timed out')
    return 'fallback-ok'
  })
  assert.equal(result.model, PROVIDER_FALLBACK_MODEL)
})

test('non-transient primary error does not switch models', async () => {
  const calls: string[] = []
  await assert.rejects(
    withProviderModelFallback(async model => {
      calls.push(model)
      throw providerError(400)
    }),
    /provider failure/
  )
  assert.deepEqual(calls, [PROVIDER_PRIMARY_MODEL])
})

test('fallback retries once after a 503 and can recover', async () => {
  const calls: string[] = []
  const sleeps: number[] = []
  const retries: number[] = []
  const result = await withProviderModelFallback(async model => {
    calls.push(model)
    if (model === PROVIDER_PRIMARY_MODEL) throw providerError(429)
    if (calls.filter(value => value === PROVIDER_FALLBACK_MODEL).length === 1) {
      throw providerError(503)
    }
    return 'recovered'
  }, {
    sleep: async ms => { sleeps.push(ms) },
    onFallbackRetry: event => retries.push(event.nextAttempt),
  })

  assert.equal(result.value, 'recovered')
  assert.equal(result.model, PROVIDER_FALLBACK_MODEL)
  assert.deepEqual(sleeps, [1_000])
  assert.deepEqual(retries, [2])
})

test('fallback 429 is returned without repeated hammering', async () => {
  const calls: string[] = []
  await assert.rejects(
    withProviderModelFallback(async model => {
      calls.push(model)
      throw providerError(429)
    }),
    error => (error as { status?: number }).status === 429
  )
  assert.deepEqual(calls, [PROVIDER_PRIMARY_MODEL, PROVIDER_FALLBACK_MODEL])
})
