import { RequestInterceptor, ResponseInterceptor, ErrorInterceptor, HurlError, HurlResponse, HurlRequestOptions } from '../types/index.js'

export function createInterceptorStore<T extends (...args: any[]) => any>() {
  const fns: T[] = []

  return {
    use(fn: T) {
      fns.push(fn)
      return () => {
        const i = fns.indexOf(fn)
        if (i !== -1) fns.splice(i, 1)
      }
    },
    clear() {
      fns.length = 0
    },
    getAll() {
      return [...fns]
    },
  }
}

export async function runRequestInterceptors(
  interceptors: RequestInterceptor[],
  url: string,
  options: HurlRequestOptions
): Promise<{ url: string; options: HurlRequestOptions }> {
  let current = { url, options }
  for (const fn of interceptors) {
    current = await fn(current.url, current.options)
  }
  return current
}

export async function runResponseInterceptors<T>(
  interceptors: ResponseInterceptor[],
  response: HurlResponse<T>
): Promise<HurlResponse<T>> {
  let current = response as HurlResponse
  for (const fn of interceptors) {
    current = await fn(current)
  }
  return current as HurlResponse<T>
}

export async function runErrorInterceptors(
  interceptors: ErrorInterceptor[],
  error: HurlError
): Promise<HurlError | HurlResponse> {
  let current: HurlError | HurlResponse = error
  for (const fn of interceptors) {
    if (current instanceof HurlError) {
      current = await fn(current)
    }
  }
  return current
}
