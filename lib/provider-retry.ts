export type ProviderRetryOptions = {
  maxAttempts?: number
  delaysMs?: number[]
  sleep?: (ms: number) => Promise<void>
  onRetry?: (input: { attempt: number; nextAttempt: number; status: number }) => void
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

export async function withTransientProviderRetry<T>(
  operation: () => Promise<T>,
  options: ProviderRetryOptions = {}
): Promise<T> {
  const maxAttempts = Math.max(1, Math.min(3, options.maxAttempts ?? 3))
  const delaysMs = options.delaysMs ?? [1_000, 2_500]
  const sleep = options.sleep ?? defaultSleep

  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const status = providerErrorStatus(error)
      const retryable = status === 503

      if (!retryable || attempt >= maxAttempts) throw error

      options.onRetry?.({ attempt, nextAttempt: attempt + 1, status })
      const delayMs = delaysMs[Math.min(attempt - 1, delaysMs.length - 1)] ?? 0
      if (delayMs > 0) await sleep(delayMs)
    }
  }

  throw lastError
}
