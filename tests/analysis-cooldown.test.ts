import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MAX_ANALYSIS_COOLDOWN_SECONDS,
  analysisCooldownButtonLabel,
  analysisCooldownSeconds,
} from '../lib/analysis-cooldown'
import {
  ANALYSIS_LIMIT_CODE,
  PROVIDER_CAPACITY_CODE,
  PROVIDER_TEMPORARY_CODE,
} from '../lib/analysis-errors'

test('starts cooldown for provider capacity responses', () => {
  assert.equal(
    analysisCooldownSeconds({
      success: false,
      error: 'busy',
      code: PROVIDER_CAPACITY_CODE,
      retryAfterSeconds: 60,
    }),
    60
  )
})

test('starts cooldown for temporary provider failures', () => {
  assert.equal(
    analysisCooldownSeconds({
      success: false,
      error: 'temporary',
      code: PROVIDER_TEMPORARY_CODE,
      retryAfterSeconds: 30,
    }),
    30
  )
})

test('does not cooldown local Rapid Takeoff usage limits', () => {
  assert.equal(
    analysisCooldownSeconds({
      success: false,
      error: 'limit',
      code: ANALYSIS_LIMIT_CODE,
      retryAfterSeconds: 60,
    }),
    0
  )
})

test('clamps excessive cooldown values', () => {
  assert.equal(
    analysisCooldownSeconds({
      success: false,
      error: 'busy',
      code: PROVIDER_CAPACITY_CODE,
      retryAfterSeconds: 9999,
    }),
    MAX_ANALYSIS_COOLDOWN_SECONDS
  )
})

test('rejects missing or invalid retry hints', () => {
  assert.equal(
    analysisCooldownSeconds({
      success: false,
      error: 'busy',
      code: PROVIDER_CAPACITY_CODE,
    }),
    0
  )
  assert.equal(
    analysisCooldownSeconds({
      success: false,
      error: 'busy',
      code: PROVIDER_CAPACITY_CODE,
      retryAfterSeconds: Number.NaN,
    }),
    0
  )
})

test('formats the cooldown button label', () => {
  assert.equal(analysisCooldownButtonLabel(42), 'Provider busy — retry in 42s')
  assert.equal(analysisCooldownButtonLabel(0), 'Run Rapid Matrix Engine™')
})
