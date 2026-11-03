import { useEffect, useState } from 'react'
import { api } from '../../shared/lib/api.js'
import { timeAgo } from '../../shared/lib/time.js'

export default function LiveMarketNews() {
  const [items, setItems] = useState(null)

  useEffect(() => {
    api
      .get('/news/live')
      .then(setItems)
      .catch(() => setItems([]))
  }, [])

  if (items === null || items.length === 0) return null

  return (
    <aside className="w-full lg:w-[300px] shrink-0 bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-col gap-sm">
      <div className="flex items-center gap-xs">
        <span className="w-[6px] h-[6px] rounded-full bg-tertiary" />
        <h2 className="text-label-caps text-on-surface-variant">Live Market News</h2>
      </div>
      <div className="flex flex-col gap-sm">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block pb-sm border-b border-outline-variant last:border-0 last:pb-0 group"
          >
            <p className="text-body-sm text-on-surface group-hover:text-primary transition-colors leading-snug">
              {item.headline}
            </p>
            <p className="text-body-sm text-on-surface-variant mt-[2px]">
              {item.source} · {timeAgo(item.publishedAt)}
            </p>
          </a>
        ))}
      </div>
    </aside>
  )
}
