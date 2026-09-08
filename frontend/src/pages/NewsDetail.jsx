import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { timeAgo } from '../lib/time.js'
import { findKnownTicker } from '../lib/fundamentals.js'
import { useActiveTicker } from '../context/TickerContext.jsx'
import { useVoiceReactions } from '../context/VoiceReactionsContext.jsx'
import CompanyFundamentals from '../components/CompanyFundamentals.jsx'
import CameraRecorder from '../components/CameraRecorder.jsx'
import VoiceStoryViewer from '../components/VoiceStoryViewer.jsx'
import VoiceReactorList from '../components/VoiceReactorList.jsx'

export default function NewsDetail() {
  const { id } = useParams()
  const { setActiveTicker } = useActiveTicker()
  const { byNewsId, seedIfNeeded, addReaction } = useVoiceReactions()
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)
  const [storyIndex, setStoryIndex] = useState(null)

  useEffect(() => {
    api
      .get(`/news/${id}`)
      .then((data) => {
        setItem(data)
        seedIfNeeded(data.id, data.id)
      })
      .catch((e) => setError(e.message))
  }, [id, seedIfNeeded])

  useEffect(() => {
    if (item) setActiveTicker(findKnownTicker(item.tags))
  }, [item, setActiveTicker])

  const reactions = item ? byNewsId[item.id] || [] : []

  function handleRecordedClip(url, { stance, comment } = {}) {
    addReaction(item.id, { id: Date.now(), url, initials: 'YOU', name: 'You', stance: stance || null, comment: comment || '' })
    setRecording(false)
  }

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
      <section className="border-t border-outline-variant pt-lg flex flex-col gap-md">
        <div className="flex items-center justify-between gap-md">
          <h2 className="text-headline-md text-on-surface">Voice Reactions</h2>
          <button
            onClick={() => setRecording(true)}
            className="flex items-center gap-xs text-label-caps px-md py-sm bg-primary text-on-primary rounded-full hover:bg-primary-container transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">mic</span> Give your voice
          </button>
        </div>
        {reactions.length > 0 ? (
          <VoiceReactorList reactions={reactions} onSelect={setStoryIndex} />
        ) : (
          <p className="text-body-sm text-on-surface-variant">No one has reacted with their voice yet — be the first.</p>
        )}
      </section>

      <CompanyFundamentals />

      {recording && <CameraRecorder onClose={() => setRecording(false)} onPost={handleRecordedClip} />}

      {storyIndex !== null && (
        <VoiceStoryViewer reactions={reactions} startIndex={storyIndex} onClose={() => setStoryIndex(null)} />
      )}
    </div>
  )
}
