// Populates the database with a small demo dataset. Re-run any time with `npm run seed`.
import bcrypt from 'bcrypt'
import db from './db.js'

const users = [
  { email: 'lakshay@investcircle.dev', displayName: 'Lakshay Sachdeva', handle: 'lakshay_sachdeva', badge: 'Verified SEBI Analyst', bio: 'SEBI-registered research analyst covering IT services and semiconductors.', followers: 12409, following: 45 },
  { email: 'anirudh@investcircle.dev', displayName: 'Anirudh Phophalia', handle: 'anirudh_phophalia', badge: 'Contributor', bio: 'Swing trader, mostly large caps.', followers: 892, following: 130 },
  { email: 'ishan@investcircle.dev', displayName: 'Ishan Jha', handle: 'ishan_jha', badge: 'Retail Investor', bio: 'Macro-curious retail investor.', followers: 54, following: 61 },
  { email: 'aarav@investcircle.dev', displayName: 'Aarav Kumar Arora', handle: 'aarav_arora', badge: 'Contributor', bio: 'New to the markets, learning in public.', followers: 23, following: 40 },
]
const PASSWORD = 'password123'

const posts = [
  { by: 'lakshay_sachdeva', title: 'TCS Q3 Results Analysis: Margins expand despite macro headwinds', body: 'Operating margins expanded 50 bps sequentially despite the broader IT slowdown. Order book remains solid at $8.1B. Maintaining an overweight stance.', tickers: 'TCS' },
  { by: 'anirudh_phophalia', title: 'Technical breakout observed in NVDA post-consolidation phase. Volume confirming.', body: 'RSI cooled off to 45 and bounced. MACD crossover imminent on the daily chart. Watching the $850 resistance level closely.', tickers: 'NVDA' },
  { by: 'ishan_jha', title: 'Fed rate hold impact on banking sector Net Interest Margins', body: "The 'higher for longer' rhetoric is reshaping expectations for regional and major banks. Deposit betas are catching up faster than modeled.", tickers: 'JPM,BAC' },
  { by: 'lakshay_sachdeva', title: 'Is INFY overvalued at these levels?', body: 'Guidance cut last quarter still weighing on sentiment. Valuation looks fair relative to peers but growth visibility is the concern.', tickers: 'INFY' },
]

const comments = [
  { onPostIndex: 0, by: 'anirudh_phophalia', body: 'Agree on the margin story, but order book growth is decelerating YoY.' }, // 0
  { onPostIndex: 0, by: 'ishan_jha', body: "What's your price target?" }, // 1
  { onPostIndex: 0, replyTo: 1, by: 'lakshay_sachdeva', body: 'Around ₹4,400 over the next two quarters if margins hold up.' }, // 2
  { onPostIndex: 0, replyTo: 0, by: 'lakshay_sachdeva', body: "Fair point — I'm watching the order book number closely too, flagged it as the key risk in the post." }, // 3
  { onPostIndex: 0, by: 'anirudh_phophalia', body: "Worth noting the BFSI vertical alone grew 6% QoQ, that's the real story here." }, // 4
  { onPostIndex: 1, by: 'lakshay_sachdeva', body: 'Volume on the breakout day was 2x the 20-day average, decent confirmation.' }, // 5
  { onPostIndex: 1, replyTo: 5, by: 'ishan_jha', body: "Good catch, hadn't checked the volume profile myself." }, // 6
  { onPostIndex: 2, by: 'lakshay_sachdeva', body: 'JPM is more insulated given their wholesale banking mix.' }, // 7
  { onPostIndex: 2, replyTo: 7, by: 'anirudh_phophalia', body: 'BAC still looks cheap on P/B though, feels overdone on the downside.' }, // 8
  { onPostIndex: 3, by: 'anirudh_phophalia', body: 'Guidance cut was brutal, but valuation is finally reasonable at 22x.' }, // 9
]

const commentReactions = [
  { onCommentIndex: 0, by: 'lakshay_sachdeva', kind: 'insightful' },
  { onCommentIndex: 2, by: 'anirudh_phophalia', kind: 'insightful' },
  { onCommentIndex: 2, by: 'ishan_jha', kind: 'insightful' },
  { onCommentIndex: 3, by: 'ishan_jha', kind: 'insightful' },
  { onCommentIndex: 4, by: 'ishan_jha', kind: 'flame' },
  { onCommentIndex: 7, by: 'anirudh_phophalia', kind: 'flame' },
]

const votes = [
  { onPostIndex: 0, by: 'anirudh_phophalia', value: 1 },
  { onPostIndex: 0, by: 'ishan_jha', value: 1 },
  { onPostIndex: 1, by: 'lakshay_sachdeva', value: 1 },
  { onPostIndex: 1, by: 'ishan_jha', value: 1 },
  { onPostIndex: 2, by: 'lakshay_sachdeva', value: 1 },
  { onPostIndex: 2, by: 'anirudh_phophalia', value: -1 },
  { onPostIndex: 3, by: 'anirudh_phophalia', value: -1 },
]

const news = [
  {
    source: 'Reuters',
    headline: 'Federal Reserve Indicates Pause on Rate Hikes Amid Cooling Inflation Data',
    body: 'Fed officials signaled today that they are prepared to halt further interest rate increases, citing inflation data that is steadily cooling toward target.',
    tags: 'MACRO,FED',
    fullArticle: `Federal Reserve officials signaled today that they are prepared to halt further interest rate increases, citing inflation data that has steadily cooled toward the central bank's 2% target over the past two quarters. The remarks, made during a policy panel, mark the clearest indication yet that the current tightening cycle is nearing its end.

"We've seen meaningful progress on disinflation without the kind of labor market deterioration some feared," one official said, pointing to a gradual easing in shelter and services costs that had been the stickiest components of the inflation basket.

Markets had already priced in a pause for the next meeting, but the tone of today's comments went further, hinting at the possibility of cuts later in the year if the current trend holds. Treasury yields fell across the curve following the remarks, and rate-sensitive sectors such as homebuilders and regional banks saw broad gains.

Economists remain split on the timing of any pivot to cuts. Some point to still-elevated core services inflation and a resilient labor market as reasons for the Fed to hold rates higher for longer, while others argue that the lagged effects of prior hikes are only now working their way through the economy and further tightening risks overcorrecting.

For investors, the message is one of reduced near-term rate risk but continued uncertainty on the path forward. Futures markets are now pricing in roughly two to three cuts by year-end, though officials have been careful not to commit to a specific timeline.`,
  },
  {
    source: 'Bloomberg',
    headline: 'TCS Reports Strong Q3 Numbers, Beats Street Estimates',
    body: 'Tata Consultancy Services posted a beat on both revenue and margins, with management citing resilient demand in BFSI despite a broader IT slowdown.',
    tags: 'TCS,IT',
    fullArticle: `Tata Consultancy Services posted a beat on both revenue and margins for the third quarter, with management citing resilient demand in the banking, financial services and insurance (BFSI) vertical despite a broader slowdown across the IT services industry.

Revenue grew sequentially, aided by a pickup in deal wins and a stabilizing discretionary spending environment among large North American clients. Operating margins expanded 50 basis points quarter-on-quarter, which the company attributed to better utilization rates and a favorable currency movement.

"Our BFSI vertical grew 6% quarter-on-quarter, which is the strongest performance we've seen from that segment in several quarters," a company spokesperson said on the post-earnings call. Management also highlighted a healthy order book of $8.1 billion, though analysts noted that book-to-bill growth had decelerated slightly year-on-year, a trend worth watching in coming quarters.

The company's total contract value for the quarter came in ahead of consensus, driven largely by renewals and expansions in existing accounts rather than new logo wins — consistent with an industry-wide pattern of clients consolidating vendors rather than initiating fresh discretionary projects.

Shares of the company rose in early trading following the results, with several brokerages raising their price targets citing margin resilience. Some analysts flagged that the stock's current valuation already reflects much of this optimism, and that sustained order book growth will be key to justifying further re-rating.`,
  },
  {
    source: 'WSJ',
    headline: 'NVIDIA Unveils Next-Gen AI Chips, Stock Surges',
    body: 'NVIDIA announced its next generation of AI accelerators at a developer conference, with early benchmarks showing a significant performance jump over the prior generation.',
    tags: 'NVDA,AI',
    fullArticle: `NVIDIA announced its next generation of AI accelerators at a developer conference today, with early benchmarks showing a significant performance jump over the prior generation for both training and inference workloads.

The new chips promise substantially higher memory bandwidth and improved energy efficiency per FLOP, addressing two of the biggest bottlenecks cited by hyperscale customers building out large language model infrastructure. Company executives said the architecture was designed from the ground up around the demands of trillion-parameter models rather than being an incremental refresh of the previous generation.

Several major cloud providers confirmed they had already placed orders for the new hardware, with shipments expected to begin in the coming quarters. Analysts noted that demand visibility extends well beyond the next several quarters, given the scale of data center buildouts currently underway across the industry.

"This isn't just a speed bump — it changes the economics of running frontier models," one industry analyst said, pointing to the lower total cost of ownership per training run as the more consequential story for enterprise adopters.

The stock surged in after-hours trading following the announcement, extending a rally that has made the company one of the largest by market capitalization globally. Some commentators cautioned that expectations are now priced for near-flawless execution, and that any delay in the ramp-up of the new architecture could weigh on sentiment given how much of the current valuation rests on sustained AI infrastructure spending.`,
  },
  {
    source: 'Reuters',
    headline: 'Bank Earnings Season Kicks Off With JPMorgan, Bank of America Results',
    body: 'Major US banks reported mixed results as net interest margins came under pressure from rising deposit costs, even as trading revenue held up.',
    tags: 'JPM,BAC,BANKS',
    fullArticle: `Major US banks kicked off earnings season with mixed results, as net interest margins came under pressure from rising deposit costs even as trading and investment banking revenue held up better than expected.

JPMorgan reported that net interest income came in slightly below guidance as the bank continued to pay up for deposits amid competition from money market funds offering higher yields. Management reiterated full-year NII guidance but flagged that further margin compression is likely if the current rate environment persists into next year.

Bank of America's results told a similar story on the margin side, though the bank's wholesale banking and markets divisions posted a solid quarter, helped by elevated client activity in fixed income trading. "Deposit betas are catching up faster than we had modeled," one bank's CFO acknowledged on the earnings call, echoing a theme that has become common across the sector this cycle.

Credit quality remained broadly stable across both banks, with charge-off rates ticking up modestly in consumer credit card portfolios but staying within management's expected range. Loan growth was muted, reflecting continued caution among both consumers and corporate borrowers in the current rate environment.

Analysts noted that the read-through for regional banks — which typically have less diversified revenue streams and rely more heavily on net interest income — could be more challenging, with several smaller lenders scheduled to report in the coming weeks.`,
  },
  {
    source: 'Bloomberg',
    headline: 'Infosys Guidance Disappoints Investors',
    body: 'Infosys trimmed its full-year revenue growth guidance, citing continued softness in discretionary tech spending among North American clients.',
    tags: 'INFY,IT',
    fullArticle: `Infosys trimmed its full-year revenue growth guidance today, citing continued softness in discretionary technology spending among North American clients, sending shares lower in a session that had otherwise been broadly positive for the sector.

The revised guidance range now sits below the lower end of what the company had previously communicated, with management pointing to project delays and reduced deal sizes in its top client segment as the primary drivers. "Clients are still prioritizing cost takeout programs over transformational, discretionary work," the company's CEO said on the earnings call.

Despite the guidance cut, the company reported a sequential improvement in operating margins, helped by cost discipline and a reduction in subcontractor expenses. Attrition also continued to trend down, which management framed as a sign of stabilizing talent costs heading into the next fiscal year.

The muted guidance follows a similar pattern seen elsewhere in the Indian IT services sector this earnings season, reinforcing the view among analysts that the current demand environment remains challenging, particularly for discretionary and transformation-linked spending, even as cost-focused and vendor-consolidation deals continue to provide a steadier, if smaller, revenue base.

Several brokerages cut their price targets following the results, though most maintained a neutral-to-positive stance on valuation grounds, noting that much of the near-term caution already appears reflected in the stock's recent underperformance relative to peers.`,
  },
]

const insertMany = db.transaction(() => {
  db.prepare('DELETE FROM votes').run()
  db.prepare('DELETE FROM comment_reactions').run()
  db.prepare('DELETE FROM comments').run()
  db.prepare('DELETE FROM posts').run()
  db.prepare('DELETE FROM watchlist_items').run()
  db.prepare('DELETE FROM news_items').run()
  db.prepare('DELETE FROM users').run()

  const insertUser = db.prepare(
    'INSERT INTO users (email, password_hash, display_name, handle, bio, badge, follower_count, following_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const userIdByHandle = {}
  for (const u of users) {
    const hash = bcrypt.hashSync(PASSWORD, 10)
    const { lastInsertRowid } = insertUser.run(u.email, hash, u.displayName, u.handle, u.bio, u.badge, u.followers, u.following)
    userIdByHandle[u.handle] = lastInsertRowid
  }

  const insertPost = db.prepare('INSERT INTO posts (user_id, title, body, tickers) VALUES (?, ?, ?, ?)')
  const postIds = posts.map((p) => insertPost.run(userIdByHandle[p.by], p.title, p.body, p.tickers).lastInsertRowid)

  const insertComment = db.prepare('INSERT INTO comments (post_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)')
  const commentIds = []
  comments.forEach((c, i) => {
    const parentId = c.replyTo != null ? commentIds[c.replyTo] : null
    commentIds[i] = insertComment.run(postIds[c.onPostIndex], userIdByHandle[c.by], parentId, c.body).lastInsertRowid
  })

  const insertCommentReaction = db.prepare('INSERT INTO comment_reactions (comment_id, user_id, kind) VALUES (?, ?, ?)')
  for (const r of commentReactions) insertCommentReaction.run(commentIds[r.onCommentIndex], userIdByHandle[r.by], r.kind)

  const insertVote = db.prepare('INSERT INTO votes (post_id, user_id, value) VALUES (?, ?, ?)')
  for (const v of votes) insertVote.run(postIds[v.onPostIndex], userIdByHandle[v.by], v.value)

  const insertNews = db.prepare('INSERT INTO news_items (source, headline, body, full_article, tags) VALUES (?, ?, ?, ?, ?)')
  for (const n of news) insertNews.run(n.source, n.headline, n.body, n.fullArticle, n.tags)

  const insertHolding = db.prepare(
    'INSERT INTO watchlist_items (user_id, ticker, buy_price, buy_date, quantity) VALUES (?, ?, ?, ?, ?)'
  )
  insertHolding.run(userIdByHandle.lakshay_sachdeva, 'NVDA', 120, '2025-01-15', 10)
  insertHolding.run(userIdByHandle.lakshay_sachdeva, 'JPM', 210, '2025-06-01', 15)
  insertHolding.run(userIdByHandle.lakshay_sachdeva, 'TCS', 3800, '2024-11-10', 20)
})

insertMany()
console.log(`Seeded ${users.length} users, ${posts.length} posts, ${news.length} news items.`)
console.log(`Log in as any of: ${users.map((u) => u.email).join(', ')} — password: ${PASSWORD}`)
