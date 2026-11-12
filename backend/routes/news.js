import { Router } from 'express'
import db from '../db.js'
import { optionalAuth } from '../auth.js'
import { fetchSecondaryCompany, isCompanyMatchConfigured, matchCompany } from '../companyMatch.js'

const router = Router()

// Simple in-memory cache so the Discussions page doesn't hit Finnhub's rate
// limit every time someone loads the tab — one shared fetch per 5 minutes.
let liveNewsCache = { at: 0, items: [] }
const LIVE_NEWS_TTL_MS = 5 * 60 * 1000
// Every live article we've served, so a card can still be matched after it
// rotates out of the latest batch. Only these ids reach the LLM — clients
// can't submit their own text and spend the OpenRouter budget.
const liveArticlesById = new Map()

// Large US listings Finnhub's free tier covers fully (quote, profile, metrics),
// so every story's company always has fundamentals to show.
// Each maps to the words a headline must contain to count as that company's
// story — Finnhub tags loosely ("Plug Power downgrade" arrives as WMT news).
const NEWS_TICKERS = {
  AAPL: ['apple', 'iphone'],
  MSFT: ['microsoft', 'azure'],
  NVDA: ['nvidia'],
  AMZN: ['amazon', 'aws'],
  GOOGL: ['alphabet', 'google', 'youtube'],
  META: ['meta', 'facebook', 'instagram', 'whatsapp'],
  TSLA: ['tesla', 'cybertruck'],
  JPM: ['jpmorgan', 'jp morgan'],
  XOM: ['exxon'],
  NFLX: ['netflix'],
  AMD: ['amd', 'advanced micro devices'],
  WMT: ['walmart'],
}
const ARTICLES_PER_TICKER = 2

const isoDay = (msAgo) => new Date(Date.now() - msAgo).toISOString().slice(0, 10)

const namesCompany = (headline = '', ticker) =>
  [ticker.toLowerCase(), ...NEWS_TICKERS[ticker]].some((w) => new RegExp(`\\b${w}\\b`, 'i').test(headline))

// Latest company-specific stories for one ticker (Finnhub /company-news).
async function companyNews(ticker) {
  const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${isoDay(7 * 864e5)}&to=${isoDay(0)}&token=${process.env.FINNHUB_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Finnhub company-news ${ticker}: ${res.status}`)
  const articles = await res.json()
  return articles
    .filter((a) => a.summary && namesCompany(a.headline, ticker))
    .slice(0, ARTICLES_PER_TICKER)
    .map((a) => ({ ...a, ticker }))
}

router.get('/live', async (req, res) => {
  if (!process.env.FINNHUB_API_KEY) return res.json([])

  if (Date.now() - liveNewsCache.at < LIVE_NEWS_TTL_MS) {
    return res.json(liveNewsCache.items)
  }

  try {
    // One failing ticker shouldn't empty the feed.
    const results = await Promise.allSettled(Object.keys(NEWS_TICKERS).map(companyNews))
    const seenHeadlines = new Set()
    const items = results
      .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      .filter((a) => !seenHeadlines.has(a.headline) && seenHeadlines.add(a.headline))
      .sort((a, b) => b.datetime - a.datetime)
      .map((a) => ({
        id: a.id,
        ticker: a.ticker,
        headline: a.headline,
        summary: a.summary,
        source: a.source,
        url: a.url,
        publishedAt: new Date(a.datetime * 1000).toISOString(),
      }))
    if (items.length === 0) throw new Error('No company news returned')

    liveNewsCache = { at: Date.now(), items }
    items.forEach((item) => liveArticlesById.set(String(item.id), item))
    res.json(items)
  } catch (err) {
    console.error('Finnhub fetch failed:', err.message)
    res.json(liveNewsCache.items) // serve stale cache (possibly empty) rather than fail the page
  }
})

router.get('/live/:id/company', async (req, res) => {
  if (!process.env.FINNHUB_API_KEY) return res.status(503).json({ error: 'Live market data is not configured' })
  const article = liveArticlesById.get(req.params.id)
  if (!article) return res.status(404).json({ error: 'Unknown live article' })
  try {
    res.json(await matchCompany(article))
  } catch (err) {
    console.error('Company match failed:', err.message)
    res.status(502).json({ error: 'Could not match a company for this article' })
  }
})

router.get('/live/:id/company/:ticker', async (req, res) => {
  if (!isCompanyMatchConfigured()) return res.status(503).json({ error: 'Company matching is not configured' })
  const article = liveArticlesById.get(req.params.id)
  if (!article) return res.status(404).json({ error: 'Unknown live article' })
  try {
    const company = await fetchSecondaryCompany(article, req.params.ticker.toUpperCase())
    if (!company) return res.status(404).json({ error: 'That company is not listed as affected by this article' })
    res.json(company)
  } catch (err) {
    console.error('Secondary company lookup failed:', err.message)
    res.status(502).json({ error: 'Could not load that company' })
  }
})

router.get('/', optionalAuth, async (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : null
  const where = q ? 'WHERE headline ILIKE $1 OR body ILIKE $1 OR tags ILIKE $1' : ''
  const { rows } = await db.query(`SELECT * FROM news_items ${where} ORDER BY published_at DESC`, q ? [q] : [])

  if (req.userId) {
    const { rows: watchRows } = await db.query('SELECT ticker FROM watchlist_items WHERE user_id = $1', [req.userId])
    const tickers = watchRows.map((r) => r.ticker)
    if (tickers.length) {
      const isMatch = (item) => tickers.some((t) => item.tags.split(',').map((s) => s.trim()).includes(t))
      // Array#sort is stable, so within each group published_at DESC order survives.
      rows.sort((a, b) => Number(isMatch(b)) - Number(isMatch(a)))
    }
  }

  res.json(rows)
})

router.get('/:id', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM news_items WHERE id = $1', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'News item not found' })
  res.json(rows[0])
})

export default router
