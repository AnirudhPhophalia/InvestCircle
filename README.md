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
| Database  | SQLite via `better-sqlite3` — a single file, raw SQL, no ORM          |
| Auth      | bcrypt password hashing + JWT stored in an HTTP-only cookie          |

Kept deliberately simple: no ORM, no state-management library, no microservices/Docker/CI — a two-folder app (`frontend/`, `backend/`) that any of the four teammates can read end to end.

## Screenshots

| Discussions | News Reel | Portfolio |
| --- | --- | --- |
| ![Discussions](docs/screenshots/discussions.png) | ![News Reel](docs/screenshots/news-reel.png) | ![Portfolio](docs/screenshots/portfolio.png) |

## Getting started

### Prerequisites

- **Node.js 18 or later** (check with `node -v`). `better-sqlite3` installs a small native module, so on Linux you may need build tools (`sudo apt install build-essential python3` on Debian/Ubuntu); macOS and Windows generally work out of the box with a recent Node install.
- No database server, Docker, or API keys to set up — SQLite is a single file created by the seed script, and all market/news/fundamentals data is seeded locally.

### 1. Clone the repo

```bash
git clone https://github.com/AnirudhPhophalia/InvestCircle.git
cd InvestCircle
```

### 2. Backend — API + database

Runs on **http://localhost:4000**.

```bash
cd backend
npm install       # installs express, better-sqlite3, bcrypt, jsonwebtoken, etc.
node seed.js      # creates backend/investcircle.db and fills it with demo users, posts, and news
npm start         # starts the API server
```

You should see `InvestCircle API on http://localhost:4000` in the terminal. Leave this running.

### 3. Frontend — in a second terminal

Runs on **http://localhost:5173**.

```bash
cd frontend
npm install       # installs react, react-router-dom, vite, tailwindcss, etc.
npm run dev
```

Open `http://localhost:5173` in your browser. The frontend expects the backend to already be running on port 4000 (CORS is pre-configured for `localhost:5173` — see `backend/server.js`).

### Resetting the demo data

There's no migration system — if you change `backend/schema.sql`, or just want a clean slate, delete the SQLite file and reseed:

```bash
cd backend
rm -f investcircle.db investcircle.db-wal investcircle.db-shm
node seed.js
```

### Scripts reference

| Location | Command | What it does |
| --- | --- | --- |
| `backend/` | `npm start` | Runs the API once (`node server.js`) |
| `backend/` | `npm run dev` | Same, but restarts on file changes (`node --watch`) |
| `backend/` | `npm run seed` | Wipes and reseeds the database |
| `frontend/` | `npm run dev` | Starts the Vite dev server |
| `frontend/` | `npm run build` | Production build, output to `frontend/dist/` |
| `frontend/` | `npm run preview` | Serves the production build locally |
| `frontend/` | `npm run lint` | Runs `oxlint` over the frontend source |

### Trying the voice-reaction feature

The News Reel and each article's "Read More" page have a **Give your voice** button that opens your real camera and microphone (`getUserMedia`/`MediaRecorder`) — your browser will prompt for permission the first time. This needs a secure context, which `localhost` satisfies automatically; it will not work if you access the dev server from another device by IP without HTTPS.

### Troubleshooting

- **Port already in use** — something else is already on 4000 or 5173. Stop it, or change the port: for the backend, edit `PORT` in `backend/server.js` (and update `origin` in the same file's `cors()` call, and `frontend/src/lib/api.js`'s base URL, to match); for the frontend, run `npm run dev -- --port 5174`.
- **`bcrypt`/`better-sqlite3` fails to install** — these ship native addons. Delete `backend/node_modules` and `backend/package-lock.json`, make sure you have a C++ toolchain installed (see Prerequisites), and re-run `npm install`.
- **Login works but immediately looks logged out** — the session cookie is `httpOnly`/`SameSite=Lax` and scoped to `localhost`; it won't survive if you open the frontend on `127.0.0.1` while the backend is on `localhost` (or vice versa). Use the same hostname for both.
- **Camera/mic recording doesn't prompt** — check your browser hasn't blocked camera/mic permissions for `localhost` from a previous denial (check the site settings in the address bar).

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
  backend/             Express API + SQLite (schema.sql, seed.js, routes/)
  design-reference/    Original Stitch UI export — reference only
  docs/                Build notes and phase plan for this project
  journals/            Per-teammate weekly dev journals
```

## Known limitations (by design, for a prototype)

- No real market-data feed — prices and fundamentals are seeded demo data (clearly labeled in the UI).
- The JWT signing secret is a hardcoded dev value — fine for a local demo, not meant for a real deployment.
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
