import { describe, it, expect } from 'vitest'
import hurl, { HurlError, createInstance, clearCache } from '../src/index'

describe('hurl', () => {
  it('exports default instance', () => {
    expect(hurl).toBeDefined()
  })

  it('has all HTTP methods', () => {
    expect(typeof hurl.get).toBe('function')
    expect(typeof hurl.post).toBe('function')
    expect(typeof hurl.put).toBe('function')
    expect(typeof hurl.patch).toBe('function')
    expect(typeof hurl.delete).toBe('function')
    expect(typeof hurl.head).toBe('function')
    expect(typeof hurl.options).toBe('function')
    expect(typeof hurl.request).toBe('function')
    expect(typeof hurl.all).toBe('function')
  })

  it('has defaults API', () => {
    expect(typeof hurl.defaults.set).toBe('function')
    expect(typeof hurl.defaults.get).toBe('function')
    expect(typeof hurl.defaults.reset).toBe('function')
  })

  it('has interceptors API', () => {
    expect(typeof hurl.interceptors.request.use).toBe('function')
    expect(typeof hurl.interceptors.response.use).toBe('function')
    expect(typeof hurl.interceptors.error.use).toBe('function')
  })

  it('can set and get defaults', () => {
    hurl.defaults.set({ baseUrl: 'https://api.example.com', timeout: 5000 })
    const defaults = hurl.defaults.get()
    expect(defaults.baseUrl).toBe('https://api.example.com')
    expect(defaults.timeout).toBe(5000)
    hurl.defaults.reset()
  })

  it('can create isolated instance', () => {
    const api = hurl.create({ baseUrl: 'https://api.example.com' })
    expect(api.defaults.get().baseUrl).toBe('https://api.example.com')
    expect(hurl.defaults.get().baseUrl).toBeUndefined()
  })

  it('interceptor returns removal function', () => {
    const remove = hurl.interceptors.request.use((url, opts) => ({ url, options: opts }))
    expect(typeof remove).toBe('function')
    remove()
  })

  it('exports HurlError class', () => {
    expect(HurlError).toBeDefined()
    const err = new HurlError({ message: 'test', type: 'HTTP_ERROR', requestId: '123' })
    expect(err.type).toBe('HTTP_ERROR')
    expect(err.requestId).toBe('123')
    expect(err instanceof Error).toBe(true)
  })

  it('exports createInstance', () => {
    expect(typeof createInstance).toBe('function')
  })

  it('exports clearCache', () => {
    expect(typeof clearCache).toBe('function')
    expect(() => clearCache()).not.toThrow()
  })
})
