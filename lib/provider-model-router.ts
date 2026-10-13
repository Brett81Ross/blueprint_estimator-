import {
  PROVIDER_ATTEMPT_TIMEOUT_MS,
  providerErrorStatus,
  providerRetryReason,
  withTransientProviderRetry,
} from './provider-retry'

export const PROVIDER_PRIMARY_MODEL = 'gemini-3.8-flash'
export const PROVIDER_FALLBACK_MODEL = 'gemini-3.5-flash-lite'
export const PROVIDER_FALLBACK_MAX_ATTEMPTS = 2
export const PROVIDER_FALLBACK_RETRY_DELAYS_MS = [1_000] as const
export const PROVIDER_MODEL_ROUTE_MAX_WAIT_MS =
  PROVIDER_ATTEMPT_TIMEOUT_MS * (1 + PROVIDER_FALLBACK_MAX_ATTEMPTS) +
  PROVIDER_FALLBACK_RETRY_DELAYS_MS.reduce((total, delay) => total + delay, 0)

export type ProviderModelFallbackEvent = {
  from: string
  to: string
  status?: number
  reason?: string
}

export type ProviderModelRetryEvent = {
  model: string
  attempt: number
  nextAttempt: number
  status?: number
  reason: string
}

export type ProviderModelFallbackOptions = {
  primaryModel?: string
  fallbackModel?: string
  sleep?: (ms: number) => Promise<void>
  onFallback?: (event: ProviderModelFallbackEvent) => void
  onFallbackRetry?: (event: ProviderModelRetryEvent) => void
}

function shouldFallback(error: unknown): boolean {
  const status = providerErrorStatus(error)
  if (status === 429 || status === 503 || status === 504) return true
  return providerRetryReason(error) === 'timeout'
}

export async function withProviderModelFallback<T>(
  operation: (model: string) => Promise<T>,
  options: ProviderModelFallbackOptions = {}
): Promise<{ value: T; model: string; usedFallback: boolean }> {
  const primaryModel = options.primaryModel ?? PROVIDER_PRIMARY_MODEL
  const fallbackModel = options.fallbackModel ?? PROVIDER_FALLBACK_MODEL

  try {
    const value = await operation(primaryModel)
    return { value, model: primaryModel, usedFallback: false }
  } catch (error) {
    if (!shouldFallback(error) || primaryModel === fallbackModel) throw error

    const status = providerErrorStatus(error)
    const retryReason = providerRetryReason(error)
    options.onFallback?.({
      from: primaryModel,
      to: fallbackModel,
      status,
      reason: retryReason,
    })

    const value = await withTransientProviderRetry(
      () => operation(fallbackModel),
      {
        maxAttempts: PROVIDER_FALLBACK_MAX_ATTEMPTS,
        delaysMs: PROVIDER_FALLBACK_RETRY_DELAYS_MS,
        sleep: options.sleep,
        onRetry: ({ attempt, nextAttempt, status: fallbackStatus, reason }) => {
          options.onFallbackRetry?.({
            model: fallbackModel,
            attempt,
            nextAttempt,
            status: fallbackStatus,
            reason,
          })
        },
      }
    )

    return { value, model: fallbackModel, usedFallback: true }
  }
}
