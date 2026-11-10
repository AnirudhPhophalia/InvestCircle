import { Link } from 'react-router-dom'
import { profileLink, tierFor, TIER_GLOW } from '../../shared/lib/voiceReactions.js'

// Theme colors are CSS variables (no Tailwind `/25` opacity support), so tint with color-mix.
const cover = (stance) => {
  const tint = { bullish: '--color-secondary', bearish: '--color-tertiary' }[stance] || '--color-primary'
  return `linear-gradient(to bottom, color-mix(in srgb, var(${tint}) 28%, transparent), var(--color-surface-container-lowest) 80%)`
}

// The "N gave their voice" row: tall poster cards that slide in left-to-right,
// lift on hover, and show a peek of what each person said on the cover.
// Shared by the live feed and a single article's detail page.
export default function VoiceReactorList({ reactions, onSelect }) {
  if (reactions.length === 0) return null

  return (
    <div className="flex flex-col gap-sm">
      <span className="text-body-sm text-on-surface-variant">{reactions.length} gave their voice</span>
      <div className="flex gap-sm overflow-x-auto snap-x p-sm -mx-sm">
        {reactions.map((r, i) => {
          const displayName = r.initials === 'YOU' ? 'You' : r.name || r.initials
          return (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              aria-label={`Play ${displayName}'s voice reaction`}
              onClick={() => onSelect(i)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(i))}
              style={{ animationDelay: `${i * 120}ms`, backgroundImage: cover(r.stance) }}
              className={`group relative shrink-0 snap-start w-32 h-48 rounded-lg overflow-hidden cursor-pointer border border-outline-variant animate-slide-in-left transition-transform duration-300 ease-out hover:scale-[1.08] hover:z-10 hover:shadow-xl focus-visible:scale-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
            >
              <div className="absolute inset-0 p-sm pb-9 flex flex-col">
                <span
                  className={`w-8 h-8 rounded-full bg-primary-container text-on-primary-container text-[11px] font-bold flex items-center justify-center ${TIER_GLOW[tierFor(displayName)]}`}
                >
                  {r.initials}
                </span>
                <p className="mt-sm text-body-sm text-on-surface italic leading-snug line-clamp-4">
                  &ldquo;{r.comment || 'Voice note'}&rdquo;
                </p>
                {r.stance && (
                  <span className={`mt-auto text-[10px] font-bold uppercase tracking-wider ${r.stance === 'bullish' ? 'text-secondary' : 'text-tertiary'}`}>
                    {r.stance}
                  </span>
                )}
              </div>
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white text-[40px]">play_circle</span>
              </span>
              <div className="absolute bottom-0 inset-x-0 px-sm py-xs bg-surface-container-lowest/90 border-t border-outline-variant">
                <Link
                  to={profileLink(r)}
                  onClick={(e) => e.stopPropagation()}
                  className="relative block truncate text-label-caps text-on-surface hover:text-primary hover:underline"
                >
                  {displayName}
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
