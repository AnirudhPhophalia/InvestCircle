import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import './db.js'
import authRoutes from './routes/auth.js'
import postRoutes from './routes/posts.js'
import newsRoutes from './routes/news.js'
import userRoutes from './routes/users.js'
import watchlistRoutes from './routes/watchlist.js'
import notificationsRoutes from './routes/notifications.js'

const app = express()

// Trust reverse proxies (Vercel serverless / Neon)
app.set('trust proxy', 1)

// In production on Vercel, frontend and API are served from the same domain
// (/api/* rewrites to api/index.js), so requests are same-origin.
// For local dev, Vite (5173) and Express (4000) are separate origins.
const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173,https://invest-circle.vercel.app'
const allowedOrigins = rawOrigins
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server)
      if (!origin) return callback(null, true)
      const cleanOrigin = origin.trim().replace(/\/+$/, '')
      callback(null, cleanOrigin)
    },
    credentials: true,
  })
)

app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/users', userRoutes)
app.use('/api/watchlist', watchlistRoutes)
app.use('/api/notifications', notificationsRoutes)

export default app
