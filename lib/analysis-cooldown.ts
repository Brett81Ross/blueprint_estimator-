import {
  PROVIDER_CAPACITY_CODE,
  PROVIDER_TEMPORARY_CODE,
  type AnalysisErrorPayload,
} from './analysis-errors'

export const MAX_ANALYSIS_COOLDOWN_SECONDS = 300

export function analysisCooldownSeconds(
  payload: Partial<AnalysisErrorPayload> | null | undefined
): number {
  if (
    payload?.code !== PROVIDER_CAPACITY_CODE &&
    payload?.code !== PROVIDER_TEMPORARY_CODE
  ) {
    return 0
  }

  const raw = payload.retryAfterSeconds
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0

  return Math.min(
    MAX_ANALYSIS_COOLDOWN_SECONDS,
    Math.max(1, Math.round(raw))
  )
}

export function analysisCooldownButtonLabel(seconds: number): string {
  if (seconds <= 0) return 'Run Rapid Matrix Engine™'
  return `Provider busy — retry in ${seconds}s`
}
