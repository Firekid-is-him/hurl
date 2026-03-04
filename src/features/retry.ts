import { RetryConfig, HurlError } from '../types/index.js'

export function normalizeRetry(retry: RetryConfig | number | undefined): RetryConfig | null {
  if (retry === undefined || retry === null) return null
  if (typeof retry === 'number') return { count: retry, delay: 300, backoff: 'exponential' }
  return retry
}

export function shouldRetry(error: HurlError, config: RetryConfig, attempt: number): boolean {
  if (attempt >= config.count) return false
  if (error.type === 'ABORT_ERROR') return false

  if (config.on && error.status) {
    return config.on.includes(error.status)
  }

  if (error.type === 'NETWORK_ERROR' || error.type === 'TIMEOUT_ERROR') return true
  if (error.status && error.status >= 500) return true

  return false
}

export async function waitForRetry(config: RetryConfig, attempt: number) {
  const base = config.delay ?? 300

  const delay =
    config.backoff === 'exponential'
      ? base * Math.pow(2, attempt)
      : base * (attempt + 1)

  await new Promise((res) => setTimeout(res, delay))
}
