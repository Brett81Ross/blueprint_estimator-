import { createHmac } from 'node:crypto'

export type AnalysisPlan = 'free' | 'pro'

export type AnalysisIdentity = {
  plan: AnalysisPlan
  subjectHash: string
  ipHash: string
  now: Date
}

export type AnalysisRejection = { allowed: false; status: 429 | 503; reason: string }

export type AdmissionDecision =
  | { allowed: true; reservationId: string }
  | AnalysisRejection

export type ProviderUsageDecision =
  | { allowed: true }
  | AnalysisRejection

export type PolicyLimits = {
  freeDaily: number
  proDaily: number
  ipBurst: number
  ipBurstWindowSeconds: number
  ipDaily: number
  globalDaily: number
}

export interface AnalysisPolicyStore {
  /**
   * Stage 1: atomically re-check the runtime kill switch, enforce burst abuse
   * controls, and insert an attempt reservation before multipart parsing.
   */
  reserveAdmission(input: AnalysisIdentity, limits: PolicyLimits): Promise<AdmissionDecision>
  /**
   * Stage 2: immediately before Gemini, atomically re-check the kill switch,
   * enforce subject/IP/global provider-backed daily limits, and mark the
   * reservation provider-started in the same transaction.
   */
  reserveProviderUsage(reservationId: string, input: AnalysisIdentity, limits: PolicyLimits): Promise<ProviderUsageDecision>
  recordResult(input: {
    reservationId: string
    outcome: 'success' | 'provider_error' | 'server_error' | 'client_rejected'
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
  return createHmac('sha256', requiredHashSecret()).update(value).digest('hex')
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
    reserveAdmission: unavailable,
    reserveProviderUsage: unavailable,
    recordResult: unavailable,
    logRejection: unavailable,
  }
}

export function configuredPolicyLimits(): PolicyLimits {
  const required = (name: string) => {
    const raw = process.env[name] || ''
    if (!/^[1-9]\d*$/.test(raw)) throw new Error(`${name} is not configured`)
    const value = Number(raw)
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} is not configured`)
    return value
  }

  return {
    freeDaily: required('RAPID_FREE_DAILY_LIMIT'),
    proDaily: required('RAPID_PRO_DAILY_LIMIT'),
    ipBurst: required('RAPID_IP_BURST_LIMIT'),
    ipBurstWindowSeconds: required('RAPID_IP_BURST_WINDOW_SECONDS'),
    ipDaily: required('RAPID_IP_DAILY_LIMIT'),
    globalDaily: required('RAPID_GLOBAL_DAILY_LIMIT'),
  }
}
