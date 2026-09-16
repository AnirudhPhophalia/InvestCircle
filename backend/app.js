import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import './db.js'
import authRoutes from './routes/auth.js'
import postRoutes from './routes/posts.js'
import newsRoutes from './routes/news.js'
import userRoutes from './routes/users.js'
import watchlistRoutes from './routes/watchlist.js'

const app = express()
// In production, frontend and API are served from the same Vercel domain, so
// the browser never sends a cross-origin request and CORS doesn't apply. This
// origin only matters for local dev, where Vite (5173) and Express (4000)
// are separate origins.
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/users', userRoutes)
app.use('/api/watchlist', watchlistRoutes)

export default app
