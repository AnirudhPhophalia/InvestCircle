import { useState } from 'react'
import { api } from '../lib/api.js'

export default function VoteButtons({ post, onChange }) {
  const [busy, setBusy] = useState(false)

  async function vote(value) {
    if (busy) return
    setBusy(true)
    const nextValue = post.my_vote === value ? 0 : value
    try {
      const result = await api.post(`/posts/${post.id}/vote`, { value: nextValue })
      onChange(result)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-12 bg-surface-container-low flex flex-col items-center py-sm border-r border-outline-variant shrink-0">
      <button
        aria-label="Upvote"
        className={`hover:text-primary transition-colors ${post.my_vote === 1 ? 'text-primary' : 'text-outline'}`}
        onClick={() => vote(1)}
      >
        <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
      </button>
      <span className="text-data-mono text-on-surface my-xs">{post.score}</span>
      <button
        aria-label="Downvote"
        className={`hover:text-tertiary transition-colors ${post.my_vote === -1 ? 'text-tertiary' : 'text-outline'}`}
        onClick={() => vote(-1)}
      >
        <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
      </button>
    </div>
  )
}
