import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import PostCard from '../components/PostCard.jsx'

const TABS = [
  { key: 'hot', label: 'HOT' },
  { key: 'new', label: 'NEW' },
  { key: 'top', label: 'TOP' },
]

export default function Discussions() {
  const [params, setParams] = useSearchParams()
  const sort = params.get('sort') || 'hot'
  const q = params.get('q') || ''
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setPosts(null)
    setError('')
    const query = new URLSearchParams({ sort, ...(q ? { q } : {}) })
    api
      .get(`/posts?${query}`)
      .then(setPosts)
      .catch((e) => setError(e.message))
  }, [sort, q])

  function setSort(next) {
    const p = new URLSearchParams(params)
    p.set('sort', next)
    setParams(p)
  }

  function handleVoteChange(postId, result) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, score: result.score, my_vote: result.my_vote } : p)))
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-md">
      <div className="bg-surface-container-lowest border border-outline-variant p-sm flex items-center gap-md mb-xs">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSort(t.key)}
            className={`text-label-caps px-md py-xs border-b-2 transition-colors ${
              sort === t.key ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:border-outline-variant'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <Link
          to="/discussions/new"
          className="bg-primary text-on-primary text-label-caps px-md py-xs rounded hover:bg-opacity-90 transition-all"
        >
          NEW POST
        </Link>
      </div>

      {q && (
        <p className="text-body-sm text-on-surface-variant">
          Showing results for &ldquo;<span className="text-on-surface">{q}</span>&rdquo;
        </p>
      )}

      {error && <p className="text-body-md text-error">{error}</p>}
      {posts === null && !error && <p className="text-body-md text-on-surface-variant">Loading discussions…</p>}
      {posts?.length === 0 && <p className="text-body-md text-on-surface-variant">No discussions yet. Be the first to post.</p>}

      <div className="flex flex-col gap-sm">
        {posts?.map((post) => (
          <PostCard key={post.id} post={post} onVoteChange={handleVoteChange} />
        ))}
      </div>
    </div>
  )
}
