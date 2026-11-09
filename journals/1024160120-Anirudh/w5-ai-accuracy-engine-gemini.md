# Week 5 : AI Accuracy Engine & Gemini Market Grounding

Built Phase 5 of the project: the AI-inferred hit-rate accuracy engine. The profile page had a placeholder (`—`) for accuracy % since Phase 1; this week I implemented the end-to-end system that calculates a user's real accuracy score based on what they've posted in discussions.

Implemented the evaluation engine in `backend/accuracy.js`:
- Utilizes the Google Gemini REST API (`gemini-2.5-flash` with fallback to `gemini-1.5-flash`), leveraging Google Search tool grounding to verify user claims against real-world stock market performance and financial reports.
- Structured the prompt to extract each post/comment's stance (Bullish, Bearish, or Neutral) and check what actually happened with the asset online.
- Designed the verdict classification:
  - **HIT**: Bullish sentiment on a stock that surged or beat expectations, Bearish sentiment on a stock that corrected or faced the cited headwinds, or verified factual claims.
  - **MISS**: Sentiment contradicted by market performance.
  - **NEUTRAL**: Pure inquiries or non-directional chatter (excluded from the denominator).
- Computed accuracy using the hit-rate formula:
  $$\text{Accuracy \%} = \frac{\text{Hits}}{\text{Hits} + \text{Misses}} \times 100$$

On the database side, updated `schema.sql` to add `accuracy INTEGER` and `accuracy_details JSONB` to the `users` table so results persist across logins.

On the frontend (`Profile.jsx`):
- Replaced the blank accuracy stat with an interactive "Get Accuracy" button and loading indicator.
- Built a breakdown modal that details the exact formula, hit/miss tallies, and an itemized audit of every evaluated post with the AI's market reasoning.
- Added a Gemini API key configuration dialog with local storage persistence and fallback handling.

Next: implement the live notification system and finalize deployment cross-origin configurations.
