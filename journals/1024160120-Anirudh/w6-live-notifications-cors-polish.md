# Week 6 : Live Notifications, Cross-Origin Auth & Demo Readiness

Wrapped up Phase 6 and final demo preparations, focusing on the interactive live notification system, resolving cross-site production deployment bugs, and polishing the platform.

### 1. Live Notification System
Built out the full notification infrastructure to make the app feel alive during discussions:
- Added the `notifications` table to PostgreSQL with support for targeted user notifications and global broadcast alerts (`user_id IS NULL`).
- Built `/api/notifications` routes with automatic event triggers:
  - Notifies post authors when someone comments on their thread.
  - Broadcasts alerts when new market discussions are started.
  - Sends a notification when a user's accuracy score finishes computing.
- Updated the header bell menu in `Layout.jsx` with an active unread count badge, filter tabs (All / Unread), and visual category chips (Market Alert, Signal, Accuracy Call).
- Added an inline "Broadcast Alert" composer allowing users to post real-time alerts directly, plus a one-click simulation trigger for presentation demonstrations. Added floating toast banners for new alerts arriving while browsing.

### 2. Cross-Origin Auth & CORS Resolution
Ran into a critical deployment issue where the Vercel frontend (`https://invest-circle.vercel.app`) was blocked from communicating with the Render backend (`https://investcircle.onrender.com`):
- Diagnosed the CORS failure: the backend `Access-Control-Allow-Origin` had an extra trailing slash (`https://invest-circle.vercel.app/`), which browsers reject because origins must match character-for-character without trailing slashes. Sanitized origin normalization in `backend/app.js`.
- Fixed cross-site session cookies in `backend/auth.js`: because frontend and backend live on separate domains, browsers dropped cookies with `SameSite=Lax`. Switched production cookies to `SameSite=None; Secure`, and enabled `app.set('trust proxy', 1)` so Express respects HTTPS headers behind Render's reverse proxy.

### 3. Environment Templates & Codebase Audit
Created comprehensive `.env.example` templates across root, `backend/`, and `frontend/` documenting all ports, database URLs, JWT secrets, and API keys. Ran an audit through `oxlint` and Vite builds to ensure zero compile warnings or runtime errors before presentation day.
