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

router.post('/signup', (req, res) => {
  const { email, password, displayName } = req.body
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, password, and display name are required' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) return res.status(409).json({ error: 'An account with that email already exists' })

  const passwordHash = bcrypt.hashSync(password, 10)
  const handle = makeHandle(displayName)
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (email, password_hash, display_name, handle) VALUES (?, ?, ?, ?)')
    .run(email, passwordHash, displayName, handle)

  setSessionCookie(res, lastInsertRowid)
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid)
  res.status(201).json(toPublicUser(user))
})

router.post('/login', (req, res) => {
  const { email, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  setSessionCookie(res, user.id)
  res.json(toPublicUser(user))
})

router.post('/logout', (req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
  if (!user) return res.status(401).json({ error: 'Not logged in' })
  res.json(toPublicUser(user))
})

export default router
