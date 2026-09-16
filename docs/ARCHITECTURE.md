# InvestCircle — Architecture & Flow

How the app is put together and how data moves through it, end to end. Written for the team (and anyone presenting the demo) to explain *why* a request behaves the way it does, not just what the code says.

## 1. Stack at a glance

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React + Vite, Tailwind CSS, React Router | Fast dev server, no build config to maintain |
| Backend | Node.js + Express | Small, one process, easy for all four of us to read |
| Database | PostgreSQL, raw SQL via `pg` | No ORM to learn; SQL is portable to any Postgres host |
| Auth | bcrypt + JWT in an HTTP-only cookie | Stateless sessions — no session table to manage |
| Hosting | Vercel (frontend static build + backend as one serverless function) | Same domain for both halves — no CORS/cookie fights in production |

No ORM, no state-management library (React Context does that job — see §5), no microservices. Two folders: `frontend/` and `backend/`.

## 2. Request flow, top to bottom

```
Browser (React app, :5173 in dev)
   │  fetch(..., { credentials: 'include' })
   ▼
Express app (backend/app.js, :4000 in dev)
   │  cors → cookie-parser → express.json → routes
   ▼
Route handler (backend/routes/*.js)
   │  db.query('SELECT ... $1', [params])
   ▼
PostgreSQL (local Homebrew instance in dev, Vercel Postgres/Neon in prod)
```

- `frontend/src/lib/api.js` is the single chokepoint every API call goes through. It always sends `credentials: 'include'` (so the session cookie rides along) and throws on a non-2xx response so callers can just `await` and `catch`.
- In dev, frontend and backend are two different ports (`5173` and `4000`) — different origins — so CORS has to be explicitly allowed (`backend/app.js`) and the cookie needs `SameSite=Lax` rather than `Strict`.
- In production they're the same Vercel domain (`/api/*` is rewritten to the serverless function — see `vercel.json`), so it's technically a same-origin request. CORS stops mattering there, but the code path is identical either way — nothing branches on environment except which base URL `api.js` points at.

## 3. Auth: signup/login and how a session actually works

This is the part worth understanding in detail since almost every route depends on it.

### 3.1 Signup / Login (`backend/routes/auth.js`)

1. User submits the form → `POST /api/auth/signup` or `/login`.
2. **Signup**: password is hashed with `bcrypt.hash(password, 10)` — never stored in plain text — and a new row goes into `users`. **Login**: the submitted password is checked against the stored hash with `bcrypt.compare`; bcrypt handles the salt internally, we never see it.
3. Either way, once the user is verified/created, the server calls `setSessionCookie(res, userId)` (`backend/auth.js`):
   - Signs a JWT: `jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })`. The token's payload is just the user id — nothing sensitive, since JWTs are signed but *not* encrypted; anyone can decode and read the payload, they just can't forge a new one without the secret.
   - Puts that token in a cookie named `ic_session`, with `httpOnly: true` (JavaScript in the browser can never read it — the main defense against XSS stealing the session) and `sameSite: 'lax'` (blocks most cross-site request forgery vectors while still letting normal navigation work).
4. The response body is the public user object (`toPublicUser` in `backend/helpers.js` strips `password_hash` before it ever leaves the server). The frontend's `AuthContext` stores this in React state so the UI knows who's logged in — but the actual *proof* of the session lives only in the cookie.

### 3.2 Every request after that

The browser doesn't do anything special — cookies are attached to requests automatically by the browser for any request to that domain, as long as `credentials: 'include'` is set on the `fetch` (which `api.js` always does). No token handling in frontend code at all; no `localStorage`, no `Authorization` header.

On the server, two Express middlewares in `backend/auth.js` read that cookie:

- **`requireAuth`** — reads `ic_session`, verifies the JWT signature with `jwt.verify`, and if valid sets `req.userId` from the payload. If the cookie is missing or the signature/expiry check fails, it responds `401` immediately and the route handler never runs. Used on anything that mutates state as a specific user: posting, commenting, voting, recording a voice reaction, editing the watchlist.
- **`optionalAuth`** — same check, but never rejects. If there's no valid cookie it just leaves `req.userId` unset and calls `next()` anyway. Used on read routes that change slightly when logged in (e.g. the discussions list includes *your* vote on each post if you're logged in, but still returns the list if you're not).

Crucially, the server **never has to store sessions anywhere**. Verifying a JWT is pure computation (checking a cryptographic signature against `JWT_SECRET`) — no database lookup, no session table, no Redis. That's the whole point of using a JWT instead of a traditional session id: any server process that knows `JWT_SECRET` can verify any token, which is also exactly why keeping `JWT_SECRET` out of git and setting a real one in production (see the README's deploy steps) matters — anyone with that string can mint a valid cookie for any user id.

### 3.3 Logout and expiry

- **Logout** (`POST /api/auth/logout`) just calls `res.clearCookie('ic_session')` — there's no server-side token to invalidate, because nothing was stored server-side in the first place. The old JWT would still verify successfully if replayed before it naturally expires, but it's no longer sitting in the browser's cookie jar to be replayed automatically.
- **Expiry**: the cookie and the JWT are both set to expire after 7 days (`maxAge` on the cookie, `expiresIn` on the token — kept in sync deliberately). After that, `jwt.verify` throws on the expired token, `requireAuth`/`optionalAuth` catch it and treat the user as logged out, same as if the cookie were simply absent.

### 3.4 One end-to-end example: opening the app while already logged in

`AuthContext` (`frontend/src/context/AuthContext.jsx`) calls `GET /api/auth/me` once, on mount, wrapped in `requireAuth`. If the cookie is still valid, the server looks up that user id fresh from the database and returns it — so the frontend never trusts stale data baked into the token itself, only the id. If the cookie is missing/expired, this 401s and `AuthContext` just sets `user = null`, and the router's protected routes redirect to `/login`.

## 4. Database

- Schema lives in `backend/schema.sql`, run automatically on every backend startup via `CREATE TABLE IF NOT EXISTS` (`backend/db.js`) — there's no separate migration step or migration tool.
- Core tables: `users`, `posts`, `comments`, `votes`, `comment_reactions`, `news`, `watchlist_items`. Everything is connected by foreign keys (`user_id`, `post_id`, etc.) — no denormalized counters stored on the parent row; counts like a post's score or a comment's reaction totals are computed with `SUM`/`COUNT` at query time (see `backend/routes/posts.js`).
- All access is raw parameterized SQL through the `pg` driver (`$1, $2, ...` placeholders) — no ORM. Parameterization is what prevents SQL injection; user input is never string-concatenated into a query.
- Writes that touch multiple tables together (e.g. seeding demo data) use a real transaction: `client.query('BEGIN')` → the writes → `COMMIT`, with `ROLLBACK` in a `catch` — so a failure partway through can't leave the database half-written.

## 5. Frontend state — Context, not Redux

Three React Contexts sit above the router in `App.jsx`, each owning one slice of state that multiple pages need:

- **`AuthContext`** — who's logged in (§3.4).
- **`TickerContext`** — which company's fundamentals panel is currently showing, since a news story, a post, and a discussion can all "point at" the same ticker and should update the same panel.
- **`VoiceReactionsContext`** — voice reactions recorded on news stories. This one exists specifically so a recording survives navigating away and back (News Reel → Discussions → News Reel) — it used to live in page-level `useState` and got wiped on unmount every time, which broke the live demo. Lifting it above the router means it lives as long as the tab does.

Pages read these via a `useX()` hook (`useAuth()`, `useTicker()`, `useVoiceReactions()`) instead of prop-drilling. Nothing here talks to a global store library — it's plain `useState` + `useContext`, which is enough for four screens and three shared slices of state.

## 6. Feature flows

### Discussions (Reddit-style board)
`POST /api/posts` creates a post → `GET /api/posts?sort=hot|new|top` lists them, computing each post's score as `SUM(votes.value)` live and ordering by it (see the Postgres-specific note on `SORTS.hot` in `backend/routes/posts.js` about why the ORDER BY repeats the full expression instead of reusing the SELECT alias). Voting (`POST /api/posts/:id/vote`) is an upsert (`ON CONFLICT ... DO UPDATE`) — a user has at most one vote row per post, so re-clicking upvote just flips or clears it rather than piling up rows.

### News Reel + voice reactions
News items are seeded rows with a `full_article` column (powers "Read More"). Recording a reaction uses the browser's `getUserMedia`/`MediaRecorder` APIs directly (`CameraRecorder.jsx`) — no upload to the server; the recording plus its bullish/bearish stance and optional comment are stored client-side in `VoiceReactionsContext`, keyed by news id, and rendered by one shared component (`VoiceReactorList.jsx`) used on both the News Reel and the News Detail "Read More" page, so a change to how reactions render only has to be made once.

### Portfolio
Seeded holdings (`watchlist_items`) join against seeded price data to compute live P&L and per-currency summary cards entirely on the frontend/at query time — there's no live market-data integration; it's clearly demo data by design (see the README's Known Limitations).

## 7. Deployment shape

One Vercel project serves both halves (`vercel.json` + `api/index.js`, which just imports and re-exports the same Express app from `backend/app.js` — the identical code runs locally via `server.js` and in production as a serverless function, nothing forked between the two). Same domain in production means the auth flow in §3 needs no changes at all between dev and prod — it's the same cookie, same middleware, same JWT — only the CORS origin and the `secure` flag on the cookie differ, and both are already environment-driven in the code. See the README's "Deploying to Vercel" section for the actual provisioning steps (Postgres, `JWT_SECRET`, seeding).
