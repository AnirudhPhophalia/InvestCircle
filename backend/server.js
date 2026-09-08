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
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/users', userRoutes)
app.use('/api/watchlist', watchlistRoutes)

const PORT = 4000
app.listen(PORT, () => console.log(`InvestCircle API on http://localhost:${PORT}`))
