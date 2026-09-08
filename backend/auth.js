import jwt from 'jsonwebtoken'

// Dev-only secret — fine for a student prototype, not for production.
const JWT_SECRET = 'investcircle-dev-secret'
const COOKIE_NAME = 'ic_session'

export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function setSessionCookie(res, userId) {
  res.cookie(COOKIE_NAME, signToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME)
}

export function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME]
  if (!token) return res.status(401).json({ error: 'Not logged in' })
  try {
    req.userId = jwt.verify(token, JWT_SECRET).userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid session' })
  }
}

// Like requireAuth, but doesn't reject when logged out — just leaves req.userId unset.
export function optionalAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME]
  if (token) {
    try {
      req.userId = jwt.verify(token, JWT_SECRET).userId
    } catch {
      // ignore bad/expired token, treat as logged out
    }
  }
  next()
}
