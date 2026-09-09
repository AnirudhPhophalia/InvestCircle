# InvestCircle

InvestCircle is a peer-to-peer stock research and community platform — a place for retail investors to discuss stocks, follow market news, and track their own portfolio, all in one clean, dashboard-style app.

This is a college Software Engineering group project. It is a working prototype/demo built to showcase the core product experience end-to-end, not a production trading or brokerage system — it does not execute trades or connect to any real brokerage or bank account.

## Features

- **Discussions** — a Reddit-style stock discussion board with upvotes/downvotes, threaded comment replies, and per-comment reactions (insightful / flame). Sort by Hot, New, or Top.
- **News Reel** — a swipeable, Instagram-Reels-style market news feed. Read More opens the full article. Users can react to a story by recording a real camera/mic voice note, tagging it Bullish or Bearish, and adding a text comment — reactions play back in a full-screen, Stories-style viewer with like/bullish/bearish reactions.
- **Portfolio** — a personal portfolio page with real holdings (buy date, buy price, quantity), live P&L per holding, and per-currency summary cards (total corpus, total invested, absolute return, 1Y/5Y average return).
- **Company Fundamentals** — a fundamentals panel (price, market cap, P/E, book value, dividend yield, ROE/ROCE, growth tables) that dynamically follows whichever company the news story, post, or discussion is about.
- **Auth** — email/password signup and login, sessions via an HTTP-only cookie.
- **Light and dark mode**, toggleable from the top bar.

## Tech stack

| Layer     | Choice                                                              |
| --------- | -------------------------------------------------------------------- |
| Frontend  | React + Vite, Tailwind CSS, React Router — plain JavaScript, no TypeScript |
| Backend   | Node.js + Express, plain JavaScript                                  |
| Database  | PostgreSQL via `pg` — raw SQL, no ORM                                 |
| Auth      | bcrypt password hashing + JWT stored in an HTTP-only cookie          |
| Hosting   | Vercel — frontend (static build) and backend (serverless functions under `/api`) deployed together from one project |

Kept deliberately simple: no ORM, no state-management library, no microservices/Docker/CI — a two-folder app (`frontend/`, `backend/`) that any of the four teammates can read end to end.

## Screenshots

| Discussions | News Reel | Portfolio |
| --- | --- | --- |
| ![Discussions](docs/screenshots/discussions.png) | ![News Reel](docs/screenshots/news-reel.png) | ![Portfolio](docs/screenshots/portfolio.png) |

## Getting started

### Prerequisites

- **Node.js 18 or later** (check with `node -v`). `bcrypt` installs a small native module, so on Linux you may need build tools (`sudo apt install build-essential python3` on Debian/Ubuntu); macOS and Windows generally work out of the box with a recent Node install.
- **A PostgreSQL database.** For local dev, either install Postgres yourself (e.g. `brew install postgresql@16` on macOS) or point `DATABASE_URL` at any hosted instance (the same Vercel Postgres/Neon database used for deployment works fine for local dev too — see "Deploying to Vercel" below). There's no separate migration step: the app runs `backend/schema.sql` automatically on startup (`CREATE TABLE IF NOT EXISTS`), so a brand-new empty database is all you need.

### 1. Clone the repo

```bash
git clone https://github.com/AnirudhPhophalia/InvestCircle.git
cd InvestCircle
```

### 2. Create a local database (skip if using a hosted one)

```bash
createdb investcircle
```

### 3. Backend — API + database

Runs on **http://localhost:4000**.

```bash
cd backend
npm install       # installs express, pg, bcrypt, jsonwebtoken, etc.
export DATABASE_URL="postgresql://localhost:5432/investcircle"   # or your hosted connection string
node seed.js      # creates the tables and fills them with demo users, posts, and news
npm start         # starts the API server
```

You should see `InvestCircle API on http://localhost:4000` in the terminal. Leave this running. `DATABASE_URL` needs to be set in every terminal that runs the backend (export it, or prefix each command: `DATABASE_URL=... node seed.js`).

### 4. Frontend — in a second terminal

Runs on **http://localhost:5173**.

```bash
cd frontend
npm install       # installs react, react-router-dom, vite, tailwindcss, etc.
npm run dev
```

Open `http://localhost:5173` in your browser. The frontend expects the backend to already be running on port 4000 (CORS is pre-configured for `localhost:5173` — see `backend/app.js`).

### Resetting the demo data

There's no migration system beyond `CREATE TABLE IF NOT EXISTS` — if you change `backend/schema.sql` in a way that needs a clean slate, drop and recreate the database, then reseed:

```bash
dropdb investcircle && createdb investcircle
cd backend
DATABASE_URL="postgresql://localhost:5432/investcircle" node seed.js
```

### Scripts reference

| Location | Command | What it does |
| --- | --- | --- |
| `backend/` | `npm start` | Runs the API once (`node server.js`) |
| `backend/` | `npm run dev` | Same, but restarts on file changes (`node --watch`) |
| `backend/` | `npm run seed` | Wipes and reseeds the database (needs `DATABASE_URL`) |
| `frontend/` | `npm run dev` | Starts the Vite dev server |
| `frontend/` | `npm run build` | Production build, output to `frontend/dist/` |
| `frontend/` | `npm run preview` | Serves the production build locally |
| `frontend/` | `npm run lint` | Runs `oxlint` over the frontend source |

### Trying the voice-reaction feature

The News Reel and each article's "Read More" page have a **Give your voice** button that opens your real camera and microphone (`getUserMedia`/`MediaRecorder`) — your browser will prompt for permission the first time. This needs a secure context, which `localhost` (and any `https://` deployment, like Vercel) satisfies automatically.

### Troubleshooting

- **Port already in use** — something else is already on 4000 or 5173. Stop it, or change the port: for the backend, set `PORT=4001` (and update `frontend/src/lib/api.js`'s dev `BASE` to match); for the frontend, run `npm run dev -- --port 5174`.
- **`DATABASE_URL is not set` error on startup** — export it in the same terminal before running `node seed.js` / `npm start` (step 3 above).
- **`bcrypt` fails to install** — it ships a native addon. Delete `backend/node_modules` and `backend/package-lock.json`, make sure you have a C++ toolchain installed (see Prerequisites), and re-run `npm install`.
- **Login works but immediately looks logged out** — the session cookie is `httpOnly`/`SameSite=Lax` and scoped to `localhost`; it won't survive if you open the frontend on `127.0.0.1` while the backend is on `localhost` (or vice versa). Use the same hostname for both.
- **Camera/mic recording doesn't prompt** — check your browser hasn't blocked camera/mic permissions for the site from a previous denial (check the site settings in the address bar).

## Deploying to Vercel

The whole app — frontend and backend — deploys as **one Vercel project**: the React app builds to static files, and the Express API runs as a serverless function under `/api`. Same domain for both means no CORS or cross-site cookie issues to fight with, which is the most reliable setup for a live demo.

`vercel.json` at the repo root already configures the build (`frontend/` builds, `api/index.js` serves the API); you don't need to change anything there. What's left is provisioning a database and setting one environment variable.

### 1. Import the repo into Vercel

If not already done: on [vercel.com](https://vercel.com), **Add New → Project**, import `AnirudhPhophalia/InvestCircle`, and leave **Root Directory** as the repo root (not `frontend/` — `vercel.json` handles both halves from there). Vercel picks up `installCommand`/`buildCommand`/`outputDirectory` from `vercel.json` automatically.

### 2. Create a Postgres database

In the Vercel dashboard: your project → **Storage** tab → **Create Database** → **Postgres** (this is Neon-backed). Connect it to the project — Vercel automatically adds a `DATABASE_URL` environment variable for you, no copy-pasting a connection string required.

(Using Supabase or another provider instead is fine too — just add `DATABASE_URL` yourself under **Settings → Environment Variables** with that provider's connection string.)

### 3. Set the JWT secret

Still under **Settings → Environment Variables**, add:

- `JWT_SECRET` — any long random string (e.g. generate one with `openssl rand -hex 32`). Without this, sessions fall back to a shared dev-only secret, which is fine for a demo but not something to leave in place long-term.

### 4. Deploy

Push to `main` (or click **Redeploy** in the dashboard) — Vercel builds and deploys automatically. The tables are created on first request (`backend/db.js` runs `schema.sql` on startup), but they'll be **empty** until you seed them.

### 5. Seed the production database

Run the seed script from your machine, pointed at the production database, once:

```bash
cd backend
DATABASE_URL="<the same connection string Vercel is using>" node seed.js
```

Find that connection string under Vercel → your project → **Storage** → your database → **.env.local** tab (copy the `DATABASE_URL` value), or run `vercel env pull` in the project if you have the Vercel CLI installed. Re-run this any time you want to reset the demo data back to its original state — it wipes and reseeds every table.

Once seeded, the deployed URL is a fully working demo — same demo accounts as local dev (see below).

### Demo accounts

Seeded by `node seed.js`, all with password `password123`:

| Email | Name | Badge |
| --- | --- | --- |
| `lakshay@investcircle.dev` | Lakshay Sachdeva | Verified SEBI Analyst |
| `anirudh@investcircle.dev` | Anirudh Phophalia | Contributor |
| `ishan@investcircle.dev` | Ishan Jha | Retail Investor |
| `aarav@investcircle.dev` | Aarav Kumar Arora | Contributor |

## Project structure

```
InvestCircle/
  frontend/            React + Vite app
  backend/             Express API + PostgreSQL (schema.sql, seed.js, routes/, app.js)
  api/index.js         Vercel serverless entry point (imports backend/app.js)
  vercel.json          Vercel build/routing config for the combined deployment
  design-reference/    Original Stitch UI export — reference only
  docs/                Build notes and phase plan for this project
  journals/            Per-teammate weekly dev journals
```

## Known limitations (by design, for a prototype)

- No real market-data feed — prices and fundamentals are seeded demo data (clearly labeled in the UI).
- The JWT signing secret falls back to a shared dev-only value if `JWT_SECRET` isn't set — fine for local dev, set it explicitly in production (see Deploying to Vercel).
- No password reset, email verification, or rate limiting.

## Team

| Name | Roll No. | Role |
| --- | --- | --- |
| Lakshay Sachdeva | 1024160104 | Full-Stack Developer & Team Lead |
| Anirudh Phophalia | 1024160120 | Backend Engineer |
| Ishan Jha | 1024160099 | Frontend Engineer |
| Aarav Kumar Arora | 1024160106 | UI/UX Designer & QA |

## License

See [LICENSE](LICENSE).
