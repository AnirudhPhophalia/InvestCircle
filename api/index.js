// Vercel serverless entry point. Every request under /api/* is routed here
// (see vercel.json), and Vercel passes through the original req.url, so
// Express's own routing inside app.js sees the full path as usual.
import app from '../backend/app.js'

export default app
