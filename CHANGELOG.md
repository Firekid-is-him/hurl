# Changelog

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
- Chainable-friendly API
- Dual ESM and CommonJS export
- Node.js 18+, Cloudflare Workers, Vercel Edge, Deno, Bun
- Zero runtime dependencies
