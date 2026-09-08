import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { timeAgo } from '../lib/time.js'
import { findKnownTicker } from '../lib/fundamentals.js'
import { useActiveTicker } from '../context/TickerContext.jsx'
import CameraRecorder from '../components/CameraRecorder.jsx'
import CompanyFundamentals from '../components/CompanyFundamentals.jsx'
import VoiceStoryViewer from '../components/VoiceStoryViewer.jsx'

// Demo voice reactions so the feed doesn't look empty before anyone's actually recorded one.
const DEMO_REACTORS = ['Rahul', 'Sneha', 'Kunal', 'Priya', 'Amit']
const DEMO_COMMENTS = [
  { stance: 'bullish', comment: 'Numbers look solid, adding on dips.' },
  { stance: 'bearish', comment: 'Valuation feels stretched here.' },
  { stance: 'bullish', comment: 'Management commentary was upbeat.' },
]

function demoReactionsFor(newsId, seedIndex) {
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
function tierFor(name) {
  if (name === 'You') return 'gold'
  let h = 0
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 100
  if (h < 25) return 'gold'
  if (h < 70) return 'silver'
  return 'bronze'
}

const TIER_GLOW = {
  gold: 'ring-1 ring-[#d4af37] shadow-[0_0_5px_1px_rgba(212,175,55,0.4)]',
  silver: 'ring-1 ring-[#b9c2cc] shadow-[0_0_5px_1px_rgba(148,163,184,0.35)]',
  bronze: 'ring-1 ring-[#cd7f32] shadow-[0_0_5px_1px_rgba(205,127,50,0.3)]',
}

export default function NewsReel() {
  const navigate = useNavigate()
  const { setActiveTicker } = useActiveTicker()
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [news, setNews] = useState(null)
  const [error, setError] = useState('')
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [recording, setRecording] = useState(false)
  const [reactions, setReactions] = useState({}) // newsId -> [{ id, url }]
  const [storyIndex, setStoryIndex] = useState(null)

  useEffect(() => {
    setNews(null)
    setError('')
    setIndex(0)
    const query = q ? `?q=${encodeURIComponent(q)}` : ''
    api
      .get(`/news${query}`)
      .then((items) => {
        setNews(items)
        setReactions((prev) => {
          const seeded = { ...prev }
          items.forEach((item, i) => {
            if (!seeded[item.id]) seeded[item.id] = demoReactionsFor(item.id, i)
          })
          return seeded
        })
      })
      .catch((e) => setError(e.message))
  }, [q])

  // Keep the fundamentals panel following whichever card is currently showing.
  useEffect(() => {
    if (!news || news.length === 0) return
    const current = news[Math.min(index, news.length - 1)]
    setActiveTicker(findKnownTicker(current.tags))
  }, [news, index, setActiveTicker])

  if (error) return <p className="text-body-md text-error">{error}</p>
  if (news === null) return <p className="text-body-md text-on-surface-variant">Loading news…</p>
  if (news.length === 0) return <p className="text-body-md text-on-surface-variant">No news items found.</p>

  const clampedIndex = Math.min(index, news.length - 1)
  const item = news[clampedIndex]
  const tags = item.tags ? item.tags.split(',').filter(Boolean) : []
  const itemReactions = reactions[item.id] || []

  function pointX(e) {
    return e.touches && e.touches.length ? e.touches[0].clientX : e.clientX
  }

  function onDown(e) {
    setStartX(pointX(e))
    setDragging(true)
  }

  function onMove(e) {
    if (!dragging) return
    setDragX(pointX(e) - startX)
  }

  function commitSwipe(dir) {
    setDragging(false)
    setDragX(dir === 'like' ? 700 : -700)
    setTimeout(() => {
      setIndex((i) => Math.min(i + 1, news.length - 1))
      setDragX(0)
    }, 180)
  }

  function onUp() {
    if (dragX > 100) commitSwipe('like')
    else if (dragX < -100) commitSwipe('pass')
    else {
      setDragging(false)
      setDragX(0)
    }
  }

  function goPrev() {
    setIndex((i) => Math.max(i - 1, 0))
    setDragX(0)
  }

  function goNext() {
    setIndex((i) => Math.min(i + 1, news.length - 1))
    setDragX(0)
  }

  function goTo(i) {
    setIndex(i)
    setDragX(0)
  }

  function handleRecordedClip(url, { stance, comment } = {}) {
    setReactions((prev) => ({
      ...prev,
      [item.id]: [
        { id: Date.now(), url, initials: 'YOU', name: 'You', stance: stance || null, comment: comment || '' },
        ...(prev[item.id] || []),
      ],
    }))
    setRecording(false)
    commitSwipe('like')
  }

  const rotate = dragX / 18
  const likeOpacity = Math.min(Math.max(dragX / 100, 0), 1)
  const passOpacity = Math.min(Math.max(-dragX / 100, 0), 1)

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-md items-center">
      {q && (
        <p className="text-body-sm text-on-surface-variant self-start">
          Showing results for &ldquo;<span className="text-on-surface">{q}</span>&rdquo;
        </p>
      )}

      <div className="w-full flex items-center justify-between px-xs">
        <h2 className="text-headline-lg text-on-surface">Live Feed</h2>
        <div className="flex items-center gap-xs flex-wrap justify-end">
          {news.map((n, i) => (
            <button
              key={n.id}
              onClick={() => goTo(i)}
              aria-label={`Go to card ${i + 1}`}
              aria-current={i === clampedIndex}
              className={`w-6 h-6 rounded text-data-mono text-[11px] flex items-center justify-center border transition-colors ${
                i === clampedIndex
                  ? 'bg-primary text-on-primary border-primary'
                  : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full">
        <article
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={() => dragging && onUp()}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
          style={{ transform: `translateX(${dragX}px) rotate(${rotate}deg)`, transition: dragging ? 'none' : 'transform 200ms ease' }}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg flex flex-col gap-md cursor-grab active:cursor-grabbing select-none relative"
        >
          <div
            className="absolute top-md left-md text-headline-md font-extrabold uppercase tracking-wide text-secondary border-2 border-secondary rounded px-sm -rotate-12 pointer-events-none"
            style={{ opacity: likeOpacity }}
          >
            Bullish
          </div>
          <div
            className="absolute top-md right-md text-headline-md font-extrabold uppercase tracking-wide text-tertiary border-2 border-tertiary rounded px-sm rotate-12 pointer-events-none"
            style={{ opacity: passOpacity }}
          >
            Pass
          </div>

          <div className="flex justify-between items-start gap-md">
            <div className="flex gap-xs flex-wrap">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-label-caps text-on-surface-variant uppercase tracking-wider bg-surface-container px-2 py-1 border border-outline-variant rounded"
                >
                  {t}
                </span>
              ))}
            </div>
            <span className="text-label-caps text-on-surface-variant shrink-0">{timeAgo(item.published_at)}</span>
          </div>

          <h3 className="text-headline-md text-on-surface cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/news/${item.id}`)}>
            {item.headline}
          </h3>
          <p className="text-body-md text-on-surface-variant line-clamp-4">{item.body}</p>

          <div className="flex items-center justify-between pt-sm border-t border-outline-variant">
            <span className="text-label-caps text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-sm">apartment</span> {item.source}
            </span>
            <button onClick={() => navigate(`/news/${item.id}`)} className="text-label-caps text-primary hover:text-primary-container transition-colors">
              READ MORE
            </button>
          </div>

          {itemReactions.length > 0 && (
            <div className="flex flex-col items-center gap-sm pt-sm border-t border-outline-variant text-center">
              <span className="text-body-sm text-on-surface-variant">{itemReactions.length} gave their voice</span>
              <div className="flex flex-wrap items-center justify-center gap-sm">
                {itemReactions.map((r, i) => {
                  const displayName = r.initials === 'YOU' ? 'You' : r.name || r.initials
                  return (
                    <button key={r.id} onClick={() => setStoryIndex(0)} className="flex items-center gap-xs">
                      <span
                        style={{ animationDelay: `${i * 150}ms` }}
                        className={`relative w-8 h-8 rounded-full bg-primary-container flex items-center justify-center animate-bob ${TIER_GLOW[tierFor(displayName)]}`}
                      >
                        <span className="text-on-primary-container text-[11px] font-bold">{r.initials}</span>
                        <span className="absolute -bottom-[2px] -right-[2px] w-3.5 h-3.5 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface text-[9px]">play_arrow</span>
                        </span>
                      </span>
                      <span className="text-label-caps text-on-surface-variant">{displayName}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </article>

        <div className="flex items-center justify-center gap-sm mt-sm">
          <button
            onClick={goPrev}
            disabled={clampedIndex === 0}
            className="w-9 h-9 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-40 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
          </button>
          <button
            onClick={() => commitSwipe('pass')}
            className="w-11 h-11 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-tertiary hover:bg-tertiary/10 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <button
            onClick={() => setRecording(true)}
            className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow hover:bg-primary-container transition-colors"
            aria-label="Give your voice"
          >
            <span className="material-symbols-outlined">mic</span>
          </button>
          <button
            onClick={() => commitSwipe('like')}
            className="w-11 h-11 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-secondary hover:bg-secondary/10 transition-colors"
          >
            <span className="material-symbols-outlined">favorite</span>
          </button>
          <button
            onClick={goNext}
            disabled={clampedIndex === news.length - 1}
            className="w-9 h-9 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-40 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
          </button>
        </div>
      </div>

      <CompanyFundamentals />

      {recording && <CameraRecorder onClose={() => setRecording(false)} onPost={handleRecordedClip} />}

      {storyIndex !== null && (
        <VoiceStoryViewer reactions={itemReactions} startIndex={storyIndex} headline={item.headline} onClose={() => setStoryIndex(null)} />
      )}
    </div>
  )
}
