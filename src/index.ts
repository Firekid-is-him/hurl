import {
  HurlRequestOptions,
  HurlDefaults,
  HurlResponse,
  HurlInstance,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  HurlError,
} from './types/index.js'
import { executeRequest } from './core/request.js'
import {
  createInterceptorStore,
  runRequestInterceptors,
  runResponseInterceptors,
  runErrorInterceptors,
} from './features/interceptors.js'
import { clearCache } from './features/cache.js'

function createInstance(initialDefaults: HurlDefaults = {}): HurlInstance {
  let defaults: HurlDefaults = { ...initialDefaults }

  const requestInterceptors = createInterceptorStore<RequestInterceptor>()
  const responseInterceptors = createInterceptorStore<ResponseInterceptor>()
  const errorInterceptors = createInterceptorStore<ErrorInterceptor>()

  async function request<T>(url: string, options: HurlRequestOptions = {}): Promise<HurlResponse<T>> {
    let finalUrl = url
    let finalOptions = options

    const reqInterceptors = requestInterceptors.getAll()
    const resInterceptors = responseInterceptors.getAll()
    const errInterceptors = errorInterceptors.getAll()

    if (reqInterceptors.length > 0) {
      const result = await runRequestInterceptors(reqInterceptors, url, options)
      finalUrl = result.url
      finalOptions = result.options
    }

    try {
      const response = await executeRequest<T>(finalUrl, finalOptions, defaults)

      if (resInterceptors.length > 0) {
        return await runResponseInterceptors(resInterceptors, response)
      }

      return response
    } catch (err) {
      if (err instanceof HurlError && errInterceptors.length > 0) {
        const result = await runErrorInterceptors(errInterceptors, err)
        if (!(result instanceof HurlError)) return result as HurlResponse<T>
        throw result
      }
      throw err
    }
  }

  const instance: HurlInstance = {
    request,

    get<T>(url: string, options?: HurlRequestOptions) {
      return request<T>(url, { ...options, method: 'GET' })
    },

    post<T>(url: string, body?: unknown, options?: HurlRequestOptions) {
      return request<T>(url, { ...options, method: 'POST', body })
    },

    put<T>(url: string, body?: unknown, options?: HurlRequestOptions) {
      return request<T>(url, { ...options, method: 'PUT', body })
    },

    patch<T>(url: string, body?: unknown, options?: HurlRequestOptions) {
      return request<T>(url, { ...options, method: 'PATCH', body })
    },

    delete<T>(url: string, options?: HurlRequestOptions) {
      return request<T>(url, { ...options, method: 'DELETE' })
    },

    head(url: string, options?: HurlRequestOptions) {
      return request<void>(url, { ...options, method: 'HEAD' })
    },

    options<T>(url: string, options?: HurlRequestOptions) {
      return request<T>(url, { ...options, method: 'OPTIONS' })
    },

    all<T extends unknown[]>(requests: { [K in keyof T]: Promise<T[K]> }) {
      return Promise.all(requests) as Promise<T>
    },

    defaults: {
      set(d: HurlDefaults) {
        defaults = { ...defaults, ...d }
      },
      get() {
        return { ...defaults }
      },
      reset() {
        defaults = { ...initialDefaults }
      },
    },

    interceptors: {
      request: {
        use: requestInterceptors.use.bind(requestInterceptors),
        clear: requestInterceptors.clear.bind(requestInterceptors),
      },
      response: {
        use: responseInterceptors.use.bind(responseInterceptors),
        clear: responseInterceptors.clear.bind(responseInterceptors),
      },
      error: {
        use: errorInterceptors.use.bind(errorInterceptors),
        clear: errorInterceptors.clear.bind(errorInterceptors),
      },
    },

    create(newDefaults?: HurlDefaults) {
      return createInstance({ ...defaults, ...newDefaults })
    },

    extend(newDefaults?: HurlDefaults) {
      return createInstance({ ...defaults, ...newDefaults })
    },
  }

  return instance
}

const hurl = createInstance()

export default hurl
export { HurlError, createInstance, clearCache }
export type {
  HurlRequestOptions,
  HurlDefaults,
  HurlResponse,
  HurlInstance,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
}
