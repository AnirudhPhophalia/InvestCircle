# Backend API tests

70 black-box HTTP tests for the Express API (auth, discussions, watchlist, profile, notifications,
live news, AI company matching, Gemini accuracy engine). They use Node's built-in test runner,
so **no new dependencies** are needed (Node 20+).

## Run
```bash
cd backend
# a dedicated, empty PostgreSQL database -- the suite re-seeds it!
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/investcircle_test
npm test
```
The suite refuses to run if the URL does not contain `test` (override: `ALLOW_NON_TEST_DB=1`).

## How it works
- `api.test.js` starts the real `app.js` on a random port, runs `seed.js`, then calls the API over HTTP.
- `helpers/mockFetch.js` replaces `fetch` for Finnhub, OpenRouter and Gemini, so no API keys or internet are needed.
  Failure modes (LLM down, search tool rejected, invalid key, garbage output) are switched on with `flags`.
- `helpers/client.js` is a small cookie-aware HTTP client (one instance = one logged-in browser).

## Add to `package.json`
```json
"scripts": {
  "test": "node --test --test-concurrency=1 tests/*.test.js"
}
```
