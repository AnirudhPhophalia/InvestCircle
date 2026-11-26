// Replaces globalThis.fetch for the three external services (Finnhub, OpenRouter, Gemini)
// so the test-suite never needs real API keys or network access.
// Calls to anything else (including the test server on localhost) go to the real fetch.
const realFetch = globalThis.fetch

export const flags = {} // e.g. flags.llmDown = true
export const calls = [] // names of external calls made, e.g. 'finnhub_news'
export const resetMock = () => {
  for (const k of Object.keys(flags)) delete flags[k]
  calls.length = 0
}

const json = (status, obj) =>
  Promise.resolve(new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } }))

const NAMES = {
  AAPL: 'Apple Inc', MSFT: 'Microsoft Corp', NVDA: 'NVIDIA Corp', AMZN: 'Amazon.com Inc', GOOGL: 'Alphabet Inc',
  META: 'Meta Platforms Inc', TSLA: 'Tesla Inc', JPM: 'JPMorgan Chase & Co', XOM: 'Exxon Mobil Corp',
  NFLX: 'Netflix Inc', AMD: 'Advanced Micro Devices Inc', WMT: 'Walmart Inc', INTC: 'Intel Corp',
}
const WORD = {
  AAPL: 'Apple', MSFT: 'Microsoft', NVDA: 'Nvidia', AMZN: 'Amazon', GOOGL: 'Alphabet', META: 'Meta',
  TSLA: 'Tesla', JPM: 'JPMorgan', XOM: 'Exxon', NFLX: 'Netflix', AMD: 'AMD', WMT: 'Walmart',
}
const now = () => Math.floor(Date.now() / 1000)
const idBase = (t) => ([...t].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 100000) * 10

async function finnhub(u) {
  if (u.pathname.endsWith('/company-news')) {
    calls.push('finnhub_news')
    const t = u.searchParams.get('symbol')
    if (flags.failTicker === t) return json(500, { error: 'boom' })
    const w = WORD[t] || t
    const b = idBase(t)
    const n = now()
    return json(200, [
      { id: b + 1, headline: `${w} reports strong quarter`, summary: `${w} one`, source: 'Reuters', url: 'https://x/1', datetime: n - 100 },
      { id: b + 2, headline: `${w} unveils new product line`, summary: `${w} two`, source: 'CNBC', url: 'https://x/2', datetime: n - 200 },
      { id: b + 3, headline: `${w} expands into new market`, summary: `${w} three`, source: 'Bloomberg', url: 'https://x/3', datetime: n - 300 },
      { id: b + 5, headline: 'Plug Power downgraded by analyst', summary: 'unrelated company', source: 'Reuters', url: 'https://x/5', datetime: n - 60 },
      ...(t === 'GOOGL' || t === 'META'
        ? [{ id: 9000 + (t === 'GOOGL' ? 1 : 2), headline: 'Alphabet and Meta race on AI spending', summary: 'shared story', source: 'FT', url: 'https://x/6', datetime: n - 10 }]
        : []),
    ])
  }
  const sym = u.searchParams.get('symbol')
  if (u.pathname.endsWith('/quote')) {
    calls.push('finnhub_quote')
    return NAMES[sym] ? json(200, { c: 100 + sym.length, dp: 1.234, t: now() }) : json(200, { c: 0, dp: 0, t: 0 })
  }
  if (u.pathname.endsWith('/stock/profile2')) {
    return NAMES[sym]
      ? json(200, { ticker: sym, name: NAMES[sym], currency: 'USD', marketCapitalization: 3000000, weburl: 'https://example.com' })
      : json(200, {})
  }
  if (u.pathname.endsWith('/stock/metric')) {
    return json(200, { metric: { '52WeekHigh': 200.456, '52WeekLow': 90.1, peTTM: 28.74, bookValuePerShareAnnual: 5.123, currentDividendYieldTTM: 0.55, roeTTM: 30.2, revenueGrowth5Y: 12, revenueGrowth3Y: 9, revenueGrowthTTMYoy: 7, epsGrowth5Y: 14, epsGrowth3Y: 10, epsGrowthTTMYoy: 5, '52WeekPriceReturnDaily': 21, roe5Y: 28 } })
  }
  return json(404, {})
}

function openrouter(opts) {
  calls.push('openrouter')
  if (flags.llmDown) return json(402, { error: { message: 'insufficient credits' } })
  const body = JSON.parse(opts.body)
  const m = body.messages[0].content.match(/most affected company is ([A-Z]+)\. Use exactly that ticker/)
  const tk = m ? m[1] : 'AAPL'
  const content = {
    ticker: tk, name: NAMES[tk] || tk, reason: `This news directly affects ${tk}.`,
    about: `${NAMES[tk]} makes products. Sells worldwide.`, keyPoints: 'Business Overview: core business.',
    secondary: [
      { ticker: tk, name: NAMES[tk], reason: 'dup of primary', about: 'dup' },
      { ticker: 'INTC', name: 'Intel Corp', reason: 'Supplier effect.', about: 'Intel makes chips. It sells CPUs.' },
      { ticker: 'ZZZZ', name: 'Unknown Co', reason: 'Not on Finnhub.', about: 'None.' },
    ],
  }
  return json(200, { choices: [{ message: { content: JSON.stringify(content) } }] })
}

function gemini(u, opts) {
  const body = JSON.parse(opts.body)
  calls.push('gemini_' + (body.tools ? 'search' : 'nosearch') + '_' + u.pathname.split('/models/')[1].split(':')[0])
  if (flags.geminiToolError && body.tools) return json(400, { error: { message: 'Search tool is not supported' } })
  if (flags.geminiBadKey) return json(403, { error: { message: 'API key not valid' } })
  if (flags.geminiGarbage) return json(200, { candidates: [{ content: { parts: [{ text: 'sorry I cannot do that' }] } }] })
  const ids = [...body.contents[0].parts[0].text.matchAll(/ID: ((?:post|comment)_\d+)/g)].map((x) => x[1])
  const cycle = ['HIT', 'MISS', 'HIT', 'NEUTRAL']
  const evaluations = ids.map((id, i) => ({
    id, type: id.startsWith('post') ? 'post' : 'comment', title: 't' + i, ticker: 'NVDA', sentiment: 'Bullish',
    claim: 'c', online_truth: 'o', verdict: cycle[i % 4], reason: 'r',
  }))
  return json(200, { candidates: [{ content: { parts: [{ text: '```json\n' + JSON.stringify({ evaluations }) + '\n```' }] } }] })
}

export function installMock() {
  globalThis.fetch = async (url, opts = {}) => {
    const u = new URL(String(url))
    if (u.hostname === 'finnhub.io') return finnhub(u)
    if (u.hostname === 'openrouter.ai') return openrouter(opts)
    if (u.hostname === 'generativelanguage.googleapis.com') return gemini(u, opts)
    return realFetch(url, opts)
  }
}
export { realFetch }
