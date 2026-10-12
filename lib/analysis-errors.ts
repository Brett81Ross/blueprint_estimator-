export const ANALYSIS_LIMIT_CODE = 'ANALYSIS_LIMIT'
export const PROVIDER_CAPACITY_CODE = 'PROVIDER_CAPACITY'
export const PROVIDER_TEMPORARY_CODE = 'PROVIDER_TEMPORARY'

export const PROVIDER_CAPACITY_RETRY_AFTER_SECONDS = 60
export const PROVIDER_TEMPORARY_RETRY_AFTER_SECONDS = 30

export type AnalysisErrorPayload = {
  success: false
  error: string
  code?: string
  retryAfterSeconds?: number
}

export function analysisLimitPayload(): AnalysisErrorPayload {
  return {
    success: false,
    error: 'Analysis limit reached. Please try again later.',
    code: ANALYSIS_LIMIT_CODE,
  }
}

export function providerCapacityPayload(): AnalysisErrorPayload {
  return {
    success: false,
    error: 'Analysis capacity is temporarily limited. Please wait and try again.',
    code: PROVIDER_CAPACITY_CODE,
    retryAfterSeconds: PROVIDER_CAPACITY_RETRY_AFTER_SECONDS,
  }
}

export function providerTemporaryPayload(): AnalysisErrorPayload {
  return {
    success: false,
    error: 'Analysis is temporarily unavailable. Please try again shortly.',
    code: PROVIDER_TEMPORARY_CODE,
    retryAfterSeconds: PROVIDER_TEMPORARY_RETRY_AFTER_SECONDS,
  }
}

export function analysisErrorMessage(payload: Partial<AnalysisErrorPayload> | null | undefined, status: number): string {
  const retryAfter = typeof payload?.retryAfterSeconds === 'number' && Number.isFinite(payload.retryAfterSeconds)
    ? Math.max(1, Math.round(payload.retryAfterSeconds))
    : undefined

  if (payload?.code === PROVIDER_CAPACITY_CODE) {
    return `The analysis provider is temporarily at capacity. Your plans are still loaded. Wait about ${retryAfter ?? PROVIDER_CAPACITY_RETRY_AFTER_SECONDS} seconds, then run the Rapid Matrix Engine™ again.`
  }

  if (payload?.code === PROVIDER_TEMPORARY_CODE) {
    return `The analysis provider is temporarily unavailable. Your plans are still loaded. Wait about ${retryAfter ?? PROVIDER_TEMPORARY_RETRY_AFTER_SECONDS} seconds, then try again.`
  }

  if (payload?.code === ANALYSIS_LIMIT_CODE) {
    return payload.error || 'Rapid Takeoff analysis limit reached. Please try again later.'
  }

  return payload?.error || (status === 429
    ? 'Analysis capacity is temporarily limited. Please wait and try again.'
    : 'Unknown server error.')
}
