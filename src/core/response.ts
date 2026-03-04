import { HurlResponse } from '../types/index.js'
import { buildParseError } from './errors.js'
import { trackDownloadProgress } from '../features/progress.js'
import { ProgressCallback } from '../types/index.js'

export function parseHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

export async function parseResponseBody(
  response: Response,
  requestId: string,
  onDownloadProgress?: ProgressCallback,
  method?: string
): Promise<unknown> {
  if (method === 'HEAD') return null
  if (response.status === 204 || response.headers.get('content-length') === '0') return null

  const contentType = response.headers.get('content-type') ?? ''

  try {
    if (onDownloadProgress) {
      const text = await trackDownloadProgress(response, onDownloadProgress)
      if (contentType.includes('application/json')) return JSON.parse(text)
      return text
    }

    if (contentType.includes('application/json')) return await response.json()
    if (contentType.includes('text/')) return await response.text()
    if (contentType.includes('application/octet-stream') || contentType.includes('image/')) {
      return await response.arrayBuffer()
    }

    const text = await response.text()
    if (!text) return null
    return text
  } catch (e) {
    throw buildParseError((e as Error).message, requestId)
  }
}

export function buildResponse<T>(
  data: T,
  response: Response,
  requestId: string,
  start: number
): HurlResponse<T> {
  const end = Date.now()
  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: parseHeaders(response.headers),
    requestId,
    timing: { start, end, duration: end - start },
    fromCache: false,
  }
}
