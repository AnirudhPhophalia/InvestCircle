import { Router } from 'express'
import db from '../db.js'
import { optionalAuth } from '../auth.js'

const router = Router()

router.get('/', optionalAuth, (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : null
  const where = q ? 'WHERE headline LIKE ? OR body LIKE ? OR tags LIKE ?' : ''
  const params = q ? [q, q, q] : []
  const rows = db.prepare(`SELECT * FROM news_items ${where} ORDER BY published_at DESC`).all(...params)

  if (req.userId) {
    const tickers = db
      .prepare('SELECT ticker FROM watchlist_items WHERE user_id = ?')
      .all(req.userId)
      .map((r) => r.ticker)
    if (tickers.length) {
      const isMatch = (item) => tickers.some((t) => item.tags.split(',').map((s) => s.trim()).includes(t))
      // Array#sort is stable, so within each group published_at DESC order survives.
      rows.sort((a, b) => Number(isMatch(b)) - Number(isMatch(a)))
    }
  }

  res.json(rows)
})

router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM news_items WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: 'News item not found' })
  res.json(item)
})

export default router
