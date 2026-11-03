# Phase 4 — Profile & Portfolio

Profile page is built off `my_personal_light`, with avatar, bio (editable inline via `PATCH /api/users/me`), the stats row, and the three tabs from the Stitch screen: Posts, Participation, Watchlists.

Posts tab reuses the same post-card component from Discussions. Participation didn't have an obvious data source in the plan, so I read it as "your comments across the app" — added `GET /api/users/:id/comments` joined against the post title, so each row links back to the discussion it's on. Watchlists tab is the real thing: add/remove tickers against `watchlist_items`, backed by `GET/POST/DELETE /api/watchlist`.

Followers/following are the static per-user numbers seeded in Phase 1, not a real social graph, per the phase's own scope. Accuracy % is still a hardcoded `—` — that's genuinely Phase 5.

Also went back and made the top bar's profile icon and notification bell functional, since they'd been sitting there as dead icons since Phase 0: the avatar now shows initials and opens a small menu (view profile / log out), and the bell opens a placeholder "no notifications yet" dropdown — didn't build real notifications since that's explicitly Phase 6, but figured a working button that says so honestly beats one that does nothing.

Renamed the sidebar's "My Portfolio" link to point at `/profile` instead of a separate portfolio route — in the Stitch export that nav item was always the profile screen, so a separate route would've just duplicated it.

Next up is Phase 5 — Hit-Rate Engine.
