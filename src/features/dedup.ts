import { HurlResponse } from '../types/index.js'

const inFlight = new Map<string, Promise<HurlResponse>>()

export function getInFlight(key: string): Promise<HurlResponse> | null {
  return inFlight.get(key) ?? null
}

export function setInFlight(key: string, promise: Promise<HurlResponse>) {
  inFlight.set(key, promise)
  promise.finally(() => inFlight.delete(key))
}
