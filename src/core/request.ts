import { HurlRequestOptions, HurlResponse, HurlDefaults, HurlError } from '../types/index.js'
import {
  buildHttpError,
  buildNetworkError,
  buildTimeoutError,
  buildAbortError,
  buildCircuitOpenError,
} from './errors.js'
import { parseResponseBody, buildResponse, parseHeaders } from './response.js'
import { applyAuth } from '../features/auth.js'
import { normalizeRetry, shouldRetry, waitForRetry } from '../features/retry.js'
import { getCacheKey, getFromCache, setInCache } from '../features/cache.js'
import { getInFlight, setInFlight } from '../features/dedup.js'
import { debugRequest, debugResponse, debugError } from '../features/debug.js'
import { wrapBodyWithUploadProgress } from '../features/progress.js'
import { checkCircuit, recordSuccess, recordFailure } from '../features/circuitBreaker.js'

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

export function buildUrl(base: string, url: string, query?: Record<string, string | number | boolean>): string {
  let fullUrl: string

  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (base) {
      const baseOrigin = new URL(base).origin
      const urlOrigin = new URL(url).origin
      if (baseOrigin !== urlOrigin) {
        throw new Error(
          `Absolute URL "${url}" does not match baseUrl origin "${baseOrigin}". ` +
          `Pass the full URL without baseUrl, or use a path-relative URL.`
        )
      }
    }
    fullUrl = url
  } else if (url.startsWith('//')) {
    throw new Error(
      `Protocol-relative URLs are not supported. Use an explicit https:// or http:// scheme.`
    )
  } else {
    fullUrl = base
      ? `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
      : url
  }

  if (!query || Object.keys(query).length === 0) return fullUrl

  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    params.set(k, String(v))
  }
  return `${fullUrl}?${params.toString()}`
}

function isStreamLike(body: unknown): boolean {
  if (body instanceof ReadableStream) return true
  if (body !== null && typeof body === 'object' && typeof (body as any).pipe === 'function') return true
  return false
}

export function buildRequestHeaders(
  options: HurlRequestOptions,
  defaults: HurlDefaults
): Record<string, string> {
  const headers: Record<string, string> = {
    ...defaults.headers,
    ...options.headers,
  }

  const body = options.body

  if (
    body !== null &&
    body !== undefined &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer) &&
    !isStreamLike(body)
  ) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
  }

  return headers
}

function buildBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) return undefined
  if (body instanceof FormData) return body
  if (body instanceof Blob) return body
  if (body instanceof ArrayBuffer) return body
  if (typeof body === 'string') return body
  if (body instanceof ReadableStream) return body as BodyInit
  if (typeof (body as any).pipe === 'function') return body as unknown as BodyInit
  return JSON.stringify(body)
}

function getCircuitKey(url: string, customKey?: string): string {
  if (customKey) return customKey
  try {
    return new URL(url).origin
  } catch {
    return url
  }
}

export async function executeRequest<T>(
  url: string,
  options: HurlRequestOptions,
  defaults: HurlDefaults
): Promise<HurlResponse<T>> {
  const requestId = options.requestId ?? generateId()
  const method = options.method ?? 'GET'
  const start = Date.now()
  const retryConfig = normalizeRetry(options.retry ?? defaults.retry)
  const debug = options.debug ?? defaults.debug ?? false
  const throwOnError = options.throwOnError ?? defaults.throwOnError ?? true

  const query = { ...defaults.query, ...options.query } as Record<string, string | number | boolean>
  const headers = buildRequestHeaders(options, defaults)
  const timeout = options.timeout ?? defaults.timeout

  const auth = options.auth ?? defaults.auth
  if (auth) applyAuth(headers, query as Record<string, string>, auth)

  const fullUrl = buildUrl(defaults.baseUrl ?? '', url, Object.keys(query).length > 0 ? query : undefined)

  if (options.proxy ?? defaults.proxy) {
    if (debug) {
      console.warn('[hurl] proxy option is not yet implemented. Node 18: npm install undici@6, use ProxyAgent + setGlobalDispatcher. Node 20: use ProxyAgent + setGlobalDispatcher from undici. Node 22.3+: use EnvHttpProxyAgent + setGlobalDispatcher from undici. Node 24+: set NODE_USE_ENV_PROXY=1 with HTTP_PROXY env var. See README for details.')
    }
  }

  const cacheConfig = options.cache ?? defaults.cache
  const shouldCache = !!cacheConfig && !cacheConfig.bypass && method === 'GET'

  if (shouldCache) {
    const cacheKey = getCacheKey(fullUrl, cacheConfig)
    const cached = getFromCache(cacheKey)
    if (cached) {
      if (debug) debugResponse(cached)
      return cached as HurlResponse<T>
    }
  }

  const deduplicate = options.deduplicate ?? defaults.deduplicate ?? false
  if (deduplicate && method === 'GET') {
    const inflight = getInFlight(fullUrl)
    if (inflight) return inflight as Promise<HurlResponse<T>>
  }

  const cbConfig = options.circuitBreaker ?? defaults.circuitBreaker
  const cbKey = cbConfig ? getCircuitKey(fullUrl, cbConfig.key) : ''

  if (cbConfig) {
    const state = checkCircuit(cbKey, cbConfig)

    if (state === 'OPEN') {
      if (debug) console.warn(`[hurl] circuit breaker OPEN for "${cbKey}", fast-failing`)

      if (cbConfig.fallback) {
        const end = Date.now()
        return {
          data: cbConfig.fallback() as T,
          status: 0,
          statusText: 'Circuit Open',
          headers: {},
          requestId,
          timing: { start, end, duration: end - start },
          fromCache: false,
        }
      }

      throw buildCircuitOpenError(cbKey, requestId)
    }
  }

  if (debug) debugRequest(fullUrl, { ...options, method })

  const run = async (attempt: number): Promise<HurlResponse<T>> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let timedOut = false

    const controller = new AbortController()
    const signal = options.signal

    let abortListener: (() => void) | null = null
    if (signal) {
      if (signal.aborted) {
        controller.abort(signal.reason)
      } else {
        abortListener = () => controller.abort(signal.reason)
        signal.addEventListener('abort', abortListener, { once: true })
      }
    }

    if (timeout) {
      timeoutId = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, timeout)
    }

    try {
      let requestBody = buildBody(options.body)
      const onUploadProgress = options.onUploadProgress ?? defaults.onUploadProgress

      if (requestBody !== undefined && onUploadProgress) {
        if (options.body instanceof FormData) {
          if (debug) {
            console.warn('[hurl] onUploadProgress is not supported for FormData bodies. Use XMLHttpRequest for FormData upload progress.')
          }
        } else {
          requestBody = wrapBodyWithUploadProgress(
            requestBody as Exclude<BodyInit, FormData>,
            onUploadProgress
          )
        }
      }

      const response = await fetch(fullUrl, {
        method,
        headers,
        body: requestBody,
        signal: controller.signal,
        redirect: (options.followRedirects ?? true) ? 'follow' : 'manual',
      })

      const data = await parseResponseBody(
        response,
        requestId,
        method,
        options.stream ?? false,
        options.onDownloadProgress ?? defaults.onDownloadProgress
      ) as T

      if (!response.ok && throwOnError) {
        throw buildHttpError({
          status: response.status,
          statusText: response.statusText,
          data,
          headers: parseHeaders(response.headers),
          requestId,
          retries: attempt,
        })
      }

      const result = buildResponse<T>(data, response, requestId, start)

      if (shouldCache && cacheConfig) {
        setInCache(getCacheKey(fullUrl, cacheConfig), result, cacheConfig)
      }

      if (debug) debugResponse(result)

      return result
    } catch (err) {
      let hurlError: HurlError

      if (err instanceof HurlError) {
        hurlError = err
      } else if (
        (err as Error).name === 'AbortError' ||
        (err as any).code === 'ABORT_ERR'
      ) {
        hurlError = timedOut
          ? buildTimeoutError(timeout!, requestId)
          : buildAbortError(requestId)
      } else {
        hurlError = buildNetworkError((err as Error).message, requestId)
      }

      hurlError.retries = attempt

      if (retryConfig && shouldRetry(hurlError, retryConfig, attempt)) {
        if (debug) console.log(`[hurl] retrying (${attempt + 1}/${retryConfig.count})...`)
        await waitForRetry(retryConfig, attempt)
        return run(attempt + 1)
      }

      if (debug) debugError(hurlError)
      throw hurlError
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      if (abortListener && signal) {
        signal.removeEventListener('abort', abortListener)
      }
    }
  }

  const promise = cbConfig
    ? run(0).then(
        (result) => { recordSuccess(cbKey); return result },
        (err) => {
          // Don't count aborts or circuit errors against the breaker.
          if (
            err instanceof HurlError &&
            err.type !== 'ABORT_ERROR' &&
            err.type !== 'CIRCUIT_OPEN'
          ) {
            recordFailure(cbKey, cbConfig)
          }
          throw err
        }
      )
    : run(0)

  if (deduplicate && method === 'GET') {
    setInFlight(fullUrl, promise as Promise<HurlResponse>)
  }

  return promise
}
