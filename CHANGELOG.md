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
