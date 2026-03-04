import { HurlRequestOptions, HurlResponse } from '../types/index.js'

export function debugRequest(url: string, options: HurlRequestOptions) {
  console.group(`[hurl] → ${options.method ?? 'GET'} ${url}`)
  if (options.headers && Object.keys(options.headers).length > 0) {
    console.log('headers:', options.headers)
  }
  if (options.query) console.log('query:', options.query)
  if (options.body) console.log('body:', options.body)
  if (options.timeout) console.log('timeout:', options.timeout)
  if (options.retry) console.log('retry:', options.retry)
  console.groupEnd()
}

export function debugResponse(response: HurlResponse) {
  const color = response.status >= 400 ? '🔴' : response.status >= 300 ? '🟡' : '🟢'
  console.group(`[hurl] ${color} ${response.status} ${response.statusText} (${response.timing.duration}ms)`)
  console.log('requestId:', response.requestId)
  if (response.fromCache) console.log('served from cache')
  console.log('headers:', response.headers)
  console.log('data:', response.data)
  console.groupEnd()
}

export function debugError(error: unknown) {
  console.group('[hurl] 🔴 Error')
  console.error(error)
  console.groupEnd()
}
