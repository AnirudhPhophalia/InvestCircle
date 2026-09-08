import { Router } from 'express'
import db from '../db.js'
import { requireAuth, optionalAuth } from '../auth.js'

const router = Router()

const SORTS = {
  new: 'p.created_at DESC',
  top: 'score DESC',
  hot: "score / (((julianday('now') - julianday(p.created_at)) * 24) + 2) DESC",
}

router.get('/', optionalAuth, (req, res) => {
  const orderBy = SORTS[req.query.sort] || SORTS.hot
  const q = req.query.q ? `%${req.query.q}%` : null
  const where = q ? 'WHERE p.title LIKE ? OR p.body LIKE ? OR p.tickers LIKE ?' : ''
  const params = q ? [q, q, q] : []

  const rows = db
    .prepare(
      `SELECT p.*, u.display_name, u.handle, u.badge, u.avatar,
        COALESCE(SUM(v.value), 0) AS score,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
        (SELECT value FROM votes WHERE post_id = p.id AND user_id = ?) AS my_vote
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN votes v ON v.post_id = p.id
       ${where}
       GROUP BY p.id
       ORDER BY ${orderBy}`
    )
    .all(req.userId ?? null, ...params)

  res.json(rows)
})

router.post('/', requireAuth, (req, res) => {
  const { title, body, tickers } = req.body
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required' })
  const tickerStr = Array.isArray(tickers) ? tickers.join(',') : tickers || ''
  const { lastInsertRowid } = db
    .prepare('INSERT INTO posts (user_id, title, body, tickers) VALUES (?, ?, ?, ?)')
    .run(req.userId, title, body, tickerStr)
  res.status(201).json({ id: lastInsertRowid })
})

router.get('/:id', optionalAuth, (req, res) => {
  const post = db
    .prepare(
      `SELECT p.*, u.display_name, u.handle, u.badge, u.avatar,
        COALESCE((SELECT SUM(value) FROM votes WHERE post_id = p.id), 0) AS score,
        (SELECT value FROM votes WHERE post_id = p.id AND user_id = ?) AS my_vote
       FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?`
    )
    .get(req.userId ?? null, req.params.id)
  if (!post) return res.status(404).json({ error: 'Post not found' })

  const comments = db
    .prepare(
      `SELECT c.*, u.display_name, u.handle, u.avatar,
        COALESCE(SUM(CASE WHEN r.kind = 'insightful' THEN 1 ELSE 0 END), 0) AS insightful_count,
        COALESCE(SUM(CASE WHEN r.kind = 'flame' THEN 1 ELSE 0 END), 0) AS flame_count,
        (SELECT kind FROM comment_reactions WHERE comment_id = c.id AND user_id = ?) AS my_reaction
       FROM comments c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN comment_reactions r ON r.comment_id = c.id
       WHERE c.post_id = ? GROUP BY c.id ORDER BY c.created_at ASC`
    )
    .all(req.userId ?? null, req.params.id)

  res.json({ ...post, comments })
})

router.post('/:id/comments', requireAuth, (req, res) => {
  const { body, parentId } = req.body
  if (!body) return res.status(400).json({ error: 'Comment body is required' })
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id)
  if (!post) return res.status(404).json({ error: 'Post not found' })
  if (parentId) {
    const parent = db.prepare('SELECT id FROM comments WHERE id = ? AND post_id = ?').get(parentId, req.params.id)
    if (!parent) return res.status(400).json({ error: 'Parent comment not found on this post' })
  }
  const { lastInsertRowid } = db
    .prepare('INSERT INTO comments (post_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)')
    .run(req.params.id, req.userId, parentId || null, body)
  res.status(201).json({ id: lastInsertRowid })
})

router.post('/:postId/comments/:commentId/react', requireAuth, (req, res) => {
  const kind = req.body.kind
  const comment = db.prepare('SELECT id FROM comments WHERE id = ? AND post_id = ?').get(req.params.commentId, req.params.postId)
  if (!comment) return res.status(404).json({ error: 'Comment not found' })

  const existing = db
    .prepare('SELECT kind FROM comment_reactions WHERE comment_id = ? AND user_id = ?')
    .get(req.params.commentId, req.userId)

  if (existing && existing.kind === kind) {
    db.prepare('DELETE FROM comment_reactions WHERE comment_id = ? AND user_id = ?').run(req.params.commentId, req.userId)
  } else if (!['insightful', 'flame'].includes(kind)) {
    return res.status(400).json({ error: "kind must be 'insightful' or 'flame'" })
  } else {
    db.prepare(
      `INSERT INTO comment_reactions (comment_id, user_id, kind) VALUES (?, ?, ?)
       ON CONFLICT(comment_id, user_id) DO UPDATE SET kind = excluded.kind`
    ).run(req.params.commentId, req.userId, kind)
  }

  const counts = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN kind = 'insightful' THEN 1 ELSE 0 END), 0) AS insightful_count,
        COALESCE(SUM(CASE WHEN kind = 'flame' THEN 1 ELSE 0 END), 0) AS flame_count
       FROM comment_reactions WHERE comment_id = ?`
    )
    .get(req.params.commentId)
  const mine = db
    .prepare('SELECT kind FROM comment_reactions WHERE comment_id = ? AND user_id = ?')
    .get(req.params.commentId, req.userId)

  res.json({ ...counts, my_reaction: mine?.kind ?? null })
})

router.post('/:id/vote', requireAuth, (req, res) => {
  const value = Number(req.body.value)
  if (![1, -1, 0].includes(value)) {
    return res.status(400).json({ error: 'Vote value must be 1, -1, or 0' })
  }
  if (value === 0) {
    db.prepare('DELETE FROM votes WHERE post_id = ? AND user_id = ?').run(req.params.id, req.userId)
  } else {
    db.prepare(
      `INSERT INTO votes (post_id, user_id, value) VALUES (?, ?, ?)
       ON CONFLICT(post_id, user_id) DO UPDATE SET value = excluded.value`
    ).run(req.params.id, req.userId, value)
  }
  const score = db.prepare('SELECT COALESCE(SUM(value), 0) AS score FROM votes WHERE post_id = ?').get(req.params.id).score
  res.json({ score, my_vote: value || null })
})

export default router
