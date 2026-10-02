import assert from 'node:assert/strict'
import test from 'node:test'
import { createSubjectToken, verifySubjectToken, subjectCookieOptions } from '../lib/analysis-identity'
import { configuredPolicyLimits, unavailablePolicyStore, privacyHash } from '../lib/analysis-policy'
import { validateContentLength, validateFiles, validateFileSignatures, validateUploadContentType } from '../lib/upload-guard'

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

test('policy limits reject malformed and unsafe integer configuration', () => {
  const valid = {
    RAPID_FREE_DAILY_LIMIT: '2',
    RAPID_PRO_DAILY_LIMIT: '20',
    RAPID_IP_BURST_LIMIT: '3',
    RAPID_IP_BURST_WINDOW_SECONDS: '60',
    RAPID_IP_DAILY_LIMIT: '10',
    RAPID_GLOBAL_DAILY_LIMIT: '100',
  }
  Object.assign(process.env, valid)

  process.env.RAPID_FREE_DAILY_LIMIT = '10junk'
  assert.throws(() => configuredPolicyLimits())

  Object.assign(process.env, valid)
  process.env.RAPID_IP_DAILY_LIMIT = '1.5'
  assert.throws(() => configuredPolicyLimits())

  Object.assign(process.env, valid)
  process.env.RAPID_GLOBAL_DAILY_LIMIT = '9007199254740992'
  assert.throws(() => configuredPolicyLimits())
})

test('upload guard rejects malformed Content-Length and safely falls back on bad overrides', () => {
  process.env.RAPID_MAX_TOTAL_BYTES = '100junk'
  assert.equal(validateContentLength('10junk').ok, false)
  assert.equal(validateContentLength('1.5').ok, false)
  assert.equal(validateContentLength('9007199254740992').ok, false)

  process.env.RAPID_MAX_FILES = '2junk'
  process.env.RAPID_MAX_FILE_BYTES = '20junk'
  process.env.RAPID_MAX_TOTAL_BYTES = '30junk'
  const pdf = new File(['%PDF-1.7'], 'plan.pdf', { type: 'application/pdf' })
  assert.equal(validateFiles([pdf]).ok, true)
})

test('file signatures reject MIME spoofing and accept supported headers', async () => {
  const fakePdf = new File(['not a pdf'], 'plan.pdf', { type: 'application/pdf' })
  assert.equal((await validateFileSignatures([fakePdf])).ok, false)

  const pdf = new File([new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x37])], 'plan.pdf', { type: 'application/pdf' })
  const jpg = new File([new Uint8Array([0xff,0xd8,0xff,0xe0])], 'plan.jpg', { type: 'image/jpeg' })
  const png = new File([new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])], 'plan.png', { type: 'image/png' })
  const webp = new File([new Uint8Array([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50])], 'plan.webp', { type: 'image/webp' })

  assert.equal((await validateFileSignatures([pdf, jpg, png, webp])).ok, true)
})

test('upload content type requires multipart form-data with a non-empty boundary', () => {
  assert.equal(validateUploadContentType(null).ok, false)
  assert.equal(validateUploadContentType('application/x-www-form-urlencoded').ok, false)
  assert.equal(validateUploadContentType('multipart/form-data').ok, false)
  assert.equal(validateUploadContentType('multipart/form-data; boundary=').ok, false)
  assert.equal(validateUploadContentType('multipart/form-data; boundary="abc123"').ok, true)
  assert.equal(validateUploadContentType('Multipart/Form-Data; charset=utf-8; boundary=abc123').ok, true)
})

test('upload guard rejects malformed file-shaped objects before signature parsing', () => {
  const malformed = {
    name: 'fake.pdf',
    type: 'application/pdf',
    size: 8,
    arrayBuffer: async () => new ArrayBuffer(8),
  } as unknown as File

  const result = validateFiles([malformed])
  assert.equal(result.ok, false)
})

test('durable policy boundary fails closed at both reservation stages', async () => {
  const store = unavailablePolicyStore()
  const identity = {
    plan: 'free' as const,
    subjectHash: 'subject',
    ipHash: 'ip',
    now: new Date('2026-10-02T00:00:00Z'),
  }
  const limits = {
    freeDaily: 2,
    proDaily: 20,
    ipBurst: 3,
    ipBurstWindowSeconds: 60,
    ipDaily: 10,
    globalDaily: 100,
  }

  await assert.rejects(() => store.reserveAdmission(identity, limits))
  await assert.rejects(() => store.reserveProviderUsage('reservation', identity, limits))
})

test('anonymous subject cookie is hardened and never script-readable', () => {
  const options = subjectCookieOptions()
  assert.equal(options.httpOnly, true)
  assert.equal(options.sameSite, 'lax')
  assert.equal(options.path, '/')
  assert.equal(options.secure, process.env.NODE_ENV === 'production')
  assert.equal('maxAge' in options, false)
})

test('subject verifier rejects malformed and non-v4 identifiers', () => {
  assert.equal(verifySubjectToken('not-a-uuid.signature'), undefined)
  assert.equal(verifySubjectToken('00000000-0000-0000-0000-000000000000.signature'), undefined)
  assert.equal(verifySubjectToken('550e8400-e29b-11d4-a716-446655440000.signature'), undefined)
})

test('multipart boundary rejects whitespace, controls, broken quotes, and excessive length', () => {
  assert.equal(validateUploadContentType('multipart/form-data; boundary=abc def').ok, false)
  assert.equal(validateUploadContentType('multipart/form-data; boundary=abc\\tdef').ok, false)
  assert.equal(validateUploadContentType('multipart/form-data; boundary="abc123').ok, false)
  assert.equal(validateUploadContentType('multipart/form-data; boundary=abc123"').ok, false)
  assert.equal(validateUploadContentType('multipart/form-data; boundary=' + 'a'.repeat(71)).ok, false)
  assert.equal(validateUploadContentType('multipart/form-data; boundary=' + 'a'.repeat(70)).ok, true)
})
