import { Router } from 'express'
import db from '../db.js'
import { requireAuth, optionalAuth } from '../auth.js'

const router = Router()

// Postgres only resolves a SELECT-list alias (like `score`) in ORDER BY when the
// whole ORDER BY item IS that bare alias -- embedded in a larger expression, as
// the hot formula needs, it has to repeat the real expression instead.
const SORTS = {
  new: 'p.created_at DESC',
  top: 'score DESC',
  hot: "COALESCE(SUM(v.value), 0) / ((EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600) + 2) DESC",
}

router.get('/', optionalAuth, async (req, res) => {
  const orderBy = SORTS[req.query.sort] || SORTS.hot
  const q = req.query.q ? `%${req.query.q}%` : null
  const where = q ? 'WHERE p.title ILIKE $2 OR p.body ILIKE $2 OR p.tickers ILIKE $2' : ''

  const { rows } = await db.query(
    `SELECT p.*, u.display_name, u.handle, u.badge, u.avatar,
        COALESCE(SUM(v.value), 0) AS score,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
        (SELECT value FROM votes WHERE post_id = p.id AND user_id = $1) AS my_vote
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN votes v ON v.post_id = p.id
       ${where}
       GROUP BY p.id, u.display_name, u.handle, u.badge, u.avatar
       ORDER BY ${orderBy}`,
    q ? [req.userId ?? null, q] : [req.userId ?? null]
  )

  res.json(rows)
})

router.post('/', requireAuth, async (req, res) => {
  const { title, body, tickers } = req.body
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required' })
  const tickerStr = Array.isArray(tickers) ? tickers.join(',') : tickers || ''
  const { rows } = await db.query(
    'INSERT INTO posts (user_id, title, body, tickers) VALUES ($1, $2, $3, $4) RETURNING id',
    [req.userId, title, body, tickerStr]
  )
  res.status(201).json({ id: rows[0].id })
})

router.get('/:id', optionalAuth, async (req, res) => {
  const postResult = await db.query(
    `SELECT p.*, u.display_name, u.handle, u.badge, u.avatar,
        COALESCE((SELECT SUM(value) FROM votes WHERE post_id = p.id), 0) AS score,
        (SELECT value FROM votes WHERE post_id = p.id AND user_id = $1) AS my_vote
       FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = $2`,
    [req.userId ?? null, req.params.id]
  )
  const post = postResult.rows[0]
  if (!post) return res.status(404).json({ error: 'Post not found' })

  const { rows: comments } = await db.query(
    `SELECT c.*, u.display_name, u.handle, u.avatar,
        COALESCE(SUM(CASE WHEN r.kind = 'insightful' THEN 1 ELSE 0 END), 0) AS insightful_count,
        COALESCE(SUM(CASE WHEN r.kind = 'flame' THEN 1 ELSE 0 END), 0) AS flame_count,
        (SELECT kind FROM comment_reactions WHERE comment_id = c.id AND user_id = $1) AS my_reaction
       FROM comments c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN comment_reactions r ON r.comment_id = c.id
       WHERE c.post_id = $2
       GROUP BY c.id, u.display_name, u.handle, u.avatar
       ORDER BY c.created_at ASC`,
    [req.userId ?? null, req.params.id]
  )

  res.json({ ...post, comments })
})

router.post('/:id/comments', requireAuth, async (req, res) => {
  const { body, parentId } = req.body
  if (!body) return res.status(400).json({ error: 'Comment body is required' })
  const { rows: postRows } = await db.query('SELECT id FROM posts WHERE id = $1', [req.params.id])
  if (!postRows[0]) return res.status(404).json({ error: 'Post not found' })
  if (parentId) {
    const { rows: parentRows } = await db.query('SELECT id FROM comments WHERE id = $1 AND post_id = $2', [parentId, req.params.id])
    if (!parentRows[0]) return res.status(400).json({ error: 'Parent comment not found on this post' })
  }
  const { rows } = await db.query(
    'INSERT INTO comments (post_id, user_id, parent_id, body) VALUES ($1, $2, $3, $4) RETURNING id',
    [req.params.id, req.userId, parentId || null, body]
  )
  res.status(201).json({ id: rows[0].id })
})

router.post('/:postId/comments/:commentId/react', requireAuth, async (req, res) => {
  const kind = req.body.kind
  const { rows: commentRows } = await db.query('SELECT id FROM comments WHERE id = $1 AND post_id = $2', [
    req.params.commentId,
    req.params.postId,
  ])
  if (!commentRows[0]) return res.status(404).json({ error: 'Comment not found' })

  const { rows: existingRows } = await db.query('SELECT kind FROM comment_reactions WHERE comment_id = $1 AND user_id = $2', [
    req.params.commentId,
    req.userId,
  ])
  const existing = existingRows[0]

  if (existing && existing.kind === kind) {
    await db.query('DELETE FROM comment_reactions WHERE comment_id = $1 AND user_id = $2', [req.params.commentId, req.userId])
  } else if (!['insightful', 'flame'].includes(kind)) {
    return res.status(400).json({ error: "kind must be 'insightful' or 'flame'" })
  } else {
    await db.query(
      `INSERT INTO comment_reactions (comment_id, user_id, kind) VALUES ($1, $2, $3)
       ON CONFLICT (comment_id, user_id) DO UPDATE SET kind = excluded.kind`,
      [req.params.commentId, req.userId, kind]
    )
  }

  const { rows: countRows } = await db.query(
    `SELECT
        COALESCE(SUM(CASE WHEN kind = 'insightful' THEN 1 ELSE 0 END), 0) AS insightful_count,
        COALESCE(SUM(CASE WHEN kind = 'flame' THEN 1 ELSE 0 END), 0) AS flame_count
       FROM comment_reactions WHERE comment_id = $1`,
    [req.params.commentId]
  )
  const { rows: mineRows } = await db.query('SELECT kind FROM comment_reactions WHERE comment_id = $1 AND user_id = $2', [
    req.params.commentId,
    req.userId,
  ])

  res.json({ ...countRows[0], my_reaction: mineRows[0]?.kind ?? null })
})

router.post('/:id/vote', requireAuth, async (req, res) => {
  const value = Number(req.body.value)
  if (![1, -1, 0].includes(value)) {
    return res.status(400).json({ error: 'Vote value must be 1, -1, or 0' })
  }
  if (value === 0) {
    await db.query('DELETE FROM votes WHERE post_id = $1 AND user_id = $2', [req.params.id, req.userId])
  } else {
    await db.query(
      `INSERT INTO votes (post_id, user_id, value) VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id) DO UPDATE SET value = excluded.value`,
      [req.params.id, req.userId, value]
    )
  }
  const { rows } = await db.query('SELECT COALESCE(SUM(value), 0) AS score FROM votes WHERE post_id = $1', [req.params.id])
  res.json({ score: rows[0].score, my_vote: value || null })
})

export default router
