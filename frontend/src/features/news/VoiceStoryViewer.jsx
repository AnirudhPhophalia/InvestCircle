import { useState } from 'react'

// Deterministic small base count from an id string, so demo reactions look
// populated but stay stable across re-renders instead of jumping around.
function baseCount(id, salt) {
  let h = 0
  for (const ch of `${id}-${salt}`) h = (h * 31 + ch.charCodeAt(0)) % 97
  return 3 + (h % 24)
}

const REACTION_DEFS = [
  { key: 'like', icon: 'favorite', color: 'text-error', label: 'Like' },
  { key: 'bullish', icon: 'trending_up', color: 'text-secondary', label: 'Bullish' },
  { key: 'bearish', icon: 'trending_down', color: 'text-tertiary', label: 'Bearish' },
]

// A full-screen, Instagram-Stories-style viewer for a news card's voice reactions —
// swipe up, or use the up/down buttons, to move through the people who reacted.
export default function VoiceStoryViewer({ reactions, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [myReactions, setMyReactions] = useState({}) // reactionId -> Set of active keys

  const current = reactions[index]
  const isFirst = index === 0
  const isLast = index === reactions.length - 1

  function pointY(e) {
    return e.touches && e.touches.length ? e.touches[0].clientY : e.clientY
  }

  function onDown(e) {
    setStartY(pointY(e))
    setDragging(true)
  }

  function onMove(e) {
    if (!dragging) return
    setDragY(pointY(e) - startY)
  }

  function onUp() {
    if (dragY < -80) next()
    else if (dragY > 80) prev()
    setDragging(false)
    setDragY(0)
  }

  function next() {
    if (isLast) {
      onClose()
      return
    }
    setIndex((i) => i + 1)
  }

  function prev() {
    setIndex((i) => Math.max(i - 1, 0))
  }

  function toggleReaction(key) {
    setMyReactions((prev) => {
      const active = new Set(prev[current.id] || [])
      if (active.has(key)) active.delete(key)
      else active.add(key)
      return { ...prev, [current.id]: active }
    })
  }

  const active = myReactions[current.id] || new Set()

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center select-none" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={() => dragging && onUp()}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
        style={{ transform: `translateY(${dragY}px)`, transition: dragging ? 'none' : 'transform 200ms ease' }}
        className="relative w-full max-w-sm h-full max-h-[820px] bg-surface rounded-none sm:rounded-lg sm:border sm:border-outline-variant overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="absolute top-sm left-sm right-sm flex gap-xs z-20">
          {reactions.map((r, i) => (
            <div key={r.id} className="flex-1 h-[3px] rounded-full bg-outline-variant overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: i <= index ? '100%' : '0%' }} />
            </div>
          ))}
        </div>

        <div className="absolute top-md left-md right-md flex items-center gap-sm z-20">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[11px] font-bold">
            {current.initials}
          </div>
          <div className="text-on-surface text-body-sm font-medium">{current.initials === 'YOU' ? 'You' : current.initials}</div>
          <button onClick={onClose} className="ml-auto text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tap left/right half to go back/forward, like a real story viewer. */}
        <button onClick={prev} className="absolute left-0 top-16 bottom-24 w-1/2 z-10" aria-label="Previous reaction" />
        <button onClick={next} className="absolute right-0 top-16 bottom-24 w-1/2 z-10" aria-label="Next reaction" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-lg px-lg pointer-events-none">
          {current.url !== 'demo' ? (
            <video src={current.url} autoPlay className="max-h-[70%] rounded-lg" />
          ) : (
            <>
              <div className="w-28 h-28 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-headline-lg font-bold">
                {current.initials}
              </div>
              <div className="flex items-end gap-[3px] h-8">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-[3px] bg-on-surface-variant rounded-full animate-bob"
                    style={{ height: `${8 + ((i * 37) % 22)}px`, animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            </>
          )}

          {current.stance && (
            <span
              className={`pointer-events-auto flex items-center gap-[2px] text-label-caps px-sm py-xs rounded-full border ${
                current.stance === 'bullish'
                  ? 'text-secondary border-secondary bg-secondary/10'
                  : 'text-tertiary border-tertiary bg-tertiary/10'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {current.stance === 'bullish' ? 'trending_up' : 'trending_down'}
              </span>
              {current.stance}
            </span>
          )}

          {current.comment && (
            <p className="pointer-events-auto text-on-surface text-body-sm text-center max-w-[240px] bg-surface-container px-md py-sm rounded-lg border border-outline-variant">
              &ldquo;{current.comment}&rdquo;
            </p>
          )}
        </div>

        {/* Explicit, always-clickable nav — the tap zones above cover the same area but this is the reliable fallback. */}
        <div className="absolute left-1/2 -translate-x-1/2 top-16 z-20 flex flex-col items-center gap-xs">
          <button
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            disabled={isFirst}
            className="w-8 h-8 rounded-full bg-surface-container-lowest/90 border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"
            aria-label="Previous reaction"
          >
            <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
          </button>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-md z-20 flex flex-col items-center gap-xs">
          <button
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            className="w-8 h-8 rounded-full bg-surface-container-lowest/90 border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Next reaction"
          >
            <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
          </button>
          <span className="text-on-surface-variant text-[10px] uppercase tracking-wide">{isLast ? 'Close' : 'Swipe up'}</span>
        </div>

        <div className="absolute right-md bottom-md flex flex-col gap-md z-20 items-center">
          {REACTION_DEFS.map((def) => {
            const isActive = active.has(def.key)
            return (
              <button
                key={def.key}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleReaction(def.key)
                }}
                className="flex flex-col items-center gap-[2px]"
              >
                <span
                  className={`material-symbols-outlined text-[26px] ${isActive ? def.color : 'text-on-surface'}`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {def.icon}
                </span>
                <span className="text-on-surface text-[11px] font-bold">{baseCount(current.id, def.key) + (isActive ? 1 : 0)}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
