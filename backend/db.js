import pg from 'pg'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Postgres returns bigint (COUNT/SUM results) as strings by default, to avoid
// precision loss beyond Number.MAX_SAFE_INTEGER. This app's counts never get
// remotely that large, so parse them as plain numbers -- otherwise frontend
// code like `a.insightful_count + a.flame_count` silently does string
// concatenation instead of addition.
pg.types.setTypeParser(20, (val) => parseInt(val, 10))

const dir = path.dirname(fileURLToPath(import.meta.url))

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. See README.md for local Postgres / Vercel Postgres setup.')
}

// Hosted Postgres (Vercel Postgres/Neon, Supabase, etc.) requires SSL; a local
// "postgresql://localhost..." URL does not speak SSL at all, so only ask for it
// when the URL doesn't already point at localhost.
const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
})

await pool.query(readFileSync(path.join(dir, 'schema.sql'), 'utf8'))

export default pool
