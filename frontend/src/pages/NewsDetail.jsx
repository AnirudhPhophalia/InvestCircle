import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { timeAgo } from '../lib/time.js'
import { findKnownTicker } from '../lib/fundamentals.js'
import { useActiveTicker } from '../context/TickerContext.jsx'
import CompanyFundamentals from '../components/CompanyFundamentals.jsx'

// Static, per PHASES.md Phase 3: "static avatar + name + follower count list is enough".
const REACTIONS = [
  { name: 'Sarah Jenkins', followers: '45.2K followers', verified: true },
  { name: 'Marcus Vance', followers: '12.4K followers', verified: true },
  { name: 'Elena Rostova', followers: '8.9K followers', verified: false },
]

export default function NewsDetail() {
  const { id } = useParams()
  const { setActiveTicker } = useActiveTicker()
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/news/${id}`)
      .then(setItem)
      .catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    if (item) setActiveTicker(findKnownTicker(item.tags))
  }, [item, setActiveTicker])

  if (error) return <p className="text-body-md text-error">{error}</p>
  if (!item) return <p className="text-body-md text-on-surface-variant">Loading…</p>

  const tags = item.tags ? item.tags.split(',').filter(Boolean) : []

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-xl">
      <Link to="/news" className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors w-fit">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        <span className="text-body-sm">Back</span>
      </Link>
      <article>
        <div className="flex items-center gap-sm mb-md">
          <span className="text-label-caps text-on-surface-variant px-sm py-[2px] bg-surface-container-high rounded border border-outline-variant">
            {item.source.toUpperCase()}
          </span>
          <span className="text-body-sm text-outline">{timeAgo(item.published_at)}</span>
        </div>
        <h1 className="text-display text-on-surface mb-md">{item.headline}</h1>
        <div className="flex flex-wrap gap-xs mb-lg">
          {tags.map((t) => (
            <span key={t} className="text-label-caps text-on-surface-variant bg-surface-container px-sm py-[2px] rounded border border-outline-variant">
              {t}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-md">
          {(item.full_article || item.body)
            .split('\n\n')
            .filter(Boolean)
            .map((para, i) => (
              <p key={i} className="text-body-md text-on-surface-variant leading-relaxed">
                {para}
              </p>
            ))}
        </div>
      </article>
      <section className="border-t border-outline-variant pt-lg">
        <h2 className="text-headline-md text-on-surface mb-md">What people are saying</h2>
        <div className="flex flex-col border border-outline-variant rounded-lg bg-surface-container-lowest overflow-hidden">
          {REACTIONS.map((r, i) => (
            <div key={r.name}>
              <div className="flex items-center gap-md p-md hover:bg-surface-container-low transition-colors">
                <div className="w-10 h-10 rounded bg-primary-container text-on-primary-container flex items-center justify-center text-label-caps shrink-0">
                  {r.name.split(' ').map((s) => s[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-xs">
                    <span className="text-body-md font-medium text-on-surface truncate">{r.name}</span>
                    {r.verified && <span className="material-symbols-outlined text-primary text-[14px]">verified</span>}
                  </div>
                  <span className="text-body-sm text-on-surface-variant">{r.followers}</span>
                </div>
              </div>
              {i < REACTIONS.length - 1 && <div className="h-px bg-outline-variant mx-md" />}
            </div>
          ))}
        </div>
      </section>

      <CompanyFundamentals />
    </div>
  )
}
