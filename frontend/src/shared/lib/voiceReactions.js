// Demo voice reactions so news items don't look empty before anyone's actually recorded one.
// Seeded community members (backend/seed.js), so each name links to a real profile.
const DEMO_REACTORS = [
  { name: 'Ishan Jha', handle: 'ishan_jha' },
  { name: 'Anirudh Phophalia', handle: 'anirudh_phophalia' },
  { name: 'Aarav Kumar Arora', handle: 'aarav_arora' },
  { name: 'Lakshay Sachdeva', handle: 'lakshay_sachdeva' },
]
const DEMO_COMMENTS = [
  { stance: 'bullish', comment: 'Numbers look solid, adding on dips.' },
  { stance: 'bearish', comment: 'Valuation feels stretched here.' },
  { stance: 'bullish', comment: 'Management commentary was upbeat.' },
  { stance: 'bearish', comment: 'Guidance cut is the real story — staying out.' },
]

export const initialsOf = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export function demoReactionsFor(newsId, seedIndex) {
  const count = 2 + (seedIndex % 3)
  return Array.from({ length: count }, (_, j) => {
    const { name, handle } = DEMO_REACTORS[(seedIndex + j) % DEMO_REACTORS.length]
    return {
      id: `demo-${newsId}-${j}`,
      url: 'demo',
      initials: initialsOf(name),
      name,
      handle,
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

// Your own recordings have no handle — they link to your own profile.
export const profileLink = (r) => (r.handle ? `/users/${r.handle}` : '/profile')
