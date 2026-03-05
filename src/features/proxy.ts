import { ProxyConfig } from '../types/index.js'

export function buildProxyAgent(proxy: ProxyConfig) {
  const url = new URL(proxy.url)

  if (proxy.auth) {
    url.username = proxy.auth.username
    url.password = proxy.auth.password
  }

  return { proxyUrl: url.toString(), isSocks: url.protocol.startsWith('socks') }
}

export function isNodeEnv(): boolean {
  return typeof (globalThis as any).process !== 'undefined'
}

// FIX: Added a resolver function to safely extract the correct proxy options for the current runtime.
// It uses Bun's native fetch extension, or dynamically loads undici in Node.js without breaking Edge bundlers.
export async function resolveProxyOptions(proxy: ProxyConfig | undefined, debug: boolean): Promise<Record<string, any>> {
  if (!proxy) return {}

  const { proxyUrl } = buildProxyAgent(proxy)

  // Bun natively supports the `proxy` property in fetch options
  if (typeof (globalThis as any).Bun !== 'undefined') {
    return { proxy: proxyUrl }
  }

  // Node.js native fetch requires an undici dispatcher
  if (isNodeEnv()) {
    try {
      // Dynamic import with variable prevents Edge/Cloudflare bundlers from crashing at build time
      const undiciPkg = 'undici'
      const { ProxyAgent } = await import(undiciPkg)
      return { dispatcher: new ProxyAgent(proxyUrl) }
    } catch (e) {
      if (debug) {
        console.warn('[hurl] To use proxies with native fetch in Node.js, please run "npm install undici".')
      }
    }
  } else if (debug) {
    console.warn('[hurl] Proxies are only supported in Bun and Node.js (with undici).')
  }

  return {}
}
