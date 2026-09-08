# Week 2 : InvestCircle Phases 1-4

Built out auth, discussions, news reel, and profile/portfolio in one sitting:

- **Auth**: signup/login/logout, bcrypt + JWT-in-cookie sessions, seed script with 3 demo users.
- **Discussions**: hot/new/top feed, voting, comments, new-post form.
- **News Reel**: seeded articles, feed personalized by watchlist tickers, detail page with reactions.
- **Profile**: bio editing, posts/participation/watchlist tabs, real watchlist add/remove.

Also made the top bar's profile avatar and notification bell actually do something (menu + logout, placeholder notifications dropdown) instead of sitting there as dead icons, and wired the search bar to a real query. Tested the whole flow end to end in a real browser (Playwright) in both light and dark mode before calling it done.

Next: Phase 5 — the hit-rate engine.
