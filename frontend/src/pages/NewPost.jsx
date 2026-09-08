import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'

export default function NewPost() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tickers, setTickers] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const tickerList = tickers
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean)
      const { id } = await api.post('/posts', { title, body, tickers: tickerList })
      navigate(`/discussions/${id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-md">
      <h1 className="text-headline-lg text-on-surface">New Discussion</h1>
      <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md">
        <div className="flex flex-col gap-xs">
          <label className="text-body-sm text-on-surface-variant" htmlFor="title">Title</label>
          <input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-10 px-sm border border-outline-variant rounded bg-surface text-body-md text-on-surface focus:border-primary outline-none"
            placeholder="What's your thesis?"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <label className="text-body-sm text-on-surface-variant" htmlFor="tickers">Tickers (comma separated)</label>
          <input
            id="tickers"
            value={tickers}
            onChange={(e) => setTickers(e.target.value)}
            className="w-full h-10 px-sm border border-outline-variant rounded bg-surface text-data-mono text-on-surface focus:border-primary outline-none"
            placeholder="TCS, INFY"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <label className="text-body-sm text-on-surface-variant" htmlFor="body">Body</label>
          <textarea
            id="body"
            required
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-sm py-sm border border-outline-variant rounded bg-surface text-body-md text-on-surface focus:border-primary outline-none resize-y"
            placeholder="Share your research..."
          />
        </div>
        {error && <p className="text-body-sm text-error">{error}</p>}
        <div className="flex gap-sm">
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-on-primary text-body-md px-lg py-sm rounded hover:bg-primary-container transition-colors disabled:opacity-60"
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  )
}
