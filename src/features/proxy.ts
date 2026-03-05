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
