# Phase 1 — Auth

Login and signup are working end to end. Added a `users` table (email, password hash, display name, a generated `handle`, bio, avatar, badge, follower/following counts) and four routes: `POST /api/auth/signup`, `/login`, `/logout`, and `GET /api/auth/me`. Passwords are hashed with `bcrypt`, sessions are a JWT in an httpOnly cookie (`sameSite: lax` since frontend and backend are on different ports in dev), and there's a small `requireAuth`/`optionalAuth` middleware pair — the latter for routes like the feed that behave differently when logged in but shouldn't hard-require it.

Built the login and signup pages off the Stitch `login_light`/`login_dark` markup — signup isn't in the Stitch export so I extended the same card layout with a display name field. Dropped the "forgot password" link and the Google OAuth button from the login screen since both are explicitly out of scope for Phase 1.

The whole app is now wrapped in a `ProtectedRoute` that bounces logged-out users to `/login` and remembers where they were headed. Added a `seed.js` script (`npm run seed` in `backend/`) that resets the DB with three demo users — alice/bob/carol `@investcircle.dev`, password `password123` — so the team doesn't have to sign up fresh every time.

One thing I skipped: real profile picture uploads — avatar is currently either a URL (unused for now) or a generated initials avatar. Fine for a demo, revisit if it ever matters.

Next up is Phase 2 — Discussions.
