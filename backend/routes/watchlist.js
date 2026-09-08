import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT ticker, buy_price, buy_date, quantity FROM watchlist_items WHERE user_id = ? ORDER BY ticker')
    .all(req.userId)
  res.json(rows)
})

router.post('/', requireAuth, (req, res) => {
  const ticker = (req.body.ticker || '').trim().toUpperCase()
  if (!ticker) return res.status(400).json({ error: 'Ticker is required' })
  const buyPrice = req.body.buyPrice != null && req.body.buyPrice !== '' ? Number(req.body.buyPrice) : null
  const buyDate = req.body.buyDate || null
  const quantity = req.body.quantity != null && req.body.quantity !== '' ? Number(req.body.quantity) : 1

  db.prepare(
    `INSERT INTO watchlist_items (user_id, ticker, buy_price, buy_date, quantity) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, ticker) DO UPDATE SET buy_price = excluded.buy_price, buy_date = excluded.buy_date, quantity = excluded.quantity`
  ).run(req.userId, ticker, buyPrice, buyDate, quantity)

  res.status(201).json({ ticker, buy_price: buyPrice, buy_date: buyDate, quantity })
})

router.delete('/:ticker', requireAuth, (req, res) => {
  db.prepare('DELETE FROM watchlist_items WHERE user_id = ? AND ticker = ?').run(
    req.userId,
    req.params.ticker.toUpperCase()
  )
  res.json({ ok: true })
})

export default router
