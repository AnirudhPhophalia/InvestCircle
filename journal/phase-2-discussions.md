# Phase 2 — Discussions

The discussion board works end to end now. Added `posts`, `comments`, and `votes` tables, and the routes from the plan: `GET /api/posts` (with `sort=hot|new|top`), `POST /api/posts`, `GET /api/posts/:id`, `POST /api/posts/:id/comments`, `POST /api/posts/:id/vote`.

"Hot" turned out to need an actual decision — went with a simple gravity formula (`score / (hours_since_post + 2)`) computed straight in the SQL `ORDER BY`, rather than pulling the whole table into JS to sort. "New" and "Top" are just `created_at` / `score` order. Voting is upsert-based (one row per post/user in `votes`, `ON CONFLICT` updates it, value `0` deletes it) so a user can flip or retract a vote.

Frontend-wise: feed page with the three sort tabs, post cards copied from the `discussions_light` Stitch markup (vote column, ticker tags, verified/contributor badge, comment count), a post detail page with a comment form, and a new-post form with a comma-separated tickers field. Badges are the static per-user field from Phase 1, not computed.

Wired the top bar search into this — pressing enter searches post titles/bodies/tickers with a `LIKE` query, which is a bit ahead of Phase 6's plan but was cheap to add alongside the sort query and made the search bar in the shell actually do something instead of sitting there dead.

Skipped: comment upvoting, nested replies, and the call-accuracy badge (Phase 5), per the phase's own scope.

Next up is Phase 3 — News Reel.
