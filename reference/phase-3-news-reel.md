# Phase 3 — News Reel

Added the `news_items` table and seeded five realistic mock articles across macro, IT, semis, banking, and earnings — each tagged with tickers/categories (`TCS`, `NVDA`, `JPM,BAC`, etc.). `GET /api/news` returns them newest-first, and if the logged-in user has watchlist tickers, articles matching any of them get stable-sorted to the top. `GET /api/news/:id` returns a single article.

Feed page follows the `news_reel_light_corrected_version` layout — card list with source, timestamp, tags, and a snippet. Left off the ticker-tape and "sector momentum" sidebar widgets from that Stitch screen since they'd need live market data I don't have yet; the core personalized feed is the actual Phase 3 deliverable. Detail page matches `news_detail_light`, including the "what people are saying" reactions section — that one's a static hardcoded list of three names/avatars/follower-counts as the phase notes call for, not real user reactions.

Since Phase 4's watchlist table needed to exist for this personalization to be real rather than a placeholder array, I built `watchlist_items` now instead of stubbing it — saved having to rip out a placeholder later. Alice (one of the seed users) has NVDA and JPM watchlisted, so logging in as her visibly reorders the feed versus Bob or Carol.

Confirmed in the browser: the feed reorders correctly when watchlist tickers change, and clicking a card opens the detail page.

Next up is Phase 4 — Profile & Portfolio.
