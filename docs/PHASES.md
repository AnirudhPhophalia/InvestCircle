# PHASES.md — InvestCircle Build Plan

This is the phase-by-phase build plan for the InvestCircle prototype. Claude Code works through these **one at a time**, stops after each, and writes a journal entry (see `CLAUDE.md`, section 6) before waiting for the go-ahead on the next one. Check a phase off once you've reviewed it and are happy with it.

---

## ⬜ Phase 0 — Project Setup & Shell

**Goal:** a running skeleton with the nav shell, routing, and light/dark mode in place — no real features yet.

**Builds on:** all screens, for the shared sidebar/header shell and the light/dark tokens.

**What gets built:**
- `frontend/` (React + Vite + Tailwind) and `backend/` (Express + SQLite) folders, wired to run side by side.
- `tailwind.config.js` populated with the exact colors, fonts, radii, and spacing from `design-reference/.../precision_institutional/DESIGN.md` (light) and `precision_institutional_dark/DESIGN.md` (dark).
- App shell: left sidebar (Discussions / News Reel / My Portfolio), top bar (search, notifications, profile icon), light/dark toggle using Tailwind's `class` strategy.
- React Router set up with placeholder pages for each of the three main sections.
- SQLite file created with an empty schema file (`backend/schema.sql`) — tables added phase by phase, not all up front.

**Out of scope:** any real data, any auth, any of the three pillar features.

**Done when:** app runs locally, sidebar navigation works between three empty pages, and toggling dark mode matches the Stitch dark screens.

**→ Stop. Write `journal/phase-0-setup.md`. Wait for Lakshay before continuing.**

---

## ⬜ Phase 1 — Auth

**Goal:** working login and signup, matching the Stitch login screens.

**Builds on:** `login_light/`, `login_dark/`.

**What gets built:**
- `users` table (id, email, password hash, display name, bio, avatar).
- Backend: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- Frontend: login page and signup page matching the Stitch layout, session persisted via cookie, protected routes redirect to login when logged out.
- A couple of seed users created via a seed script, for testing without signing up fresh every time.

**Out of scope:** forgot-password flow, email verification, OAuth/social login.

**Done when:** you can sign up, log out, log back in, and a logged-out user is redirected away from the app.

**→ Stop. Write `journal/phase-1-auth.md`. Wait for Lakshay before continuing.**

---

## ⬜ Phase 2 — Discussions

**Goal:** the Reddit-style discussion board, working end to end.

**Builds on:** `discussions_light/`, `discussions_dark_minimal/`.

**What gets built:**
- `posts`, `comments`, `votes` tables.
- Backend: `GET /api/posts` (with `hot`/`new`/`top` sort), `POST /api/posts`, `GET /api/posts/:id`, `POST /api/posts/:id/comments`, `POST /api/posts/:id/vote`.
- Frontend: feed page with Hot/New/Top tabs, post cards (ticker tags, upvote/downvote, comment count), a post detail page with comments, and a new-post form (title, body, ticker tags).
- User badges (Verified Analyst / Contributor) shown on posts — a static field on the user for now, not computed.

**Out of scope:** comment upvoting, nested comment replies beyond one level, the "call accuracy" badge (that's Phase 5).

**Done when:** a logged-in user can create a post, vote on posts, and comment, and the feed sorts correctly by each tab.

**→ Stop. Write `journal/phase-2-discussions.md`. Wait for Lakshay before continuing.**

---

## ⬜ Phase 3 — News Reel

**Goal:** the scrollable market news feed and news detail page.

**Builds on:** `news_reel_light_corrected_version/`, `news_reel_dark_corrected/`, `news_detail_light/`, `news_detail_dark_corrected/`.

**What gets built:**
- `news_items` table, seeded with a batch of realistic mock news items (source, headline, body, tags, timestamp, optional image).
- Backend: `GET /api/news` (optionally filtered by the logged-in user's watchlist tickers), `GET /api/news/:id`.
- Frontend: vertically scrolling news feed matching the Stitch reel layout, and a news detail page with the article body and a "what people are saying" reactions section.
- Personalization: if the user has watchlist tickers (Phase 4 adds the watchlist itself — for now, a placeholder array is fine), news tagged with those tickers sorts to the top.

**Out of scope:** live market data ingestion, video reactions (static avatar + name + follower count list is enough, matching the Stitch screen), real-time push updates.

**Done when:** the feed scrolls smoothly, clicking a card opens the detail page, and personalization visibly re-orders the feed when watchlist tickers change.

**→ Stop. Write `journal/phase-3-news-reel.md`. Wait for Lakshay before continuing.**

---

## ⬜ Phase 4 — Profile & Portfolio

**Goal:** the profile page and a real watchlist/portfolio a user can manage.

**Builds on:** `my_personal_light/`, `my_personal_dark_minimal/`.

**What gets built:**
- `watchlist_items` table (user id, ticker).
- Backend: `GET /api/users/:id`, `PATCH /api/users/me` (edit bio etc.), `GET /api/users/:id/posts`, `GET/POST/DELETE /api/watchlist`.
- Frontend: profile page with avatar, bio, stats row (accuracy %, discussions, followers, following), and the Posts / Participation / Watchlists tabs from the Stitch screen. Watchlist tab lets the user add/remove tickers.
- Accuracy % on the stats row is a placeholder (e.g. `—` or a static seeded number) until Phase 5 computes it for real.

**Out of scope:** following/followers as a real social graph — a static count is fine for the demo; don't build a full follow system unless a later phase specifically asks for it.

**Done when:** a user can edit their bio, manage their watchlist, and see their own posts on their profile.

**→ Stop. Write `journal/phase-4-profile.md`. Wait for Lakshay before continuing.**

---

## ⬜ Phase 5 — Hit-Rate Engine

**Goal:** the AI-inferred accuracy score, computed for real off actual post text.

**Builds on:** the accuracy % shown on `my_personal_*` screens.

**What gets built:**
- Seeded `price_history` table: daily closing prices for ~15–20 demo tickers over a fixed date range.
- A rule-based extractor (plain JS, no ML libraries): scans a post's text for tickers (regex) and a bullish/bearish stance (keyword lexicon — e.g. "buy," "breakout," "bullish" vs. "sell," "overvalued," "bearish"). Stores one `calls` row per (post, ticker) it finds a clear stance for; ambiguous posts are skipped rather than guessed at.
- A resolver job: for each call older than a fixed window (e.g. 7 seeded "days" in the demo data), compares the price at call time vs. price at resolution time against the stated stance, and marks the call correct/incorrect.
- Accuracy % on the profile = resolved-correct calls ÷ resolved calls, computed on read, not stored redundantly.

**Out of scope:** a real transformer/sentiment model (see the optional Phase 6.5 below), real-time price feeds, handling multiple conflicting calls on the same ticker in one post.

**Done when:** creating a post with a clear stance on a seeded ticker produces a call, and the profile's accuracy % updates once that call is resolved against the seeded price data.

**→ Stop. Write `journal/phase-5-hit-rate.md`. Wait for Lakshay before continuing.**

---

## ⬜ Phase 6 — Polish & Demo Readiness

**Goal:** the app is ready to actually demo to the class.

**What gets built:**
- Notifications panel (can be a static/mock list — real-time notifications are out of scope).
- Search bar wired to a basic filter across posts and news (simple `LIKE` query, no full-text search engine).
- Settings page: theme toggle persisted (localStorage is fine), basic profile fields.
- Empty states and loading states on every list (feed, news reel, watchlist) so the app never looks broken while data is missing.
- A single seed script that populates a realistic demo dataset — users, posts, news, price history — so the whole team can reset to a known-good state before presenting.

**Done when:** you can run the seed script, walk through all three pillars end to end without console errors, and both light and dark mode look right throughout.

**→ Stop. Write `journal/phase-6-polish.md`.**

---

## ⬜ Optional stretch — Phase 7: Transformer-based Hit Rate

Only take this on if Phases 0–6 are done with time to spare. Swap the keyword-lexicon extractor from Phase 5 for a small transformer sentiment/stance model (a good fit given the NLP/transformers background on the team), likely as a small separate Python script or service that the Node backend calls out to for classification. Keep it isolated behind the same `calls` table and resolver logic from Phase 5, so the rest of the app doesn't need to change — only how a call's stance gets extracted.

**→ If started, stop after it's working and write `journal/phase-7-nlp-upgrade.md`.**
