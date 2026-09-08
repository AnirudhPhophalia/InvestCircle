import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { timeAgo } from '../lib/time.js'
import { findKnownTicker } from '../lib/fundamentals.js'
import { useActiveTicker } from '../context/TickerContext.jsx'
import VoteButtons from '../components/VoteButtons.jsx'
import Avatar from '../components/Avatar.jsx'
import CompanyFundamentals from '../components/CompanyFundamentals.jsx'

function groupComments(flat) {
  const byId = new Map(flat.map((c) => [c.id, { ...c, replies: [] }]))
  const top = []
  for (const c of byId.values()) {
    if (c.parent_id && byId.has(c.parent_id)) byId.get(c.parent_id).replies.push(c)
    else top.push(c)
  }
  return top
}

function ReactionChip({ active, count, label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-xs px-sm py-xs rounded text-body-sm transition-colors ${
        active ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
      }`}
    >
      <span className="material-symbols-outlined text-[15px]">{icon}</span>
      {count}
      <span className="sr-only">{label}</span>
    </button>
  )
}

export default function PostDetail() {
  const { id } = useParams()
  const { setActiveTicker } = useActiveTicker()
  const [post, setPost] = useState(null)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sort, setSort] = useState('top')
  const [replyOpenId, setReplyOpenId] = useState(null)
  const [replyDraft, setReplyDraft] = useState('')

  function load() {
    return api.get(`/posts/${id}`).then(setPost).catch((e) => setError(e.message))
  }

  useEffect(() => {
    load()
  }, [id])

  useEffect(() => {
    if (post) setActiveTicker(findKnownTicker(post.tickers))
  }, [post, setActiveTicker])

  async function handleComment(e) {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/posts/${id}/comments`, { body: comment })
      setComment('')
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  async function submitReply(parentId) {
    if (!replyDraft.trim()) return
    await api.post(`/posts/${id}/comments`, { body: replyDraft, parentId })
    setReplyDraft('')
    setReplyOpenId(null)
    await load()
  }

  async function react(commentId, kind) {
    const result = await api.post(`/posts/${id}/comments/${commentId}/react`, { kind })
    setPost((p) => ({
      ...p,
      comments: p.comments.map((c) =>
        c.id === commentId
          ? { ...c, insightful_count: result.insightful_count, flame_count: result.flame_count, my_reaction: result.my_reaction }
          : c
      ),
    }))
  }

  if (error) return <p className="text-body-md text-error">{error}</p>
  if (!post) return <p className="text-body-md text-on-surface-variant">Loading…</p>

  const tickers = post.tickers ? post.tickers.split(',').filter(Boolean) : []
  const topLevel = groupComments(post.comments)
  const sorted = [...topLevel].sort((a, b) =>
    sort === 'top' ? b.insightful_count + b.flame_count - (a.insightful_count + a.flame_count) : new Date(b.created_at) - new Date(a.created_at)
  )
  const replyCount = post.comments.filter((c) => c.parent_id).length

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-md">
      <article className="bg-surface-container-lowest border border-outline-variant flex">
        <VoteButtons post={post} onChange={(r) => setPost((p) => ({ ...p, score: r.score, my_vote: r.my_vote }))} />
        <div className="p-lg flex-1 flex flex-col gap-sm">
          <div className="flex items-center gap-xs text-body-sm text-outline flex-wrap">
            <span className="font-bold text-on-surface">u/{post.handle}</span>
            {post.badge && (
              <span className="px-xs py-[2px] bg-secondary/10 text-secondary border border-secondary/20 rounded text-[10px] uppercase tracking-wider">
                {post.badge}
              </span>
            )}
            <span>•</span>
            <span>{timeAgo(post.created_at)}</span>
          </div>
          <div className="flex items-start justify-between gap-md">
            <h1 className="text-headline-lg text-on-surface">{post.title}</h1>
            {tickers.length > 0 && (
              <div className="flex gap-xs shrink-0">
                {tickers.map((t) => (
                  <span key={t} className="text-data-mono px-sm py-xs bg-surface-variant border border-outline-variant text-on-surface">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="text-body-md text-on-surface-variant whitespace-pre-wrap">{post.body}</p>
        </div>
      </article>

      <div className="flex items-center justify-between gap-md flex-wrap">
        <div>
          <h2 className="text-headline-md text-on-surface">Discussion</h2>
          <p className="text-body-sm text-on-surface-variant">
            {topLevel.length} comments · {replyCount} threaded {replyCount === 1 ? 'reply' : 'replies'}
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-xs flex items-center gap-xs">
          {['top', 'new'].map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`text-label-caps px-md py-xs border-b-2 transition-colors uppercase ${
                sort === s ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:border-outline-variant'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleComment} className="flex flex-col gap-sm">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-sm py-sm border border-outline-variant rounded bg-surface-container-lowest text-body-md text-on-surface focus:border-primary outline-none resize-y"
          placeholder="Add to the discussion..."
        />
        <button
          type="submit"
          disabled={submitting}
          className="self-end bg-primary text-on-primary text-label-caps px-md py-xs rounded hover:bg-opacity-90 transition-all disabled:opacity-60"
        >
          {submitting ? 'Posting…' : 'COMMENT'}
        </button>
      </form>

      <div className="flex flex-col">
        {sorted.map((c) => (
          <div key={c.id} className="py-md border-b border-outline-variant last:border-b-0">
            <div className="flex gap-sm">
              <Avatar user={c} className="w-8 h-8" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-xs flex-wrap">
                  <span className="font-bold text-on-surface text-body-sm">{c.display_name}</span>
                  {c.user_id === post.user_id && (
                    <span className="text-[9.5px] font-bold px-sm py-[1px] bg-primary/10 text-primary rounded uppercase tracking-wide">OP</span>
                  )}
                  <span className="text-body-sm text-outline">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-body-md text-on-surface mt-xs mb-sm">{c.body}</p>
                <div className="flex items-center gap-xs">
                  <ReactionChip
                    icon="lightbulb"
                    label="Insightful"
                    count={c.insightful_count}
                    active={c.my_reaction === 'insightful'}
                    onClick={() => react(c.id, 'insightful')}
                  />
                  <ReactionChip
                    icon="local_fire_department"
                    label="Hot take"
                    count={c.flame_count}
                    active={c.my_reaction === 'flame'}
                    onClick={() => react(c.id, 'flame')}
                  />
                  <button
                    aria-label="Reply to comment"
                    onClick={() => {
                      setReplyOpenId(replyOpenId === c.id ? null : c.id)
                      setReplyDraft('')
                    }}
                    className="flex items-center gap-xs px-sm py-xs text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">reply</span>
                    Reply
                  </button>
                </div>

                {(replyOpenId === c.id || c.replies.length > 0) && (
                  <div className="ml-md pl-md border-l-2 border-outline-variant mt-sm flex flex-col gap-sm">
                    {replyOpenId === c.id && (
                      <div className="flex flex-col gap-xs">
                        <textarea
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          rows={2}
                          className="w-full px-sm py-xs border border-outline-variant rounded bg-surface text-body-sm text-on-surface focus:border-primary outline-none resize-y"
                          placeholder="Write a reply..."
                        />
                        <div className="flex gap-xs self-end">
                          <button
                            onClick={() => setReplyOpenId(null)}
                            className="text-label-caps px-sm py-xs text-on-surface-variant hover:bg-surface-container rounded transition-colors"
                          >
                            CANCEL
                          </button>
                          <button
                            aria-label="Submit reply"
                            onClick={() => submitReply(c.id)}
                            className="text-label-caps px-sm py-xs bg-primary text-on-primary rounded hover:bg-opacity-90 transition-all"
                          >
                            REPLY
                          </button>
                        </div>
                      </div>
                    )}
                    {c.replies.map((r) => (
                      <div key={r.id} className="flex gap-sm">
                        <Avatar user={r} className="w-6 h-6" />
                        <div>
                          <div className="flex items-center gap-xs">
                            <span className="font-bold text-on-surface text-body-sm">{r.display_name}</span>
                            <span className="text-body-sm text-outline">{timeAgo(r.created_at)}</span>
                          </div>
                          <p className="text-body-sm text-on-surface mt-[2px]">{r.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CompanyFundamentals />
    </div>
  )
}
