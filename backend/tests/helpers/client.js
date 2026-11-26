import { realFetch } from './mockFetch.js'

// Tiny cookie-aware HTTP client. One instance = one browser session.
export class Client {
  constructor(base) {
    this.base = base
    this.cookie = ''
  }
  async req(method, path, body, extraHeaders = {}) {
    const headers = { 'content-type': 'application/json', ...extraHeaders }
    if (this.cookie) headers.cookie = this.cookie
    const res = await realFetch(this.base + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
    const setCookies = res.headers.getSetCookie?.() || []
    for (const c of setCookies) {
      const kv = c.split(';')[0]
      this.cookie = kv.endsWith('=') ? '' : kv
    }
    let json = null
    try { json = await res.json() } catch { /* empty body */ }
    return { status: res.status, json, headers: res.headers, setCookies }
  }
  get(p) { return this.req('GET', p) }
  post(p, b) { return this.req('POST', p, b) }
  patch(p, b) { return this.req('PATCH', p, b) }
  del(p) { return this.req('DELETE', p) }
}
