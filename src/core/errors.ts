import { HurlError } from '../types/index.js'

export function buildHttpError(params: {
  status: number
  statusText: string
  data: unknown
  headers: Record<string, string>
  requestId: string
  retries: number
}) {
  return new HurlError({
    message: `HTTP ${params.status}: ${params.statusText}`,
    type: 'HTTP_ERROR',
    ...params,
  })
}

export function buildNetworkError(message: string, requestId: string) {
  return new HurlError({ message, type: 'NETWORK_ERROR', requestId })
}

export function buildTimeoutError(timeout: number, requestId: string) {
  return new HurlError({
    message: `Request timed out after ${timeout}ms`,
    type: 'TIMEOUT_ERROR',
    requestId,
  })
}

export function buildAbortError(requestId: string) {
  return new HurlError({ message: 'Request was aborted', type: 'ABORT_ERROR', requestId })
}

export function buildParseError(message: string, requestId: string) {
  return new HurlError({
    message: `Failed to parse response: ${message}`,
    type: 'PARSE_ERROR',
    requestId,
  })
}

export function buildCircuitOpenError(key: string, requestId: string) {
  return new HurlError({
    message: `Circuit breaker is open for "${key}"`,
    type: 'CIRCUIT_OPEN',
    requestId,
  })
}
