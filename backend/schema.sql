-- InvestCircle database schema.
-- Tables added phase by phase per PHASES.md; currently covers Phase 1-4.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  avatar TEXT,
  badge TEXT NOT NULL DEFAULT '',
  follower_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tickers TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  parent_id INTEGER REFERENCES comments(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One reaction per user per comment; 'insightful' or 'flame'.
CREATE TABLE IF NOT EXISTS comment_reactions (
  comment_id INTEGER NOT NULL REFERENCES comments(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS votes (
  post_id INTEGER NOT NULL REFERENCES posts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  value INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS news_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  full_article TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  image TEXT,
  published_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Doubles as portfolio holdings: buy_price/buy_date/quantity are set when the
-- user records an actual holding, left NULL for a plain watchlist add.
CREATE TABLE IF NOT EXISTS watchlist_items (
  user_id INTEGER NOT NULL REFERENCES users(id),
  ticker TEXT NOT NULL,
  buy_price REAL,
  buy_date TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, ticker)
);
