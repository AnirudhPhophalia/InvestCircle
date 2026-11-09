# Week 6 : Live Notifications, Monorepo Deployment & Demo Readiness

Wrapped up Phase 6 and final demo preparations, focusing on the interactive live notification system, single-domain Vercel deployment architecture, and platform polish.

### 1. Live Notification System
Built out the full notification infrastructure to make the app feel alive during discussions:
- Added the `notifications` table to PostgreSQL with support for targeted user notifications and global broadcast alerts (`user_id IS NULL`).
- Built `/api/notifications` routes with automatic event triggers:
  - Notifies post authors when someone comments on their thread.
  - Broadcasts alerts when new market discussions are started.
  - Sends a notification when a user's accuracy score finishes computing.
- Updated the header bell menu in `Layout.jsx` with an active unread count badge, filter tabs (All / Unread), and visual category chips (Market Alert, Signal, Accuracy Call).
- Added an inline "Broadcast Alert" composer allowing users to post real-time alerts directly, plus a one-click simulation trigger for presentation demonstrations. Added floating toast banners for new alerts arriving while browsing.

### 2. Vercel Single-Domain Deployment & Architecture
InvestCircle is architected as a full monorepo hosted entirely on Vercel with Neon PostgreSQL:
- Frontend (React + Vite) is served as a static build from `frontend/dist`.
- Backend (Express) runs as a unified Vercel serverless function entrypoint (`api/index.js`), with all requests under `/api/*` routed directly to it via `vercel.json` rewrites.
- Ensured `frontend/src/shared/lib/api.js` strictly routes requests to the relative `/api` path in production. This guarantees same-origin communication, completely eliminating cross-origin CORS overhead and enabling secure, native first-party session cookies (`SameSite=Lax`) on `invest-circle.vercel.app`.

### 3. Environment Templates & Codebase Audit
Created comprehensive `.env.example` templates across root, `backend/`, and `frontend/` documenting all ports, database URLs, JWT secrets, and API keys. Ran an audit through `oxlint` and Vite builds to ensure zero compile warnings or runtime errors before presentation day.
