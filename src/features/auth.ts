import { AuthConfig, HurlRequestOptions } from '../types/index.js'

export function applyAuth(headers: Record<string, string>, query: Record<string, string>, auth: AuthConfig) {
  if (auth.type === 'bearer') {
    headers['Authorization'] = `Bearer ${auth.token}`
  }

  if (auth.type === 'basic') {
    const encoded = btoa(`${auth.username}:${auth.password}`)
    headers['Authorization'] = `Basic ${encoded}`
  }

  if (auth.type === 'apikey') {
    if (auth.in === 'query') {
      query[auth.key] = auth.value
    } else {
      headers[auth.key] = auth.value
    }
  }
}

export function mergeAuth(options: HurlRequestOptions, defaults: { auth?: AuthConfig }) {
  return options.auth ?? defaults.auth
}
