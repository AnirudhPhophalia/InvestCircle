import { Router } from 'express'
import db from '../db.js'
import { requireAuth, optionalAuth } from '../auth.js'
import { toPublicUser } from '../helpers.js'
import { evaluateAccuracyWithGemini } from '../accuracy.js'
import { createNotification } from './notifications.js'

const router = Router()

// Profile photos are stored inline as small data URLs (the browser crops and
// resizes them to 256px first) and get rendered for every viewer, so only
// accept genuine, small PNG/JPEG/WebP images.
const AVATAR_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/
const MAX_AVATAR_LENGTH = 95_000 // stays under express.json()'s default 100 KB body limit

router.patch('/me', requireAuth, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.userId])
  const user = rows[0]
  const { displayName, bio, avatar } = req.body
  if (avatar != null && (typeof avatar !== 'string' || avatar.length > MAX_AVATAR_LENGTH || !AVATAR_PATTERN.test(avatar))) {
    return res.status(400).json({ error: 'Photo must be a small PNG, JPEG or WebP image' })
  }
  await db.query('UPDATE users SET display_name = $1, bio = $2, avatar = $3 WHERE id = $4', [
    displayName ?? user.display_name,
    bio ?? user.bio,
    avatar ?? user.avatar,
    req.userId,
  ])
  const { rows: updated } = await db.query('SELECT * FROM users WHERE id = $1', [req.userId])
  res.json(toPublicUser(updated[0]))
})

router.get('/:id', optionalAuth, async (req, res) => {
  // Accepts a numeric id or a handle (voice reactions link by handle).
  const column = /^\d+$/.test(req.params.id) ? 'id' : 'handle'
  const { rows } = await db.query(`SELECT * FROM users WHERE ${column} = $1`, [req.params.id])
  const user = rows[0]
  if (!user) return res.status(404).json({ error: 'User not found' })
  const { rows: countRows } = await db.query('SELECT COUNT(*) AS n FROM posts WHERE user_id = $1', [user.id])
  
  let accuracyDetails = null
  if (user.accuracy_details) {
    try {
      accuracyDetails = typeof user.accuracy_details === 'string' ? JSON.parse(user.accuracy_details) : user.accuracy_details
    } catch {
      accuracyDetails = null
    }
  }

  // Profiles are public, but an email address is only shown to its owner.
  const { email, ...publicUser } = toPublicUser(user)
  res.json({
    ...publicUser,
    ...(req.userId === user.id ? { email } : {}),
    stats: {
      posts: Number(countRows[0].n),
      followers: user.follower_count,
      following: user.following_count,
      accuracy: user.accuracy != null ? `${user.accuracy}%` : null,
      accuracy_details: accuracyDetails,
    },
  })
})

router.post('/:id/accuracy', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id])
    const user = rows[0]
    if (!user) return res.status(404).json({ error: 'User not found' })

    const apiKey = (req.body?.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()
    if (!apiKey) {
      return res.status(400).json({
        error: 'Gemini API key is required to check accuracy with online data.',
        apiKeyRequired: true,
      })
    }

    const { rows: posts } = await db.query(
      'SELECT id, title, body, tickers, created_at FROM posts WHERE user_id = $1 ORDER BY created_at DESC',
      [id]
    )

    const { rows: comments } = await db.query(
      `SELECT c.id, c.body, c.created_at, p.title AS post_title, p.tickers
       FROM comments c
       JOIN posts p ON p.id = c.post_id
       WHERE c.user_id = $1 ORDER BY c.created_at DESC LIMIT 15`,
      [id]
    )

    const result = await evaluateAccuracyWithGemini({ posts, comments, apiKey })

    // Store in database
    await db.query(
      'UPDATE users SET accuracy = $1, accuracy_details = $2 WHERE id = $3',
      [result.accuracy, JSON.stringify(result), id]
    )

    if (result.accuracy != null) {
      createNotification({
        userId: id,
        actorId: null,
        type: 'accuracy_call',
        title: '🎯 Accuracy Score Calculated',
        message: `Your discussion accuracy was evaluated at ${result.accuracy}% (${result.hits} Hits / ${result.misses} Misses).`,
        link: '/profile',
      })
    }

    const { rows: countRows } = await db.query('SELECT COUNT(*) AS n FROM posts WHERE user_id = $1', [id])

    res.json({
      success: true,
      accuracy: result.accuracy != null ? `${result.accuracy}%` : null,
      stats: {
        posts: Number(countRows[0].n),
        followers: user.follower_count,
        following: user.following_count,
        accuracy: result.accuracy != null ? `${result.accuracy}%` : null,
        accuracy_details: result,
      },
      details: result,
    })
  } catch (err) {
    console.error('Accuracy calculation error:', err)
    res.status(err.status || 500).json({ error: err.message || 'Failed to calculate accuracy' })
  }
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
