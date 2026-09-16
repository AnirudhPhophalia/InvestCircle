// Local dev entry point only. On Vercel, api/index.js imports app.js directly
// and Vercel's own runtime handles the HTTP listening.
import app from './app.js'

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`InvestCircle API on http://localhost:${PORT}`))
