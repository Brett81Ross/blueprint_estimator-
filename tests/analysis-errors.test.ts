import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ANALYSIS_LIMIT_CODE,
  PROVIDER_CAPACITY_CODE,
  PROVIDER_CAPACITY_RETRY_AFTER_SECONDS,
  PROVIDER_TEMPORARY_CODE,
  analysisErrorMessage,
  analysisLimitPayload,
  providerCapacityPayload,
  providerTemporaryPayload,
} from '../lib/analysis-errors'

test('provider capacity payload carries a stable code and retry hint', () => {
  const payload = providerCapacityPayload()
  assert.equal(payload.code, PROVIDER_CAPACITY_CODE)
  assert.equal(payload.retryAfterSeconds, PROVIDER_CAPACITY_RETRY_AFTER_SECONDS)
  assert.equal(payload.success, false)
})

test('provider temporary payload is distinct from capacity limit', () => {
  const payload = providerTemporaryPayload()
  assert.equal(payload.code, PROVIDER_TEMPORARY_CODE)
  assert.notEqual(payload.code, PROVIDER_CAPACITY_CODE)
})

test('Rapid Takeoff usage limit is distinct from provider capacity', () => {
  const payload = analysisLimitPayload()
  assert.equal(payload.code, ANALYSIS_LIMIT_CODE)
  assert.equal(payload.retryAfterSeconds, undefined)
})

test('capacity UI message preserves uploaded-plan context and retry guidance', () => {
  const message = analysisErrorMessage(providerCapacityPayload(), 429)
  assert.match(message, /plans are still loaded/i)
  assert.match(message, /60 seconds/i)
})

test('generic API errors preserve server-provided messages', () => {
  assert.equal(
    analysisErrorMessage({ success: false, error: 'Custom failure' }, 500),
    'Custom failure'
  )
})
