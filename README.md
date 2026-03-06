# @firekid/hurl

[![npm version](https://img.shields.io/npm/v/@firekid/hurl?style=flat-square&logo=npm&logoColor=white&color=CB3837)](https://npmjs.com/package/@firekid/hurl)
[![npm downloads](https://img.shields.io/npm/dm/@firekid/hurl?style=flat-square&logo=npm&logoColor=white&color=CB3837)](https://npmjs.com/package/@firekid/hurl)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@firekid/hurl?style=flat-square&logo=webpack&logoColor=white&color=2563EB)](https://bundlephobia.com/package/@firekid/hurl)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](./LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/firekid-is-him/hurl/ci.yml?style=flat-square&logo=githubactions&logoColor=white&label=CI)](https://github.com/firekid-is-him/hurl/actions)
[![GitHub stars](https://img.shields.io/github/stars/firekid-is-him/hurl?style=flat-square&logo=github&logoColor=white&color=FACC15)](https://github.com/firekid-is-him/hurl/stargazers)
[![Website](https://img.shields.io/badge/website-hurl.firekidofficial.name.ng-black?style=flat-square&logo=googlechrome&logoColor=white)](https://hurl.firekidofficial.name.ng)

**`@firekid/hurl`** is a modern, zero-dependency HTTP client for Node.js 18+, Cloudflare Workers, Vercel Edge Functions, Deno, and Bun — built on native fetch with retries, interceptors, auth helpers, in-memory caching, request deduplication, and full TypeScript support. Under 3KB gzipped.

```bash
npm install @firekid/hurl
```

---

## Why hurl?

Most HTTP clients make you choose between features and bundle size, or between Node.js support and edge compatibility. `@firekid/hurl` does neither.

```ts
import hurl from '@firekid/hurl'

// Retry automatically on failure
const res = await hurl.get('https://api.example.com/users', { retry: 3 })

// Auth, timeout, caching — all in one call
const data = await hurl.get('/users', {
  auth: { type: 'bearer', token: process.env.API_TOKEN },
  timeout: 5000,
  cache: { ttl: 60000 },
})

// Parallel requests
const [users, posts] = await hurl.all([
  hurl.get('/users'),
  hurl.get('/posts'),
])
```

---

## Comparison

| Feature | **hurl** | axios | ky | got | node-fetch |
|---|:---:|:---:|:---:|:---:|:---:|
| Zero dependencies | ✅ | ❌ | ✅ | ❌ | ✅ |
| Bundle size | **~3KB** | ~35KB | ~5KB | ~45KB | ~8KB |
| Node.js 18+ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cloudflare Workers | ✅ | ❌ | ✅ | ❌ | ❌ |
| Vercel Edge | ✅ | ❌ | ✅ | ❌ | ❌ |
| Deno / Bun | ✅ | ⚠️ | ✅ | ⚠️ | ❌ |
| Built-in retries | ✅ | ❌ | ✅ | ✅ | ❌ |
| Interceptors | ✅ | ✅ | ✅ | ❌ | ❌ |
| Auth helpers | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| In-memory cache | ✅ | ❌ | ❌ | ❌ | ❌ |
| Request deduplication | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload progress | ✅ | ✅ | ❌ | ❌ | ❌ |
| Download progress | ✅ | ✅ | ❌ | ❌ | ❌ |
| Proxy support | ✅ | ✅ | ❌ | ✅ | ❌ |
| CommonJS + ESM | ✅ | ✅ | ❌ | ❌ | ✅ |
| TypeScript (built-in) | ✅ | ⚠️ | ✅ | ✅ | ⚠️ |
| Throws on 4xx/5xx | ✅ | ✅ | ✅ | ✅ | ❌ |

> ✅ Full support &nbsp; ⚠️ Partial / via plugin &nbsp; ❌ Not supported

---

## Installation

```bash
npm install @firekid/hurl
yarn add @firekid/hurl
pnpm add @firekid/hurl
```

---

## Quick Start

```ts
import hurl from '@firekid/hurl'

const res = await hurl.get('https://api.example.com/users')

res.data        // parsed response body
res.status      // 200
res.headers     // Record<string, string>
res.requestId   // unique ID for this request
res.timing      // { start, end, duration }
res.fromCache   // boolean
```

---

## HTTP Methods

```ts
hurl.get<T>(url, options?)
hurl.post<T>(url, body?, options?)
hurl.put<T>(url, body?, options?)
hurl.patch<T>(url, body?, options?)
hurl.delete<T>(url, options?)
hurl.head(url, options?)
hurl.options<T>(url, options?)
hurl.request<T>(url, options?)
```

---

## Global Defaults

```ts
hurl.defaults.set({
  baseUrl: 'https://api.example.com',
  headers: { 'x-api-version': '2' },
  timeout: 10000,
  retry: 3,
})

hurl.defaults.get()
hurl.defaults.reset()
```

---

## Authentication

```ts
// Bearer token
hurl.defaults.set({ auth: { type: 'bearer', token: 'my-token' } })

// Basic auth
hurl.defaults.set({ auth: { type: 'basic', username: 'admin', password: 'secret' } })

// API key (header)
hurl.defaults.set({ auth: { type: 'apikey', key: 'x-api-key', value: 'my-key' } })

// API key (query param)
hurl.defaults.set({ auth: { type: 'apikey', key: 'token', value: 'my-key', in: 'query' } })
```

---

## Retry & Backoff

```ts
// Simple — retry 3 times with exponential backoff
await hurl.get('/users', { retry: 3 })

// Full config
await hurl.get('/users', {
  retry: {
    count: 3,
    delay: 300,
    backoff: 'exponential',
    on: [500, 502, 503],
  }
})
```

Retries are not triggered for abort errors. If no `on` array is provided, retries fire on network errors, timeout errors, and any 5xx status.

---

## Timeout & Abort

```ts
await hurl.get('/users', { timeout: 5000 })

const controller = new AbortController()
setTimeout(() => controller.abort(), 3000)
await hurl.get('/users', { signal: controller.signal })
```

---

## Interceptors

```ts
// Request interceptor
const remove = hurl.interceptors.request.use((url, options) => {
  return {
    url,
    options: {
      ...options,
      headers: { ...options.headers, 'x-trace-id': crypto.randomUUID() },
    },
  }
})
remove() // unregister

// Response interceptor
hurl.interceptors.response.use((response) => {
  console.log(response.status, response.timing.duration)
  return response
})

// Error interceptor
hurl.interceptors.error.use((error) => {
  if (error.status === 401) redirectToLogin()
  return error
})

// Clear all
hurl.interceptors.request.clear()
hurl.interceptors.response.clear()
hurl.interceptors.error.clear()
```

---

## Caching

Caching applies to GET requests only. Responses are stored in memory with a TTL in milliseconds.

```ts
await hurl.get('/users', { cache: { ttl: 60000 } })
await hurl.get('/users', { cache: { ttl: 60000, key: 'all-users' } })
await hurl.get('/users', { cache: { ttl: 60000, bypass: true } })
```

```ts
import { clearCache } from '@firekid/hurl'
clearCache()
```

---

## Request Deduplication

When `deduplicate` is true and the same GET URL is called multiple times simultaneously, only one network request is made.

```ts
const [a, b] = await Promise.all([
  hurl.get('/users', { deduplicate: true }),
  hurl.get('/users', { deduplicate: true }),
])
// only one network request fired
```

---

## Upload & Download Progress

```ts
// Upload
const form = new FormData()
form.append('file', file)

await hurl.post('/upload', form, {
  onUploadProgress: ({ loaded, total, percent }) => {
    console.log(`Uploading: ${percent}%`)
  }
})

// Download
await hurl.get('/large-file', {
  onDownloadProgress: ({ loaded, total, percent }) => {
    console.log(`Downloading: ${percent}%`)
  }
})
```

---

## Proxy

```ts
await hurl.get('/users', {
  proxy: { url: 'http://proxy.example.com:8080' }
})

await hurl.get('/users', {
  proxy: {
    url: 'socks5://proxy.example.com:1080',
    auth: { username: 'user', password: 'pass' }
  }
})
```

---

## Parallel Requests

```ts
const [users, posts] = await hurl.all([
  hurl.get('/users'),
  hurl.get('/posts'),
])
```

---

## Isolated Instances

```ts
const api = hurl.create({
  baseUrl: 'https://api.example.com',
  auth: { type: 'bearer', token: 'my-token' },
  timeout: 5000,
  retry: 3,
})

await api.get('/users')

// Extend with overrides
const adminApi = api.extend({
  headers: { 'x-role': 'admin' }
})
```

---

## Error Handling

`hurl` throws a `HurlError` on HTTP errors (4xx/5xx), network failures, timeouts, aborts, and parse failures. It never resolves silently on bad status codes.

```ts
import hurl, { HurlError } from '@firekid/hurl'

try {
  await hurl.get('/users')
} catch (err) {
  if (err instanceof HurlError) {
    err.type        // 'HTTP_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT_ERROR' | 'ABORT_ERROR' | 'PARSE_ERROR'
    err.status      // 404
    err.statusText  // 'Not Found'
    err.data        // parsed error response body
    err.headers     // response headers
    err.requestId   // same ID as the request
    err.retries     // number of retries attempted
  }
}
```

---

## TypeScript

```ts
type User = { id: number; name: string }

const res = await hurl.get<User[]>('/users')
res.data // User[]

const created = await hurl.post<User>('/users', { name: 'John' })
created.data.id // number
```

---

## Debug Mode

Logs the full request (method, url, headers, body, query, timeout, retry config) and response (status, timing, headers, data) to the console. Errors and retries are also logged.

```ts
await hurl.get('/users', { debug: true })
```

---

## Response Shape

```ts
type HurlResponse<T> = {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  requestId: string
  timing: {
    start: number
    end: number
    duration: number
  }
  fromCache: boolean
}
```

---

## Request Options

```ts
type HurlRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
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
```

---

## Environment Support

`@firekid/hurl` runs anywhere the Fetch API is available. No adapters, no polyfills needed.

| Runtime | Support |
|---|:---:|
| Node.js 18+ | ✅ |
| Cloudflare Workers | ✅ |
| Vercel Edge Functions | ✅ |
| Deno | ✅ |
| Bun | ✅ |

Exports both ESM (`import`) and CommonJS (`require`).

---

## Why Not Axios?

**axios** is 35KB, has no native edge runtime support, no built-in retry, no deduplication, and carries `XMLHttpRequest` baggage from a different era of the web.

**got** dropped CommonJS in v12 — if your project uses `require()`, you're stuck on an old version.

**ky** is browser-first. No Node.js, no proxy, no streaming.

**node-fetch** is a polyfill. Node.js has had native fetch since v18. You don't need it anymore.

**request** has been deprecated since 2020.

**`@firekid/hurl`** is built for how Node.js and the edge work today — native fetch, zero dependencies, everything included, works everywhere.

---

## API Reference

| Method | Description |
|---|---|
| `hurl.get(url, options?)` | GET request → `Promise<HurlResponse<T>>` |
| `hurl.post(url, body?, options?)` | POST request, body auto-serialized to JSON |
| `hurl.put(url, body?, options?)` | PUT request |
| `hurl.patch(url, body?, options?)` | PATCH request |
| `hurl.delete(url, options?)` | DELETE request |
| `hurl.head(url, options?)` | HEAD request → `Promise<HurlResponse<void>>` |
| `hurl.options(url, options?)` | OPTIONS request |
| `hurl.request(url, options?)` | Generic request, method from options |
| `hurl.all(requests)` | Run requests in parallel |
| `hurl.create(defaults?)` | New isolated instance |
| `hurl.extend(defaults?)` | New instance inheriting current defaults |
| `hurl.defaults.set(defaults)` | Set global defaults |
| `hurl.defaults.get()` | Get current defaults |
| `hurl.defaults.reset()` | Reset defaults to instance creation values |
| `hurl.interceptors.request.use(fn)` | Register request interceptor |
| `hurl.interceptors.response.use(fn)` | Register response interceptor |
| `hurl.interceptors.error.use(fn)` | Register error interceptor |
| `clearCache()` | Clear in-memory response cache |

---

## Contributors

[![HeavstalTech](https://github.com/HeavstalTech.png?size=32)](https://github.com/HeavstalTech) **[HeavstalTech](https://github.com/HeavstalTech)** — signal fix, cache hardening, test suite

---

Built with ♥️ by [Firekid](https://github.com/Firekid-is-him) · [MIT License](./LICENSE)
