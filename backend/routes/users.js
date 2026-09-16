import { Router } from 'express'
import db from '../db.js'
import { requireAuth, optionalAuth } from '../auth.js'
import { toPublicUser } from '../helpers.js'

const router = Router()

router.patch('/me', requireAuth, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.userId])
  const user = rows[0]
  const { displayName, bio, avatar } = req.body
  await db.query('UPDATE users SET display_name = $1, bio = $2, avatar = $3 WHERE id = $4', [
    displayName ?? user.display_name,
    bio ?? user.bio,
    avatar ?? user.avatar,
    req.userId,
  ])
  const { rows: updated } = await db.query('SELECT * FROM users WHERE id = $1', [req.userId])
  res.json(toPublicUser(updated[0]))
})

router.get('/:id', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id])
  const user = rows[0]
  if (!user) return res.status(404).json({ error: 'User not found' })
  const { rows: countRows } = await db.query('SELECT COUNT(*) AS n FROM posts WHERE user_id = $1', [req.params.id])
  res.json({
    ...toPublicUser(user),
    stats: {
      posts: Number(countRows[0].n),
      followers: user.follower_count,
      following: user.following_count,
      accuracy: null, // computed for real in Phase 5
    },
  })
})

router.get('/:id/posts', optionalAuth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT p.*, COALESCE(SUM(v.value), 0) AS score,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
        (SELECT value FROM votes WHERE post_id = p.id AND user_id = $1) AS my_vote
       FROM posts p LEFT JOIN votes v ON v.post_id = p.id
       WHERE p.user_id = $2 GROUP BY p.id ORDER BY p.created_at DESC`,
    [req.userId ?? null, req.params.id]
  )
  res.json(rows)
})

router.get('/:id/comments', async (req, res) => {
  const { rows } = await db.query(
    `SELECT c.*, p.title AS post_title FROM comments c
       JOIN posts p ON p.id = c.post_id
       WHERE c.user_id = $1 ORDER BY c.created_at DESC`,
    [req.params.id]
  )
  res.json(rows)
})

export default router
