export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export type AuthConfig =
  | { type: 'bearer'; token: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'apikey'; key: string; value: string; in?: 'header' | 'query' }

export type ProxyConfig = {
  url: string
  auth?: { username: string; password: string }
}

export type RetryConfig = {
  count: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  on?: number[]
}

export type CacheConfig = {
  ttl: number
  key?: string
  bypass?: boolean
}

export type ProgressCallback = (e: { loaded: number; total: number; percent: number }) => void

export type HurlRequestOptions = {
  method?: Method
  headers?: Record<string, string>
  body?: unknown
  query?: Record<string, string | number | boolean>
  timeout?: number
  retry?: RetryConfig | number
  auth?: AuthConfig
  proxy?: ProxyConfig
  cache?: CacheConfig
  signal?: AbortSignal
  followRedirects?: boolean
  maxRedirects?: number
  onUploadProgress?: ProgressCallback
  onDownloadProgress?: ProgressCallback
  stream?: boolean
  debug?: boolean
  requestId?: string
  deduplicate?: boolean
}

export type HurlDefaults = Omit<HurlRequestOptions, 'body' | 'method'> & {
  baseUrl?: string
}

export type HurlResponse<T = unknown> = {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  requestId: string
  timing: { start: number; end: number; duration: number }
  fromCache: boolean
}

export type RequestInterceptor = (
  url: string,
  options: HurlRequestOptions
) => Promise<{ url: string; options: HurlRequestOptions }> | { url: string; options: HurlRequestOptions }

export type ResponseInterceptor<T = unknown> = (
  response: HurlResponse<T>
) => Promise<HurlResponse<T>> | HurlResponse<T>

export type ErrorInterceptor = (
  error: HurlError
) => Promise<HurlError | HurlResponse> | HurlError | HurlResponse

export type HurlErrorType = 'HTTP_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT_ERROR' | 'ABORT_ERROR' | 'PARSE_ERROR'

export class HurlError extends Error {
  type: HurlErrorType
  status?: number
  statusText?: string
  data?: unknown
  headers?: Record<string, string>
  requestId: string
  retries: number

  constructor(params: {
    message: string
    type: HurlErrorType
    status?: number
    statusText?: string
    data?: unknown
    headers?: Record<string, string>
    requestId: string
    retries?: number
  }) {
    super(params.message)
    this.name = 'HurlError'
    this.type = params.type
    this.status = params.status
    this.statusText = params.statusText
    this.data = params.data
    this.headers = params.headers
    this.requestId = params.requestId
    this.retries = params.retries ?? 0
  }
}

export type HurlInstance = {
  get<T = unknown>(url: string, options?: HurlRequestOptions): Promise<HurlResponse<T>>
  post<T = unknown>(url: string, body?: unknown, options?: HurlRequestOptions): Promise<HurlResponse<T>>
  put<T = unknown>(url: string, body?: unknown, options?: HurlRequestOptions): Promise<HurlResponse<T>>
  patch<T = unknown>(url: string, body?: unknown, options?: HurlRequestOptions): Promise<HurlResponse<T>>
  delete<T = unknown>(url: string, options?: HurlRequestOptions): Promise<HurlResponse<T>>
  head(url: string, options?: HurlRequestOptions): Promise<HurlResponse<void>>
  options<T = unknown>(url: string, options?: HurlRequestOptions): Promise<HurlResponse<T>>
  request<T = unknown>(url: string, options?: HurlRequestOptions): Promise<HurlResponse<T>>
  all<T extends unknown[]>(requests: { [K in keyof T]: Promise<T[K]> }): Promise<T>
  defaults: {
    set(d: HurlDefaults): void
    get(): HurlDefaults
    reset(): void
  }
  interceptors: {
    request: { use(fn: RequestInterceptor): () => void; clear(): void }
    response: { use(fn: ResponseInterceptor): () => void; clear(): void }
    error: { use(fn: ErrorInterceptor): () => void; clear(): void }
  }
  create(defaults?: HurlDefaults): HurlInstance
  extend(defaults?: HurlDefaults): HurlInstance
}
