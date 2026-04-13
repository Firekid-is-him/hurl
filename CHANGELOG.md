## 1.1.0 — 2026-04-13

### Added

**SSE (Server-Sent Events)**

- `hurl.sse(url, options)` — fetch-based SSE client that works where native `EventSource` cannot: supports POST requests, custom headers, Bearer/Basic/API key auth, `baseUrl`, and query params
- Parses the full `text/event-stream` wire format — `data`, `event`, `id`, and `retry` fields
- Handles the `data: [DONE]` sentinel used by OpenAI, Anthropic, and other AI APIs — fires `onDone` and closes cleanly
- Returns `{ close() }` synchronously so you can cancel the stream at any time
- Respects an external `AbortSignal` passed via `options.signal`
- `SSEOptions` and `SSEEvent` types are exported

**Circuit Breaker**

- `circuitBreaker` option on both per-request options and instance defaults
- Three-state machine: CLOSED → OPEN → HALF_OPEN → CLOSED
- `threshold` — number of consecutive failures before the circuit opens
- `cooldown` — how long (ms) to wait before allowing a probe request through
- `key` — optional custom key for the breaker; defaults to the URL origin so all requests to the same host share one breaker
- `fallback` — optional function that returns a value to use when the circuit is open instead of throwing
- When the circuit is open and no fallback is set, throws a `HurlError` with type `CIRCUIT_OPEN`
- Aborted requests and circuit-open errors do not count as failures
- `getCircuitStats(key)` exported from the main entry point for observability
- `CIRCUIT_OPEN` added to the `HurlErrorType` union


---

## 1.0.7 — 2026-03-07

### Fixed
- `invalidateCache` was missing from package exports — it existed internally but was unreachable by users. Now properly exported from the main entry point.
- `extend()` now correctly inherits parent interceptors into the child instance. Previously all interceptors were silently dropped on `extend()`.
- Proxy documentation corrected with accurate per-version guidance: Node 18 requires `undici@6` + `ProxyAgent`, Node 20 uses bundled `ProxyAgent`, Node 22.3+ supports `EnvHttpProxyAgent`, Node 24+ supports `NODE_USE_ENV_PROXY=1`.

### Added
- `throwOnError` option documented in README — set to `false` to receive 4xx/5xx responses without throwing. Was implemented since 1.0.4 but never documented.

### Tests
- Added error interceptor tests — recovery from `HurlError`, re-throw behavior
- Added `extend()` interceptor inheritance test
- Added `create()` isolation test confirming interceptors are NOT inherited

## 1.0.5 — 2026-03-05

### Fixed
- Signal pre-check to prevent hanging retries on already-aborted signals
- Added `{ once: true }` to abort listener for automatic self-cleanup
- LRU cache limit (1000 entries) to prevent unbounded memory growth
- ArrayBuffer deep clone on cache read to prevent mutation vulnerabilities

### Improved
- Test suite now uses properly mocked fetch for reliable CI

### Contributors
- HeavstalTech: signal fix, cache hardening, test suite

## 1.0.4

- Fixed stream buffering — response body no longer loaded into memory when `stream: true`, body is returned as raw `ReadableStream` for the caller to pipe directly to disk
- Fixed `buildBody` not handling `ReadableStream` or Node.js `Readable` streams — upload streaming now works correctly
- Fixed `onUploadProgress` never firing — implemented via `TransformStream` wrapping the request body
- Fixed `onDownloadProgress` firing on text and JSON — progress tracking now only fires for binary content types (images, video, audio, octet-stream)
- Fixed `trackDownloadProgress` buffering entire response — now returns `ArrayBuffer` directly instead of decoding to string
- Fixed `options.signal` abort listener never removed — listener is now cleaned up in `finally` block preventing memory leak on long-lived signals
- Fixed `btoa` breaking on non-ASCII passwords in Basic auth — replaced with `Buffer.from` in Node.js with proper UTF-8 fallback for edge runtimes and browsers
- Fixed `Math.random` request IDs — now uses `crypto.randomUUID()` with `Math.random` fallback for environments that don't support it
- Fixed `Content-Type: application/json` being set on stream bodies incorrectly — streams, Blobs, and ArrayBuffers are now excluded
- Fixed `stream` option not being passed to `parseResponseBody` — was being silently ignored
- Fixed proxy option silently doing nothing — now logs a clear warning in debug mode pointing to `HTTP_PROXY`/`HTTPS_PROXY` env vars
- Added `throwOnError` option — set to `false` to receive 4xx and 5xx responses without throwing, defaults to `true`

## 1.0.3

- Fixed HEAD request body parsing — HEAD responses have no body by spec, parser now skips them correctly
- Fixed timeout error detection — timeouts now correctly throw TIMEOUT_ERROR instead of NETWORK_ERROR
- Fixed request deduplication — in-flight promise now registered before fetch fires so concurrent calls are deduplicated properly
- Removed source maps from published package

## 1.0.2

- Fixed exports order in package.json — types condition moved before import and require

## 1.0.1

- Fixed SSRF vulnerability in buildUrl — absolute URLs with different origins are now rejected to prevent auth token leakage

## 1.0.0

Initial release.

- GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- Auto JSON serialize and deserialize
- Auto content-type detection
- Query params as object
- Custom headers per request
- Base URL support
- Default headers globally
- Throws on 4xx and 5xx automatically
- Custom HurlError class with type, status, data, headers, requestId, retries
- Auto retry with exponential backoff
- Per-request timeout and global default
- Abort controller support
- Request, response, and error interceptors
- Bearer, Basic, and API key authentication
- Multipart file uploads
- Upload and download progress tracking
- Stream large responses
- HTTP, HTTPS, and SOCKS5 proxy support
- TTL-based in-memory response caching
- Request deduplication
- Debug mode
- Named isolated instances via create() and extend()
- Parallel requests via hurl.all()
- Full TypeScript types with zero config
- Dual ESM and CommonJS export
- Node.js 18+, Cloudflare Workers, Vercel Edge, Deno, Bun
- Zero runtime dependencies
