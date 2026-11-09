// Accuracy evaluation service using Gemini API and online data verification.

function extractJson(rawText) {
  let cleaned = rawText.trim()
  // Strip code block markers if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  } else {
    // Try to find JSON substring
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) cleaned = match[0]
  }
  return JSON.parse(cleaned)
}

async function callGeminiApi({ apiKey, prompt, model, useSearch }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  }

  if (useSearch) {
    body.tools = [{ googleSearch: {} }]
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    const errorMsg = data?.error?.message || `Gemini API returned status ${res.status}`
    const errorObj = new Error(errorMsg)
    errorObj.status = res.status
    errorObj.data = data
    throw errorObj
  }

  return data
}

export async function evaluateAccuracyWithGemini({ posts = [], comments = [], apiKey }) {
  if (!apiKey) {
    throw new Error('Gemini API key is required')
  }

  if (posts.length === 0 && comments.length === 0) {
    return {
      accuracy: null,
      hits: 0,
      misses: 0,
      neutral: 0,
      totalScored: 0,
      totalEvaluated: 0,
      evaluations: [],
      message: 'No discussion posts or comments available to evaluate.',
      evaluatedAt: new Date().toISOString(),
    }
  }

  const contentItems = [
    ...posts.map(
      (p, i) =>
        `[Post #${i + 1}] ID: post_${p.id}\nTitle: ${p.title}\nTickers: ${p.tickers || 'N/A'}\nCreated At: ${p.created_at || 'Recent'}\nPost Body: ${p.body}`
    ),
    ...comments.map(
      (c, i) =>
        `[Comment #${i + 1}] ID: comment_${c.id}\nUnder Discussion: "${c.post_title || 'Market Discussion'}" (Tickers: ${c.tickers || 'N/A'})\nCreated At: ${c.created_at || 'Recent'}\nComment Body: ${c.body}`
    ),
  ].join('\n\n---\n\n')

  const prompt = `You are a professional financial research accuracy evaluator for InvestCircle.
Your task is to analyze user posts and comments in stock discussions and evaluate their historical ACCURACY based on their sentiment, directional thesis, or factual claims verified against real-world online market data, stock performance, and financial reports.

Accuracy formula:
Accuracy % = (Hits / (Hits + Misses)) * 100
(Neutral or pure non-market discussion items are excluded from the hit/miss denominator).

Rules for evaluation:
1. "HIT":
   - Bullish sentiment (buy call, positive outlook, breakout expected, price target above market) on a ticker/stock, and real-world market data shows the stock rose, broke out, beat expectations, or met the thesis.
   - Bearish sentiment (sell call, negative outlook, warning of overvaluation, caution) on a ticker/stock, and real-world market data shows the stock dropped, underperformed, or the cited risk occurred.
   - A factual financial or macro statement that is verifiably true according to online financial reports.
2. "MISS":
   - Bullish sentiment on a stock that subsequently plunged, underperformed, or failed the thesis.
   - Bearish sentiment on a stock that strongly surged or beat expectations contrary to the warning.
   - A factual financial claim that is verifiably wrong or contradicted by market facts.
3. "NEUTRAL":
   - Pure questions (e.g., "What is your target?"), general chatting, or discussions with no verifiable stance or financial claim.

User's Discussion Content:
${contentItems}

You must evaluate each post/comment individually.
Respond ONLY with a valid JSON object matching this schema exactly (no markdown fences, no surrounding prose):
{
  "evaluations": [
    {
      "id": "post_1",
      "type": "post",
      "title": "Short title or topic summary",
      "ticker": "TICKER (e.g. TCS, NVDA, INFY, JPM, BAC, etc. or N/A)",
      "sentiment": "Bullish",
      "claim": "Summary of user stance or thesis",
      "online_truth": "What actually happened in the market / online data",
      "verdict": "HIT",
      "reason": "1-2 sentence explanation connecting the user sentiment to online market reality"
    }
  ]
}`

  let data = null
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash']

  let lastError = null
  for (const model of models) {
    // Attempt 1: with Google Search grounding
    try {
      data = await callGeminiApi({ apiKey, prompt, model, useSearch: true })
      if (data) break
    } catch (err) {
      lastError = err
      // If error might be tool-related (400 or tools unsupported), try without search
      if (err.status === 400 || (err.message && err.message.toLowerCase().includes('tool'))) {
        try {
          data = await callGeminiApi({ apiKey, prompt, model, useSearch: false })
          if (data) break
        } catch (innerErr) {
          lastError = innerErr
        }
      }
    }
  }

  if (!data) {
    throw new Error(lastError?.message || 'Failed to communicate with Gemini API')
  }

  const rawCandidateText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawCandidateText) {
    throw new Error('Gemini returned an empty response')
  }

  let parsed = null
  try {
    parsed = extractJson(rawCandidateText)
  } catch (err) {
    console.error('Failed to parse Gemini response JSON:', rawCandidateText)
    throw new Error('Could not parse accuracy analysis from AI')
  }

  const evaluations = Array.isArray(parsed?.evaluations) ? parsed.evaluations : []
  const hits = evaluations.filter((e) => (e.verdict || '').toUpperCase() === 'HIT').length
  const misses = evaluations.filter((e) => (e.verdict || '').toUpperCase() === 'MISS').length
  const neutral = evaluations.filter((e) => (e.verdict || '').toUpperCase() === 'NEUTRAL').length
  const totalScored = hits + misses
  const accuracy = totalScored > 0 ? Math.round((hits / totalScored) * 100) : null

  return {
    accuracy,
    hits,
    misses,
    neutral,
    totalScored,
    totalEvaluated: evaluations.length,
    formula: totalScored > 0 ? `${hits} / (${hits} + ${misses}) × 100 = ${accuracy}%` : 'N/A',
    evaluations,
    evaluatedAt: new Date().toISOString(),
  }
}

