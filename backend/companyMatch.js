// Maps a live news article to the company it most affects (LLM via OpenRouter),
// then fills that company's fundamentals with real numbers from Finnhub.
// The LLM only picks the company and writes the descriptive text — every
// price/ratio shown comes from Finnhub, never from the model.

const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-3.5-flash-lite'
const FUNDAMENTALS_TTL_MS = 5 * 60 * 1000

const matchByArticle = new Map() // articleId -> Promise<match>, cached for the process lifetime
const fundamentalsByTicker = new Map() // ticker -> { at, data }

const MATCH_SCHEMA = {
  type: 'object',
  properties: {
    ticker: { type: 'string' },
    name: { type: 'string' },
    reason: { type: 'string' },
    about: { type: 'string' },
    keyPoints: { type: 'string' },
    secondary: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ticker: { type: 'string' },
          name: { type: 'string' },
          reason: { type: 'string' },
          about: { type: 'string' },
        },
        required: ['ticker', 'name', 'reason', 'about'],
        additionalProperties: false,
      },
    },
  },
  required: ['ticker', 'name', 'reason', 'about', 'keyPoints', 'secondary'],
  additionalProperties: false,
}

function buildPrompt({ headline, summary }, correction) {
  return `${correction ? `${correction}\n\n` : ''}You are an equity analyst. Identify the ONE publicly traded company whose stock is most directly and materially affected by this news.

Rules:
- If the news names a specific company, pick that company.
- If it is sector or macro news, pick the largest, most directly exposed company for that driver. Examples: oil prices → ExxonMobil (XOM); interest-rate decisions → JPMorgan Chase (JPM); chip export rules → NVIDIA (NVDA); airline demand → Delta (DAL).
- The ticker MUST trade on NYSE or NASDAQ. For non-US companies use their US-listed ADR (Infosys → INFY, HDFC Bank → HDB, ICICI Bank → IBN, Wipro → WIT, Toyota → TM, TSMC → TSM). If the most affected company has no US listing, pick the most affected US-listed company instead.
- reason: one sentence on how this specific news affects that company.
- about: two sentences on what the company does.
- keyPoints: one sentence starting with "Business Overview:" naming its main business driver.
- secondary: 2 to 4 OTHER companies affected secondarily (competitors, suppliers, customers, or sector peers), most affected first. Same NYSE/NASDAQ ticker rule. Each needs a one-sentence reason (how this news affects it) and a one-sentence about (what it does).

Headline: ${headline}
Summary: ${summary}`
}

async function askLlm(article, correction) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      // Low-credit keys reject requests that don't cap output: OpenRouter
      // otherwise reserves the model's full output budget up front.
      max_tokens: 1200,
      messages: [{ role: 'user', content: buildPrompt(article, correction) }],
      response_format: { type: 'json_schema', json_schema: { name: 'company_match', strict: true, schema: MATCH_SCHEMA } },
    }),
  })
  const body = await res.json()
  if (!res.ok || body.error) throw new Error(`OpenRouter: ${body.error?.message || res.status}`)
  const match = JSON.parse(body.choices[0].message.content)
  const ticker = match.ticker.trim().toUpperCase()
  const seen = new Set([ticker])
  const secondary = match.secondary
    .map((s) => ({ ...s, ticker: s.ticker.trim().toUpperCase() }))
    .filter((s) => s.ticker && !seen.has(s.ticker) && seen.add(s.ticker))
  return { ...match, ticker, secondary }
}

async function finnhub(path) {
  const res = await fetch(`https://finnhub.io/api/v1${path}&token=${process.env.FINNHUB_API_KEY}`)
  if (!res.ok) throw new Error(`Finnhub ${path}: ${res.status}`)
  return res.json()
}

const round = (n, digits = 0) => (typeof n === 'number' && Number.isFinite(n) ? Number(n.toFixed(digits)) : null)

// Finnhub reports market cap in millions.
function formatMarketCap(millions) {
  if (!millions) return null
  if (millions >= 1000) return `${Math.round(millions / 1000).toLocaleString('en-US')} B`
  return `${Math.round(millions).toLocaleString('en-US')} M`
}

// LLMs sometimes answer with a stale ticker that now belongs to a different
// company (e.g. PARA after the Paramount–Skydance merger), so check the name
// Finnhub has for that ticker against the company the LLM meant.
function sameCompany(llmName, finnhubName) {
  if (!finnhubName) return false
  const squash = (s) => s.toLowerCase().replace(/[^a-z]/g, '')
  const firstWord = (s) => s.toLowerCase().match(/[a-z]{3,}/)?.[0] || '\0'
  return squash(finnhubName).includes(firstWord(llmName)) || squash(llmName).includes(firstWord(finnhubName))
}

async function fetchFundamentals(ticker) {
  const cached = fundamentalsByTicker.get(ticker)
  if (cached && Date.now() - cached.at < FUNDAMENTALS_TTL_MS) return cached.data

  const sym = encodeURIComponent(ticker)
  let quote, profile, metric
  try {
    ;[quote, profile, { metric = {} }] = await Promise.all([
      finnhub(`/quote?symbol=${sym}`),
      finnhub(`/stock/profile2?symbol=${sym}`),
      finnhub(`/stock/metric?symbol=${sym}&metric=all`),
    ])
  } catch (err) {
    console.error(`Finnhub lookup for ${ticker} failed:`, err.message) // e.g. 403 for non-US listings on the free tier
    return null
  }
  // An empty profile means Finnhub doesn't know the ticker (or the free tier can't see it).
  if (!profile.ticker || !quote.c) return null

  const price = quote.c.toFixed(2)
  const data = {
    name: profile.name,
    currency: profile.currency === 'USD' ? '$' : profile.currency,
    price,
    changePercent: round(quote.dp, 2),
    asOf: new Date(quote.t * 1000).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }),
    website: profile.weburl ? new URL(profile.weburl).hostname.replace(/^www\./, '') : '—',
    bse: '—',
    nse: '—',
    metrics: {
      // Finnhub reports market cap in millions.
      marketCap: formatMarketCap(profile.marketCapitalization),
      currentPrice: price,
      high: round(metric['52WeekHigh'], 2),
      low: round(metric['52WeekLow'], 2),
      stockPE: round(metric.peTTM, 1),
      bookValue: round(metric.bookValuePerShareAnnual, 2),
      dividendYield: round(metric.currentDividendYieldTTM ?? metric.dividendYieldIndicatedAnnual, 2),
      roce: null, // not in Finnhub's free tier
      roe: round(metric.roeTTM, 1),
      faceValue: null,
    },
    growth: {
      sales: { y5: round(metric.revenueGrowth5Y), y3: round(metric.revenueGrowth3Y), ttm: round(metric.revenueGrowthTTMYoy) },
      profit: { y5: round(metric.epsGrowth5Y), y3: round(metric.epsGrowth3Y), ttm: round(metric.epsGrowthTTMYoy) },
      priceCagr: { y1: round(metric['52WeekPriceReturnDaily']) },
      roe: { y5: round(metric.roe5Y), last: round(metric.roeTTM) },
    },
  }
  fundamentalsByTicker.set(ticker, { at: Date.now(), data })
  return data
}

export function isCompanyMatchConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY && process.env.FINNHUB_API_KEY)
}

// Ask the LLM, check its ticker against Finnhub, and give it one corrected
// retry if the ticker is unknown or belongs to a different company.
async function resolveMatch(article) {
  const first = await askLlm(article)
  const firstData = await fetchFundamentals(first.ticker)
  if (sameCompany(first.name, firstData?.name)) return { ...first, verified: true }

  const correction = firstData
    ? `Note: ticker ${first.ticker} now belongs to "${firstData.name}", not ${first.name}. Reply with ${first.name}'s current NYSE/NASDAQ ticker, or the most affected company that does trade there.`
    : `Note: ticker ${first.ticker} was not found on NYSE/NASDAQ. Reply with a ticker that currently trades there.`
  const second = await askLlm(article, correction)
  const secondData = await fetchFundamentals(second.ticker)
  return { ...second, verified: sameCompany(second.name, secondData?.name) }
}

function getMatch(article) {
  let pending = matchByArticle.get(article.id)
  if (!pending) {
    pending = resolveMatch(article)
    matchByArticle.set(article.id, pending)
    pending.catch(() => matchByArticle.delete(article.id)) // let a failed call be retried
  }
  return pending
}

// The most affected company, with its fundamentals, plus the secondarily
// affected ones (names only — their data is fetched when someone picks one).
export async function matchCompany(article) {
  const match = await getMatch(article)
  // Never show one company's numbers under another company's name.
  const fundamentals = match.verified ? await fetchFundamentals(match.ticker) : null
  return {
    ticker: match.ticker,
    name: fundamentals?.name || match.name,
    reason: match.reason,
    model: MODEL,
    data: fundamentals && { ...fundamentals, about: match.about, keyPoints: match.keyPoints },
    secondary: match.secondary.map(({ ticker, name, reason }) => ({ ticker, name, reason })),
  }
}

// Fundamentals for one of an article's secondarily affected companies. Only
// tickers the LLM listed for this article are accepted.
export async function fetchSecondaryCompany(article, ticker) {
  const match = await getMatch(article)
  const entry = match.secondary.find((s) => s.ticker === ticker)
  if (!entry) return null
  const fundamentals = await fetchFundamentals(ticker)
  const verified = sameCompany(entry.name, fundamentals?.name)
  return {
    ticker,
    name: verified ? fundamentals.name : entry.name,
    reason: entry.reason,
    data: verified ? { ...fundamentals, about: entry.about, keyPoints: `Impact: ${entry.reason}` } : null,
  }
}
