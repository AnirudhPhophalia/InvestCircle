# CLAUDE.md — InvestCircle Build Instructions

This file tells Claude Code how to build the InvestCircle prototype. Read it fully before writing any code, and re-read it at the start of every session — especially section 3 and 6.

## 1. What InvestCircle is

InvestCircle is a web-based, peer-to-peer stock research and community platform. It's a college Software Engineering group project (team of four, Lakshay Sachdeva + 3 others), being built over roughly six months. **This is a prototype demo, not a production fintech product** — the goal is a working, demo-able app across all core screens, not a hardened, scalable system. Optimize every decision for "clear and working," not "enterprise-ready."

Three pillars:

1. **Discussions** — Reddit-style stock discussion boards. Users post, comment, upvote/downvote. Each user has a public post history and a "call accuracy" score.
2. **News Reel** — a scrollable, reels-style live market news feed, personalized by the user's portfolio/watchlist. News detail pages show a "what people are saying" reactions section.
3. **Profile & Hit Rate** — personal profile pages showing an AI-inferred "hit rate": free-text posts are scanned for implied stock opinions (ticker + bullish/bearish stance), which are later resolved against price movement to compute an accuracy %.

If a `/docs` folder exists in this repo with prior project documents (PRD, TRD, screen-by-screen breakdown, etc.), skim it for extra context before starting a phase. If it doesn't exist, that's fine — this file and `PHASES.md` are self-contained and are the authoritative plan for the build itself.

## 2. Visual design — do not invent a new look

A UI prototype for this app was already designed in Google Stitch and exported as static HTML. It should be placed in this repo at:

```
design-reference/stitch_investcircle_social_terminal/
```

Each subfolder is one screen, in a light and/or dark variant, containing `code.html` (working markup with an inline Tailwind config) and `screen.png` (a rendered screenshot). `precision_institutional/DESIGN.md` and `precision_institutional_dark/DESIGN.md` document the full design system — colors, type scale, spacing, radii — for light and dark mode respectively.

Screens covered: login, discussions feed, news reel, news detail, and profile ("my_personal").

Rules for using this reference:

- Treat these files as the single source of truth for layout, spacing, color, and type. They are not a mood board to riff on — copy the tokens exactly.
- Pull the exact color values, font families (**Inter** for UI text, **JetBrains Mono** for numbers/prices/timestamps), border-radius scale, and spacing scale straight from the `DESIGN.md` files into `frontend/tailwind.config.js`. Don't eyeball colors from the screenshots.
- Any screen not covered by a Stitch export (comment thread view, new-post form, notifications panel, settings) should extend the same design system rather than introduce a new visual style. When in doubt, look at how the closest existing screen solved a similar layout problem.
- Aesthetic in one line: clean, minimal, Zerodha Kite–style — flat, 1px borders, no shadows or gradients, left sidebar nav, both light and dark mode. Explicitly **not** a dark, Binance-terminal look.

## 3. Ground rules

- **Build one phase at a time.** Phases are defined in `PHASES.md`. Finish a phase, write its journal entry (see section 6), then **stop and wait** for Lakshay to say to continue. Do not start the next phase on your own, even if an earlier instruction said "build the whole app" — that request is satisfied by working through the phases one at a time across sessions, not by doing them all in one sitting.
- **Keep the code as simple as possible.** This is a student demo, not a company codebase. Prefer the boring, obvious solution over the clever one:
  - No state management library — plain React state/context is enough.
  - No TypeScript — plain JavaScript/JSX, so all four teammates can read and edit it.
  - No ORM — raw SQL through `better-sqlite3`. The queries here don't need one.
  - No microservices, no Docker, no CI pipeline. One `frontend/` folder, one `backend/` folder.
  - Comment only where the "why" isn't obvious from the code. Don't narrate every line.
  - If a feature can run off a static or seeded dataset instead of a live integration (market news, historical prices), do that. Real-time external data feeds are out of scope for a demo and just add a way for things to break on presentation day.
- **Don't over-build.** Implement exactly what the current phase asks for in `PHASES.md`. Resist adding extra settings, edge-case handling, or "while I'm here" features — note them in the journal entry instead, and only build them if a later phase actually calls for it.
- **Ask, don't assume**, when a phase's instructions are genuinely ambiguous about something visible (a missing screen, an unclear interaction). Don't ask about things you can just decide sensibly and mention in the journal entry.

## 4. Tech stack

- **Frontend:** React + Vite, plain JavaScript, Tailwind CSS, React Router. Icons via Material Symbols Outlined (a font/CSS import already used in the Stitch export — not an extra npm package).
- **Backend:** Node.js + Express, plain JavaScript. SQLite via `better-sqlite3` — a single database file, nothing to install or run separately.
- **Auth:** email + password, hashed with `bcrypt`; sessions via a signed JWT stored in an HTTP-only cookie.
- **Dev setup:** Vite dev server for the frontend, Express on a separate port for the API, CORS enabled between them. No reverse proxy, no build orchestration tool.
- **Hit-rate / NLP (Phase 5 only):** a simple rule-based extractor — regex to pull tickers out of post text (e.g. `$TSLA`, `TCS`, `NVDA`) plus a small hand-built lexicon of bullish/bearish keywords to infer stance. Not a transformer model. This keeps the whole stack single-language and dependency-light. A transformer-based upgrade is listed as an optional stretch phase at the end of `PHASES.md` — worth doing only if the core phases are done comfortably early.
- **Price data (Phase 5 only):** a small static/seeded set of historical daily closing prices for ~15–20 demo tickers, stored in SQLite. No live market data API — not needed for a demo, and it's one more thing that can fail without internet on presentation day.

## 5. Repo structure

```
investcircle/
  frontend/            React + Vite app
  backend/             Express API + SQLite
  design-reference/    the Stitch export (reference only, not shipped/imported as code)
  journal/             phase-wise dev log, see section 6
  PHASES.md            the phase plan
  CLAUDE.md            this file
```

## 6. Journal

After finishing each phase — code working, checked manually in the browser — write one file to `journal/`, named `phase-0-setup.md`, `phase-1-auth.md`, and so on, matching the phase names in `PHASES.md`.

Write it **as Lakshay Sachdeva**, first person, like a short personal dev log, not a report. Rules:

- Plain, factual, restrained. No marketing language, no exclamation marks, nothing like "successfully implemented a robust, scalable solution."
- Say what was actually built, a sentence or two per feature. If something didn't go as planned or had to be simplified or cut, say that too — it's a log, not a highlight reel.
- 150–300 words is enough. Don't pad it.
- End with one line on what the next phase is.

Example of the tone to match (don't reuse the content, just the register):

> **Phase 1 — Auth**
>
> Got login and signup working today. Used the Stitch login screen pretty much as-is, just wired the form up to the backend. Passwords are hashed with bcrypt, and sessions are a JWT stored in a cookie. Spent a while debugging why the session wasn't surviving a page reload — turned out I hadn't set `httpOnly` and `sameSite` properly on the Express side. Didn't build "forgot password," didn't need it for the demo. Next up is the discussions feed.

## 7. Definition of done, per phase

A phase is done when:

1. The feature works end to end — frontend calling backend calling the database — checked manually in the browser, not just "compiles."
2. It matches the relevant Stitch screen(s): layout, spacing, colors, fonts.
3. The journal entry for that phase is written.
4. Nothing from a later phase has been started.

Then stop, and tell Lakshay the phase is ready for review.
