import assert from 'node:assert/strict'
import test from 'node:test'
import { createSubjectToken, verifySubjectToken } from '../lib/analysis-identity'
import { configuredPolicyLimits, privacyHash } from '../lib/analysis-policy'
import { validateContentLength, validateFiles } from '../lib/upload-guard'

test('signed subject token verifies and tampering fails', () => {
  process.env.RAPID_SUBJECT_SECRET = 'test-subject-secret'
  const token = createSubjectToken()
  assert.ok(verifySubjectToken(token))
  assert.equal(verifySubjectToken(token + 'x'), undefined)
})

test('privacy hashing is stable and secret-bound', () => {
  process.env.RAPID_LOG_HASH_SECRET = 'test-log-secret'
  const a = privacyHash('203.0.113.10')
  const b = privacyHash('203.0.113.10')
  assert.equal(a, b)
  assert.notEqual(a, '203.0.113.10')
})

test('policy limits fail closed when configuration is missing', () => {
  const names = [
    'RAPID_FREE_DAILY_LIMIT',
    'RAPID_PRO_DAILY_LIMIT',
    'RAPID_IP_BURST_LIMIT',
    'RAPID_IP_BURST_WINDOW_SECONDS',
    'RAPID_IP_DAILY_LIMIT',
    'RAPID_GLOBAL_DAILY_LIMIT',
  ]
  for (const name of names) delete process.env[name]
  assert.throws(() => configuredPolicyLimits())
})

test('policy limits accept explicit positive values', () => {
  process.env.RAPID_FREE_DAILY_LIMIT = '2'
  process.env.RAPID_PRO_DAILY_LIMIT = '20'
  process.env.RAPID_IP_BURST_LIMIT = '3'
  process.env.RAPID_IP_BURST_WINDOW_SECONDS = '60'
  process.env.RAPID_IP_DAILY_LIMIT = '10'
  process.env.RAPID_GLOBAL_DAILY_LIMIT = '100'
  assert.deepEqual(configuredPolicyLimits(), {
    freeDaily: 2,
    proDaily: 20,
    ipBurst: 3,
    ipBurstWindowSeconds: 60,
    ipDaily: 10,
    globalDaily: 100,
  })
})

test('content length rejects oversized request before multipart parsing', () => {
  process.env.RAPID_MAX_TOTAL_BYTES = '100'
  assert.equal(validateContentLength('2000000').ok, false)
})

test('upload guard rejects unsupported and oversized files', () => {
  process.env.RAPID_MAX_FILES = '2'
  process.env.RAPID_MAX_FILE_BYTES = '10'
  process.env.RAPID_MAX_TOTAL_BYTES = '20'

  const badType = new File(['abc'], 'plan.txt', { type: 'text/plain' })
  assert.equal(validateFiles([badType]).ok, false)

  const tooLarge = new File(['12345678901'], 'plan.pdf', { type: 'application/pdf' })
  assert.equal(validateFiles([tooLarge]).ok, false)
})

test('upload guard accepts bounded blueprint files', () => {
  process.env.RAPID_MAX_FILES = '2'
  process.env.RAPID_MAX_FILE_BYTES = '20'
  process.env.RAPID_MAX_TOTAL_BYTES = '30'
  const pdf = new File(['%PDF-1.7'], 'plan.pdf', { type: 'application/pdf' })
  const png = new File(['png'], 'plan.png', { type: 'image/png' })
  assert.equal(validateFiles([pdf, png]).ok, true)
})
