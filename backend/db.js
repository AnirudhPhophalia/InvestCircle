import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(dir, 'investcircle.db'))
db.pragma('journal_mode = WAL')
db.exec(readFileSync(path.join(dir, 'schema.sql'), 'utf8'))

export default db
