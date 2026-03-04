# Changelog

## 1.0.3

- Fixed HEAD request body parsing — HEAD responses have no body by spec, parser now skips them correctly
- Fixed timeout error detection — timeouts now correctly throw TIMEOUT_ERROR instead of NETWORK_ERROR
- Fixed request deduplication — in-flight promise now registered before fetch fires so concurrent calls are deduplicated properly
- Removed source maps from published package

## 1.0.2

- Fixed HEAD request parsing
- Fixed timeout detection
- Fixed request deduplication timing
- Bumped version

## 1.0.1

- Fixed exports order in package.json — types condition moved before import and require

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
