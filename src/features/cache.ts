import { HurlResponse, CacheConfig } from '../types/index.js'

type CacheEntry = {
  response: HurlResponse
  expiresAt: number
}

const store = new Map<string, CacheEntry>()

export function getCacheKey(url: string, config?: CacheConfig) {
  return config?.key ?? url
}

export function getFromCache(key: string): HurlResponse | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return { ...entry.response, fromCache: true }
}

export function setInCache(key: string, response: HurlResponse, config: CacheConfig) {
  store.set(key, {
    response,
    expiresAt: Date.now() + config.ttl,
  })
}

export function invalidateCache(key: string) {
  store.delete(key)
}

export function clearCache() {
  store.clear()
}
