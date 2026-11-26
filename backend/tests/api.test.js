// InvestCircle backend API tests (Node's built-in test runner -- no extra dependencies).
//
//   TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/investcircle_test npm test
//
// WARNING: the suite runs `seed.js`, which resets demo data. Use a dedicated test database.
// Finnhub / OpenRouter / Gemini are mocked in helpers/mockFetch.js, so no API keys are needed.
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { installMock, flags, calls, resetMock } from './helpers/mockFetch.js'
import { Client } from './helpers/client.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEST_DB = process.env.TEST_DATABASE_URL
if (!TEST_DB) throw new Error('Set TEST_DATABASE_URL to a dedicated test database (it will be reseeded).')
if (!/test/i.test(TEST_DB) && process.env.ALLOW_NON_TEST_DB !== '1') {
  throw new Error('TEST_DATABASE_URL does not contain "test". Refusing to reseed it (set ALLOW_NON_TEST_DB=1 to override).')
}

process.env.DATABASE_URL = TEST_DB
process.env.JWT_SECRET = 'test-secret'
process.env.FINNHUB_API_KEY = 'fake-finnhub'
process.env.OPENROUTER_API_KEY = 'fake-openrouter'
installMock()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const uniq = Date.now()
let server, base, pool
let SEED_USER, SEED_POST // ids of seeded rows (serial ids are not guaranteed to start at 1)
const anon = () => new Client(base)

before(async () => {
  execFileSync(process.execPath, ['seed.js'], { cwd: ROOT, env: process.env, stdio: 'ignore' })
  const { default: app } = await import('../app.js')
  pool = (await import('../db.js')).default
  server = http.createServer(app)
  await new Promise((r) => server.listen(0, r))
  base = `http://localhost:${server.address().port}`
  SEED_USER = (await pool.query("SELECT id FROM users WHERE email = 'lakshay@investcircle.dev'")).rows[0].id
  SEED_POST = (await pool.query('SELECT id FROM posts ORDER BY id LIMIT 1')).rows[0].id
})

after(async () => {
  await new Promise((r) => server.close(r))
  await pool.end()
})

describe('Auth', () => {
  const email = `test${uniq}@x.dev`
  const u = () => (u.c ??= new Client(base))

  it('signup with valid data -> 201, session cookie, no password hash', async () => {
    const r = await u().post('/api/auth/signup', { email, password: 'secret1', displayName: 'Test User' })
    assert.equal(r.status, 201)
    assert.match(u().cookie, /^ic_session=/)
    assert.ok(!('password_hash' in r.json))
    assert.match(r.json.handle, /^test_user_\d+$/)
  })
  it('session cookie is HttpOnly, SameSite=Lax, 7 days', async () => {
    const x = anon()
    const r = await x.post('/api/auth/signup', { email: `f${email}`, password: 'secret1', displayName: 'F' })
    const c = r.setCookies[0]
    assert.match(c, /HttpOnly/i)
    assert.match(c, /SameSite=Lax/i)
    assert.match(c, /Max-Age=604800/)
  })
  it('duplicate e-mail -> 409', async () => {
    assert.equal((await anon().post('/api/auth/signup', { email, password: 'secret1', displayName: 'D' })).status, 409)
  })
  it('missing field -> 400', async () => {
    assert.equal((await anon().post('/api/auth/signup', { email: 'a@b.c', password: 'secret1' })).status, 400)
  })
  it('password shorter than 6 -> 400', async () => {
    assert.equal((await anon().post('/api/auth/signup', { email: 's@b.c', password: '123', displayName: 'S' })).status, 400)
  })
  it('login with seeded user -> 200 + cookie', async () => {
    const x = anon()
    const r = await x.post('/api/auth/login', { email: 'lakshay@investcircle.dev', password: 'password123' })
    assert.equal(r.status, 200)
    assert.match(x.cookie, /ic_session=/)
  })
  it('wrong password -> 401', async () => {
    assert.equal((await anon().post('/api/auth/login', { email: 'lakshay@investcircle.dev', password: 'bad' })).status, 401)
  })
  it('unknown e-mail -> 401', async () => {
    assert.equal((await anon().post('/api/auth/login', { email: 'no@no.no', password: 'x' })).status, 401)
  })
  it('GET /me without session -> 401', async () => {
    assert.equal((await anon().get('/api/auth/me')).status, 401)
  })
  it('GET /me with session -> user', async () => {
    const r = await u().get('/api/auth/me')
    assert.equal(r.status, 200)
    assert.equal(r.json.email, email)
  })
  it('tampered JWT -> 401', async () => {
    const x = anon()
    x.cookie = 'ic_session=abc.def.ghi'
    assert.equal((await x.get('/api/auth/me')).status, 401)
  })
  it('logout clears the session', async () => {
    const x = anon()
    await x.post('/api/auth/login', { email: 'ishan@investcircle.dev', password: 'password123' })
    assert.equal((await x.post('/api/auth/logout')).status, 200)
    assert.equal((await x.get('/api/auth/me')).status, 401)
  })
})

describe('Discussions', () => {
  const author = new Client(base)
  const other = new Client(base)
  let pid, cid
  before(async () => {
    author.base = other.base = base
    await author.post('/api/auth/signup', { email: `a${uniq}@x.dev`, password: 'secret1', displayName: 'Author' })
    await other.post('/api/auth/login', { email: 'lakshay@investcircle.dev', password: 'password123' })
  })

  it('list posts is public and has score & comment_count', async () => {
    const r = await anon().get('/api/posts')
    assert.equal(r.status, 200)
    assert.ok(r.json.length >= 4)
    assert.ok('score' in r.json[0] && 'comment_count' in r.json[0])
  })
  it('sort = new / top / hot / unknown all return 200', async () => {
    for (const s of ['new', 'top', 'hot', 'zzz']) assert.equal((await anon().get(`/api/posts?sort=${s}`)).status, 200)
  })
  it('search q=nvda filters posts', async () => {
    const r = await anon().get('/api/posts?q=nvda')
    assert.ok(r.json.length >= 1 && r.json.length < 4)
  })
  it('create post without login -> 401', async () => {
    assert.equal((await anon().post('/api/posts', { title: 'a', body: 'b' })).status, 401)
  })
  it('create post without body -> 400', async () => {
    assert.equal((await author.post('/api/posts', { title: 'a' })).status, 400)
  })
  it('create post -> 201 + id', async () => {
    const r = await author.post('/api/posts', { title: 'NVDA will beat Q4', body: 'Data-centre demand', tickers: ['NVDA', 'AMD'] })
    assert.equal(r.status, 201)
    pid = r.json.id
    assert.ok(pid > 0)
  })
  it('creating a post broadcasts a notification', async () => {
    await sleep(300)
    const r = await anon().get('/api/notifications')
    assert.ok(r.json.notifications.some((n) => /New Discussion/.test(n.title) && n.user_id === null))
  })
  it('get single post', async () => {
    const r = await anon().get(`/api/posts/${pid}`)
    assert.equal(r.status, 200)
    assert.equal((r.json.post ?? r.json).title, 'NVDA will beat Q4')
  })
  it('vote +1, -1, 0 -> score 1, -1, 0', async () => {
    const a = await author.post(`/api/posts/${pid}/vote`, { value: 1 })
    const b = await author.post(`/api/posts/${pid}/vote`, { value: -1 })
    const c = await author.post(`/api/posts/${pid}/vote`, { value: 0 })
    assert.deepEqual([a, b, c].map((x) => Number(x.json.score)), [1, -1, 0])
  })
  it('invalid vote value -> 400', async () => {
    assert.equal((await author.post(`/api/posts/${pid}/vote`, { value: 5 })).status, 400)
  })
  it('vote without login -> 401', async () => {
    assert.equal((await anon().post(`/api/posts/${pid}/vote`, { value: 1 })).status, 401)
  })
  it('comment by another user -> 201', async () => {
    const r = await other.post(`/api/posts/${pid}/comments`, { body: 'Agree, great call' })
    assert.equal(r.status, 201)
    cid = r.json.id
  })
  it('comment notifies the post owner', async () => {
    await sleep(300)
    const r = await author.get('/api/notifications')
    assert.ok(r.json.notifications.some((n) => n.user_id !== null && /comment|reply/i.test(n.type + n.title)))
  })
  it('empty comment -> 400', async () => {
    assert.equal((await other.post(`/api/posts/${pid}/comments`, { body: '' })).status, 400)
  })
  it('comment on unknown post -> 404', async () => {
    assert.equal((await other.post('/api/posts/999999/comments', { body: 'x' })).status, 404)
  })
  it('threaded reply -> 201', async () => {
    assert.equal((await author.post(`/api/posts/${pid}/comments`, { body: 'Thanks', parentId: cid })).status, 201)
  })
  it('reply whose parent is on another post -> 400', async () => {
    assert.equal((await author.post(`/api/posts/${SEED_POST}/comments`, { body: 'x', parentId: cid })).status, 400)
  })
  it('reaction toggles on and off', async () => {
    const a = await author.post(`/api/posts/${pid}/comments/${cid}/react`, { kind: 'insightful' })
    const b = await author.post(`/api/posts/${pid}/comments/${cid}/react`, { kind: 'insightful' })
    assert.equal(Number(a.json.insightful_count), 1)
    assert.equal(a.json.my_reaction, 'insightful')
    assert.equal(Number(b.json.insightful_count), 0)
    assert.equal(b.json.my_reaction, null)
  })
  it('invalid reaction kind -> 400', async () => {
    assert.equal((await author.post(`/api/posts/${pid}/comments/${cid}/react`, { kind: 'boom' })).status, 400)
  })
})

describe('Watchlist', () => {
  const c = new Client(base)
  before(async () => {
    c.base = base
    await c.post('/api/auth/signup', { email: `w${uniq}@x.dev`, password: 'secret1', displayName: 'Watcher' })
  })
  it('list without login -> 401', async () => {
    assert.equal((await anon().get('/api/watchlist')).status, 401)
  })
  it('add ticker upper-cases and trims', async () => {
    const r = await c.post('/api/watchlist', { ticker: ' aapl ', buyPrice: 150, quantity: 3 })
    assert.equal(r.status, 201)
    assert.equal(r.json.ticker, 'AAPL')
  })
  it('adding the same ticker updates the row', async () => {
    await c.post('/api/watchlist', { ticker: 'AAPL', buyPrice: 160, quantity: 5 })
    const r = await c.get('/api/watchlist')
    assert.equal(r.json.length, 1)
    assert.equal(Number(r.json[0].quantity), 5)
  })
  it('empty ticker -> 400', async () => {
    assert.equal((await c.post('/api/watchlist', { ticker: '  ' })).status, 400)
  })
  it('delete ticker', async () => {
    await c.del('/api/watchlist/aapl')
    assert.equal((await c.get('/api/watchlist')).json.length, 0)
  })
})

describe('Profile', () => {
  const c = new Client(base)
  before(async () => {
    c.base = base
    await c.post('/api/auth/signup', { email: `p${uniq}@x.dev`, password: 'secret1', displayName: 'Profiler' })
  })
  it('update display name and bio', async () => {
    const r = await c.patch('/api/users/me', { displayName: 'Renamed', bio: 'hello' })
    assert.equal(r.status, 200)
    assert.equal(r.json.display_name ?? r.json.displayName, 'Renamed')
  })
  it('rejects a non-image avatar', async () => {
    assert.equal((await c.patch('/api/users/me', { avatar: 'javascript:alert(1)' })).status, 400)
  })
  it('accepts a small PNG data-URL avatar', async () => {
    assert.equal((await c.patch('/api/users/me', { avatar: 'data:image/png;base64,iVBORw0KGgo=' })).status, 200)
  })
  it('public profile has stats', async () => {
    const r = await anon().get(`/api/users/${SEED_USER}`)
    assert.equal(r.status, 200)
    assert.ok(r.json.stats)
  })
  it('unknown user -> 404', async () => {
    assert.equal((await anon().get('/api/users/99999')).status, 404)
  })
  it("user's posts and comments lists", async () => {
    const a = await anon().get(`/api/users/${SEED_USER}/posts`)
    const b = await anon().get(`/api/users/${SEED_USER}/comments`)
    assert.ok(a.status === 200 && b.status === 200 && Array.isArray(a.json) && Array.isArray(b.json))
  })
})

describe('Notifications', () => {
  const c = new Client(base)
  let nid
  before(async () => {
    c.base = base
    await c.post('/api/auth/signup', { email: `n${uniq}@x.dev`, password: 'secret1', displayName: 'Notified' })
  })
  it('anonymous caller sees only broadcasts', async () => {
    const r = await anon().get('/api/notifications')
    assert.equal(r.status, 200)
    assert.ok(r.json.notifications.every((n) => n.user_id === null))
  })
  it('create requires login', async () => {
    assert.equal((await anon().post('/api/notifications', { title: 'a', message: 'b' })).status, 401)
  })
  it('create requires title and message', async () => {
    assert.equal((await c.post('/api/notifications', { title: 'a' })).status, 400)
  })
  it('broadcast increases unreadCount', async () => {
    const before = (await c.get('/api/notifications')).json.unreadCount
    const r = await c.post('/api/notifications', { title: 'Alert', message: 'Test' })
    nid = r.json?.id ?? r.json?.notification?.id
    assert.equal(r.status, 201)
    assert.equal((await c.get('/api/notifications')).json.unreadCount, before + 1)
  })
  it('mark one read', async () => {
    const before = (await c.get('/api/notifications')).json.unreadCount
    assert.equal((await c.patch(`/api/notifications/${nid}/read`)).status, 200)
    assert.equal((await c.get('/api/notifications')).json.unreadCount, before - 1)
  })
  it('mark all read', async () => {
    await c.post('/api/notifications/read-all')
    assert.equal((await c.get('/api/notifications')).json.unreadCount, 0)
  })
  it('simulate market alert adds a row', async () => {
    const before = (await c.get('/api/notifications')).json.notifications.length
    const r = await anon().post('/api/notifications/simulate')
    assert.ok(r.status < 300)
    assert.ok((await c.get('/api/notifications')).json.notifications.length > before)
  })
})

describe('Seeded news (legacy endpoint)', () => {
  it('list', async () => {
    const r = await anon().get('/api/news')
    assert.equal(r.status, 200)
    assert.ok(r.json.length >= 4)
  })
  it('unknown id -> 404', async () => {
    assert.equal((await anon().get('/api/news/99999')).status, 404)
  })
})

describe('Live news and AI company matching', () => {
  let live, match
  before(() => resetMock())
  after(() => resetMock())

  it('empty feed when FINNHUB_API_KEY is missing', async () => {
    const key = process.env.FINNHUB_API_KEY
    delete process.env.FINNHUB_API_KEY
    try {
      const r = await anon().get('/api/news/live')
      assert.equal(r.status, 200)
      assert.deepEqual(r.json, [])
    } finally { process.env.FINNHUB_API_KEY = key }
  })
  it('feed is deduplicated, company-named, newest first', async () => {
    const r = await anon().get('/api/news/live')
    live = r.json
    const heads = live.map((x) => x.headline)
    assert.equal(r.status, 200)
    assert.ok(live.length > 0)
    assert.equal(new Set(heads).size, heads.length)
    assert.ok(!heads.some((h) => /Plug Power/.test(h)))
    assert.ok(live.every((x, i) => i === 0 || live[i - 1].publishedAt >= x.publishedAt))
  })
  it('at most 2 articles per ticker', async () => {
    const count = {}
    live.forEach((x) => { count[x.ticker] = (count[x.ticker] || 0) + 1 })
    assert.ok(Math.max(...Object.values(count)) <= 2)
  })
  it('second call is served from the 5-minute cache', async () => {
    calls.length = 0
    await anon().get('/api/news/live')
    assert.equal(calls.filter((c) => c === 'finnhub_news').length, 0)
  })
  it('match for unknown article -> 404', async () => {
    assert.equal((await anon().get('/api/news/live/zzz/company')).status, 404)
  })
  it('match without API keys -> 503', async () => {
    const k = process.env.FINNHUB_API_KEY
    delete process.env.FINNHUB_API_KEY
    try { assert.equal((await anon().get('/api/news/live/1/company')).status, 503) } finally { process.env.FINNHUB_API_KEY = k }
  })
  it('LLM picks the company, Finnhub supplies the numbers', async () => {
    const r = await anon().get(`/api/news/live/${live[0].id}/company`)
    match = r.json
    assert.equal(r.status, 200)
    assert.ok(match.ticker)
    assert.match(JSON.stringify(match), /200\.46|200\.456/)
  })
  it('match result is cached (no second LLM call)', async () => {
    calls.length = 0
    await anon().get(`/api/news/live/${live[0].id}/company`)
    assert.equal(calls.filter((c) => c === 'openrouter').length, 0)
  })
  it('LLM down -> falls back to the feed ticker', async () => {
    flags.llmDown = true
    const a = live.find((x) => x.id !== live[0].id)
    const r = await anon().get(`/api/news/live/${a.id}/company`)
    delete flags.llmDown
    assert.equal(r.status, 200)
    assert.equal(r.json.ticker, a.ticker)
  })
  it('secondary company not in match list -> 404', async () => {
    assert.equal((await anon().get(`/api/news/live/${live[0].id}/company/QQQQ`)).status, 404)
  })
  it('valid secondary company (INTC) returns verified data', async () => {
    const a = live[2] || live[0]
    await anon().get(`/api/news/live/${a.id}/company`)
    const r = await anon().get(`/api/news/live/${a.id}/company/INTC`)
    assert.equal(r.status, 200)
    assert.ok(r.json.data && r.json.data.price != null)
  })
  it('unverifiable secondary (ZZZZ) is listed but has data = null', async () => {
    const a = live[3] || live[0]
    const m = (await anon().get(`/api/news/live/${a.id}/company`)).json
    assert.ok((m.secondary || []).some((s) => s.ticker === 'ZZZZ'))
    const r = await anon().get(`/api/news/live/${a.id}/company/ZZZZ`)
    assert.equal(r.status, 200)
    assert.equal(r.json.data, null)
  })
})

describe('Accuracy engine (Gemini)', () => {
  before(() => resetMock())
  after(() => resetMock())

  it('no API key -> 400 apiKeyRequired', async () => {
    const r = await anon().post(`/api/users/${SEED_USER}/accuracy`, {})
    assert.equal(r.status, 400)
    assert.equal(r.json.apiKeyRequired, true)
  })
  it('unknown user -> 404', async () => {
    assert.equal((await anon().post('/api/users/99999/accuracy', { apiKey: 'k' })).status, 404)
  })
  it('accuracy = hits / (hits + misses) x 100 and is stored', async () => {
    const r = await anon().post(`/api/users/${SEED_USER}/accuracy`, { apiKey: 'fake' })
    const d = r.json.details || {}
    assert.equal(r.status, 200)
    assert.equal(d.accuracy, Math.round((d.hits / (d.hits + d.misses)) * 100))
    const p = await anon().get(`/api/users/${SEED_USER}`)
    assert.ok(p.json.stats.accuracy != null)
  })
  it('creates an accuracy_call notification', async () => {
    await sleep(300)
    const x = anon()
    await x.post('/api/auth/login', { email: 'lakshay@investcircle.dev', password: 'password123' })
    const r = await x.get('/api/notifications')
    assert.ok(r.json.notifications.some((n) => n.type === 'accuracy_call' && /Accuracy Score/.test(n.title)))
  })
  it('search tool rejected -> retries without grounding', async () => {
    flags.geminiToolError = true
    calls.length = 0
    const r = await anon().post(`/api/users/${SEED_USER}/accuracy`, { apiKey: 'fake' })
    delete flags.geminiToolError
    const g = calls.filter((c) => c.startsWith('gemini'))
    assert.equal(r.status, 200)
    assert.ok(g.some((c) => c.includes('_search_')) && g.some((c) => c.includes('_nosearch_')))
  })
  it('invalid Gemini key -> error status', async () => {
    flags.geminiBadKey = true
    const r = await anon().post(`/api/users/${SEED_USER}/accuracy`, { apiKey: 'bad' })
    delete flags.geminiBadKey
    assert.ok(r.status >= 400 && r.status < 600)
  })
  it('unparseable model output -> error, no crash', async () => {
    flags.geminiGarbage = true
    const r = await anon().post(`/api/users/${SEED_USER}/accuracy`, { apiKey: 'k' })
    delete flags.geminiGarbage
    assert.ok(r.status >= 400 && r.status < 600)
  })
})
