import { Router } from 'express'
import db from '../db.js'
import { optionalAuth } from '../auth.js'

const router = Router()

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
