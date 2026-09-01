import {createHmac,timingSafeEqual} from 'node:crypto'

export const PRO_COOKIE = 'rapid_takeoff_pro'
const SCOPE = 'rapid-takeoff-pro-lifetime'

function secret() {
  const value = process.env.RAPID_ACCESS_SECRET || process.env.GEMINI_API_KEY
  if (!value) throw new Error('RAPID_ACCESS_SECRET is not configured')
  return value
}

function signature(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function createProAccessToken() {
  const payload = Buffer.from(JSON.stringify({ scope: SCOPE, issuedAt: Date.now() })).toString('base64url')
  return `${payload}.${signature(payload)}`
}

export function verifyProAccessToken(token: string | undefined) {
  if (!token) return false
  try {
    const [payload, suppliedSignature, extra] = token.split('.')
    if (!payload || !suppliedSignature || extra) return false
    const expected = Buffer.from(signature(payload))
    const supplied = Buffer.from(suppliedSignature)
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return data?.scope === SCOPE && Number.isFinite(data?.issuedAt)
  } catch {
    return false
  }
}
