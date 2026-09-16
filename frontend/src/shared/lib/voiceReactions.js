// Demo voice reactions so news items don't look empty before anyone's actually recorded one.
const DEMO_REACTORS = ['Rahul', 'Sneha', 'Kunal', 'Priya', 'Amit']
const DEMO_COMMENTS = [
  { stance: 'bullish', comment: 'Numbers look solid, adding on dips.' },
  { stance: 'bearish', comment: 'Valuation feels stretched here.' },
  { stance: 'bullish', comment: 'Management commentary was upbeat.' },
]

export function demoReactionsFor(newsId, seedIndex) {
  const count = seedIndex % 3 === 0 ? 2 : 1
  return Array.from({ length: count }, (_, j) => {
    const name = DEMO_REACTORS[(seedIndex + j) % DEMO_REACTORS.length]
    return {
      id: `demo-${newsId}-${j}`,
      url: 'demo',
      initials: name[0],
      name,
      ...DEMO_COMMENTS[(seedIndex + j) % DEMO_COMMENTS.length],
    }
  })
}

// Deterministic demo "trust tier" per reactor — a registered veteran (gold), a good
// regular (silver), or a rookie (bronze). No real reputation system yet, so this is
// just a stable hash for the prototype's visual cue.
export function tierFor(name) {
  if (name === 'You') return 'gold'
  let h = 0
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 100
  if (h < 25) return 'gold'
  if (h < 70) return 'silver'
  return 'bronze'
}

export const TIER_GLOW = {
  gold: 'ring-1 ring-[#d4af37] shadow-[0_0_5px_1px_rgba(212,175,55,0.4)]',
  silver: 'ring-1 ring-[#b9c2cc] shadow-[0_0_5px_1px_rgba(148,163,184,0.35)]',
  bronze: 'ring-1 ring-[#cd7f32] shadow-[0_0_5px_1px_rgba(205,127,50,0.3)]',
}
