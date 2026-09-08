import { tierFor, TIER_GLOW } from '../lib/voiceReactions.js'

// The "N gave their voice" avatar/name row — shared between the live feed and a
// single news article's detail page. Clicking any reactor opens the story viewer
// from the beginning.
export default function VoiceReactorList({ reactions, onSelect }) {
  if (reactions.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-sm text-center">
      <span className="text-body-sm text-on-surface-variant">{reactions.length} gave their voice</span>
      <div className="flex flex-wrap items-center justify-center gap-sm">
        {reactions.map((r, i) => {
          const displayName = r.initials === 'YOU' ? 'You' : r.name || r.initials
          return (
            <button key={r.id} onClick={() => onSelect(0)} className="flex items-center gap-xs">
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
  )
}
