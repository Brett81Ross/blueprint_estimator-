import { createHash } from 'node:crypto'

export type AnalysisPlan = 'free' | 'pro'

export type AnalysisIdentity = {
  plan: AnalysisPlan
  subjectHash: string
  ipHash: string
}

export type AnalysisDecision =
  | { allowed: true; reservationId: string }
  | { allowed: false; status: 429 | 503; reason: string }

export interface AnalysisPolicyStore {
  reserve(input: AnalysisIdentity): Promise<AnalysisDecision>
  recordResult(input: {
    reservationId: string
    outcome: 'success' | 'provider_error' | 'server_error'
    inputTokens?: number
    outputTokens?: number
  }): Promise<void>
  logRejection(input: {
    reason: string
    ipHash: string
    subjectHash: string
    userAgent?: string
    contentLength?: number
  }): Promise<void>
}

function requiredHashSecret() {
  const secret = process.env.RAPID_LOG_HASH_SECRET
  if (!secret) throw new Error('RAPID_LOG_HASH_SECRET is not configured')
  return secret
}

export function privacyHash(value: string) {
  return createHash('sha256').update(requiredHashSecret()).update('\0').update(value).digest('hex')
}

export function requestIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown'
}

export function truncateUserAgent(value: string | null) {
  if (!value) return undefined
  return value.slice(0, 160)
}

export function unavailablePolicyStore(): AnalysisPolicyStore {
  const unavailable = async (): Promise<never> => {
    throw new Error('Rapid Takeoff durable policy store is not configured')
  }
  return {
    reserve: unavailable,
    recordResult: unavailable,
    logRejection: unavailable,
  }
}
