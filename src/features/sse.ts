import { SSEOptions, SSEEvent, HurlDefaults } from '../types/index.js'
import { applyAuth } from './auth.js'
import { buildUrl } from '../core/request.js'

function parseSSEChunk(chunk: string): Partial<SSEEvent> & { _done?: boolean } {
  const event: Partial<SSEEvent> & { _done?: boolean } = { event: 'message', id: '', data: '' }
  const lines = chunk.split('\n')

  for (const line of lines) {
    if (line.startsWith('data:')) {
      const value = line.slice(5).trim()
      if (value === '[DONE]') {
        event._done = true
        return event
      }
      event.data = (event.data ? event.data + '\n' : '') + value
    } else if (line.startsWith('event:')) {
      event.event = line.slice(6).trim()
    } else if (line.startsWith('id:')) {
      event.id = line.slice(3).trim()
    } else if (line.startsWith('retry:')) {
      const ms = parseInt(line.slice(6).trim(), 10)
      if (!isNaN(ms)) event.retry = ms
    }
  }

  return event
}

export function executeSSE(url: string, options: SSEOptions, defaults: HurlDefaults): { close(): void } {
  const controller = new AbortController()

  // If the caller passes their own signal, wire it to our controller.
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort()
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }

  const headers: Record<string, string> = {
    ...defaults.headers,
    ...options.headers,
    Accept: 'text/event-stream',
    'Cache-Control': 'no-cache',
  }

  const query = { ...defaults.query, ...options.query } as Record<string, string | number | boolean>
  const auth = options.auth ?? defaults.auth
  if (auth) applyAuth(headers, query as Record<string, string>, auth)

  if (options.body !== undefined && options.body !== null) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
  }

  const fullUrl = buildUrl(defaults.baseUrl ?? '', url, Object.keys(query).length > 0 ? query : undefined)

  const method = options.method ?? 'GET'
  const body =
    options.body === undefined || options.body === null
      ? undefined
      : typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body)

  async function run() {
    let response: Response

    try {
      response = await fetch(fullUrl, {
        method,
        headers,
        body,
        signal: controller.signal,
      })
    } catch (err: any) {
      if (err.name === 'AbortError') return
      options.onError?.(err instanceof Error ? err : new Error(String(err)))
      return
    }

    if (!response.ok) {
      options.onError?.(new Error(`HTTP ${response.status}: ${response.statusText}`))
      return
    }

    if (!response.body) {
      options.onError?.(new Error('Response body is empty'))
      return
    }

    options.onOpen?.()

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE messages are separated by double newlines.
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const trimmed = part.trim()
          if (!trimmed) continue

          const parsed = parseSSEChunk(trimmed)

          if (parsed._done) {
            options.onDone?.()
            controller.abort()
            return
          }

          if (parsed.data !== undefined) {
            options.onMessage(parsed as SSEEvent)
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      options.onError?.(err instanceof Error ? err : new Error(String(err)))
    } finally {
      reader.releaseLock()
    }

    options.onDone?.()
  }

  run()

  return {
    close() {
      controller.abort()
    },
  }
}
