export type ProviderRetryReason = 'provider_503' | 'timeout'

export const PROVIDER_ATTEMPT_TIMEOUT_MS = 16_000
export const PROVIDER_MAX_ATTEMPTS = 3
export const PROVIDER_RETRY_DELAYS_MS = [1_000, 2_500] as const
export const PROVIDER_MAX_WAIT_BUDGET_MS =
  PROVIDER_ATTEMPT_TIMEOUT_MS * PROVIDER_MAX_ATTEMPTS +
  PROVIDER_RETRY_DELAYS_MS.reduce((total, delay) => total + delay, 0)

export type ProviderRetryOptions = {
  maxAttempts?: number
  delaysMs?: readonly number[]
  sleep?: (ms: number) => Promise<void>
  onRetry?: (input: {
    attempt: number
    nextAttempt: number
    status?: number
    reason: ProviderRetryReason
  }) => void
}

const defaultSleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export function providerErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const candidate = error as { status?: unknown; statusCode?: unknown }
  const value = candidate.status ?? candidate.statusCode
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && /^\d{3}$/.test(value)) return Number(value)
  return undefined
}

export function providerRetryReason(error: unknown): ProviderRetryReason | undefined {
  const status = providerErrorStatus(error)
  if (status === 503) return 'provider_503'
  if (!error || typeof error !== 'object') return undefined

  const candidate = error as { name?: unknown; message?: unknown }
  const name = typeof candidate.name === 'string' ? candidate.name : ''
  const message = typeof candidate.message === 'string' ? candidate.message : ''
  const combined = `${name} ${message}`.toLowerCase()

  if (
    combined.includes('abort') ||
    combined.includes('timeout') ||
    combined.includes('timed out')
  ) {
    return 'timeout'
  }

  return undefined
}

export async function withTransientProviderRetry<T>(
  operation: () => Promise<T>,
  options: ProviderRetryOptions = {}
): Promise<T> {
  const maxAttempts = Math.max(1, Math.min(3, options.maxAttempts ?? PROVIDER_MAX_ATTEMPTS))
  const delaysMs = options.delaysMs ?? PROVIDER_RETRY_DELAYS_MS
  const sleep = options.sleep ?? defaultSleep

  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const status = providerErrorStatus(error)
      const reason = providerRetryReason(error)

      if (!reason || attempt >= maxAttempts) throw error

      options.onRetry?.({ attempt, nextAttempt: attempt + 1, status, reason })
      const delayMs = delaysMs[Math.min(attempt - 1, delaysMs.length - 1)] ?? 0
      if (delayMs > 0) await sleep(delayMs)
    }
  }

  throw lastError
}
