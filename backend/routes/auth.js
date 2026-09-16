import { Router } from 'express'
import bcrypt from 'bcrypt'
import db from '../db.js'
import { setSessionCookie, clearSessionCookie, requireAuth } from '../auth.js'
import { toPublicUser } from '../helpers.js'

const router = Router()

function makeHandle(displayName) {
  const base = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  const suffix = Math.floor(Math.random() * 10000)
  return `${base || 'user'}_${suffix}`
}

router.post('/signup', async (req, res) => {
  const { email, password, displayName } = req.body
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, password, and display name are required' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length) return res.status(409).json({ error: 'An account with that email already exists' })

  const passwordHash = await bcrypt.hash(password, 10)
  const handle = makeHandle(displayName)
  const inserted = await db.query(
    'INSERT INTO users (email, password_hash, display_name, handle) VALUES ($1, $2, $3, $4) RETURNING id',
    [email, passwordHash, displayName, handle]
  )
  const userId = inserted.rows[0].id

  setSessionCookie(res, userId)
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [userId])
  res.status(201).json(toPublicUser(rows[0]))
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email])
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  setSessionCookie(res, user.id)
  res.json(toPublicUser(user))
})

router.post('/logout', (req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.userId])
  if (!rows[0]) return res.status(401).json({ error: 'Not logged in' })
  res.json(toPublicUser(rows[0]))
})

export default router
