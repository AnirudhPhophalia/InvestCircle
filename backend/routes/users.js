import { Router } from 'express'
import db from '../db.js'
import { requireAuth, optionalAuth } from '../auth.js'
import { toPublicUser } from '../helpers.js'

const router = Router()

router.patch('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
  const { displayName, bio, avatar } = req.body
  db.prepare('UPDATE users SET display_name = ?, bio = ?, avatar = ? WHERE id = ?').run(
    displayName ?? user.display_name,
    bio ?? user.bio,
    avatar ?? user.avatar,
    req.userId
  )
  res.json(toPublicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)))
})

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const posts = db.prepare('SELECT COUNT(*) AS n FROM posts WHERE user_id = ?').get(req.params.id).n
  res.json({
    ...toPublicUser(user),
    stats: {
      posts,
      followers: user.follower_count,
      following: user.following_count,
      accuracy: null, // computed for real in Phase 5
    },
  })
})

router.get('/:id/posts', optionalAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, COALESCE(SUM(v.value), 0) AS score,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
        (SELECT value FROM votes WHERE post_id = p.id AND user_id = ?) AS my_vote
       FROM posts p LEFT JOIN votes v ON v.post_id = p.id
       WHERE p.user_id = ? GROUP BY p.id ORDER BY p.created_at DESC`
    )
    .all(req.userId ?? null, req.params.id)
  res.json(rows)
})

router.get('/:id/comments', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, p.title AS post_title FROM comments c
       JOIN posts p ON p.id = c.post_id
       WHERE c.user_id = ? ORDER BY c.created_at DESC`
    )
    .all(req.params.id)
  res.json(rows)
})

export default router
