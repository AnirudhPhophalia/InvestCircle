# Week 3 : Discussions Engine, Portfolio Pipeline & Query Optimization

Focused heavily on backend data pipelines, PostgreSQL query optimization, and the calculations powering the portfolio and discussion feed.

Wrote and tuned the discussion feed endpoints (`/api/posts`), implementing the Hot, New, and Top ranking algorithms directly in Postgres. The Hot sorting formula uses a decay algorithm based on score and elapsed time:
```sql
COALESCE(SUM(v.value), 0) / ((EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600) + 2) DESC
```
PostgreSQL doesn't allow referencing SELECT-list aliases directly in complex ORDER BY expressions, so I optimized the raw SQL query structure and ensured votes and comment counts are aggregated efficiently in a single round-trip.

On the portfolio side, I built the multi-currency holdings calculation logic. The database stores raw user transactions (`buy_price`, `buy_date`, `quantity`, `ticker`), which are enriched against the company fundamentals dataset. Grouped portfolios by currency ($ for US assets, ₹ for Indian equities) to compute accurate Total Invested, Current Valuation, Absolute P&L, and weighted 1-year and 5-year CAGR metrics.

Also handled the atomic comment reactions (`insightful` vs. `flame`) using PostgreSQL's `ON CONFLICT (comment_id, user_id) DO UPDATE` to prevent race conditions when multiple users react at the same time.

Next: integrate real-time market news feeds and contribute to the SRS documentation.
