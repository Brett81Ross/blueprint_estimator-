import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

export const SUBJECT_COOKIE = 'rapid_takeoff_subject'
const SUBJECT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

function subjectSecret() {
  const value = process.env.RAPID_SUBJECT_SECRET
  if (!value) throw new Error('RAPID_SUBJECT_SECRET is not configured')
  return value
}

function sign(id: string) {
  return createHmac('sha256', subjectSecret()).update(id).digest('base64url')
}

export function createSubjectToken() {
  const id = randomUUID()
  return `${id}.${sign(id)}`
}

export function verifySubjectToken(token: string | undefined) {
  if (!token) return undefined
  const [id, supplied, extra] = token.split('.')
  if (!id || !supplied || extra || !SUBJECT_ID_RE.test(id)) return undefined
  try {
    const expected = Buffer.from(sign(id))
    const actual = Buffer.from(supplied)
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return undefined
    return id
  } catch {
    return undefined
  }
}


export function subjectCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }
}
