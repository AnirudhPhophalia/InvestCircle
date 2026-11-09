import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../shared/context/AuthContext.jsx'
import { api } from '../../shared/lib/api.js'
import { timeAgo } from '../../shared/lib/time.js'
import { FUNDAMENTALS, TICKERS, numericPrice } from '../../shared/lib/fundamentals.js'
import Avatar from '../../shared/components/Avatar.jsx'
import PostCard from '../discussions/PostCard.jsx'

const TABS = ['Posts', 'Participation', 'Portfolio']

function Stat({ label, value }) {
  return (
    <div className="flex flex-col gap-xs">
      <span className="text-label-caps text-outline uppercase tracking-wider">{label}</span>
      <span className="text-data-mono text-on-surface">{value}</span>
    </div>
  )
}

function pnlClass(n) {
  if (n == null) return 'text-on-surface-variant'
  return n >= 0 ? 'text-secondary' : 'text-tertiary'
}

function fmt(n, digits = 2) {
  return n == null ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

// One holding enriched with live-ish (demo) numbers computed against fundamentals data.
function enrichHolding(h) {
  const data = FUNDAMENTALS[h.ticker]
  const currentPrice = data ? numericPrice(data.metrics.currentPrice) : null
  const qty = h.quantity || 1
  const invested = h.buy_price != null ? h.buy_price * qty : null
  const currentValue = currentPrice != null ? currentPrice * qty : null
  const pl = invested != null && currentValue != null ? currentValue - invested : null
  const plPercent = invested ? (pl / invested) * 100 : null
  return { ...h, name: data?.name || h.ticker, currency: data?.currency || '', currentPrice, qty, invested, currentValue, pl, plPercent, growth: data?.growth }
}

function summarizeByCurrency(holdings) {
  const groups = {}
  for (const h of holdings) {
    if (!h.currency || h.invested == null || h.currentValue == null) continue
    groups[h.currency] ??= { currency: h.currency, invested: 0, currentValue: 0, y1Weighted: 0, y5Weighted: 0, weight: 0 }
    const g = groups[h.currency]
    g.invested += h.invested
    g.currentValue += h.currentValue
    if (h.growth?.priceCagr?.y1 != null) g.y1Weighted += h.growth.priceCagr.y1 * h.invested
    if (h.growth?.priceCagr?.y5 != null) g.y5Weighted += h.growth.priceCagr.y5 * h.invested
    g.weight += h.invested
  }
  return Object.values(groups).map((g) => ({
    ...g,
    pl: g.currentValue - g.invested,
    plPercent: g.invested ? ((g.currentValue - g.invested) / g.invested) * 100 : null,
    oneYear: g.weight ? g.y1Weighted / g.weight : null,
    fiveYear: g.weight ? g.y5Weighted / g.weight : null,
  }))
}

// US money first, then Indian — a fixed display order rather than alphabetical.
const CURRENCY_ORDER = ['$', '₹']

function HoldingsTable({ holdings, onRemove }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[720px]">
        <thead className="bg-surface border-b border-outline-variant">
          <tr>
            {['Ticker', 'Qty', 'Buy Date', 'Buy Price', 'Current Price', 'Invested', 'Current Value', 'P&L', ''].map((h) => (
              <th key={h} className="py-xs px-sm text-label-caps text-on-surface-variant uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.ticker} className="border-b border-outline-variant last:border-b-0 hover:bg-surface transition-colors">
              <td className="py-sm px-sm">
                <div className="text-data-mono text-on-surface font-bold">{h.ticker}</div>
                <div className="text-body-sm text-on-surface-variant">{h.name}</div>
              </td>
              <td className="py-sm px-sm text-data-mono text-on-surface">{h.qty}</td>
              <td className="py-sm px-sm text-body-sm text-on-surface-variant">{h.buy_date || '—'}</td>
              <td className="py-sm px-sm text-data-mono text-on-surface">
                {h.currency} {fmt(h.buy_price)}
              </td>
              <td className="py-sm px-sm text-data-mono text-on-surface">{h.currentPrice != null ? `${h.currency} ${fmt(h.currentPrice)}` : '—'}</td>
              <td className="py-sm px-sm text-data-mono text-on-surface">{h.invested != null ? `${h.currency} ${fmt(h.invested, 0)}` : '—'}</td>
              <td className="py-sm px-sm text-data-mono text-on-surface">{h.currentValue != null ? `${h.currency} ${fmt(h.currentValue, 0)}` : '—'}</td>
              <td className={`py-sm px-sm text-data-mono ${pnlClass(h.pl)}`}>
                {h.pl == null
                  ? '—'
                  : `${h.pl >= 0 ? '+' : ''}${h.currency} ${fmt(Math.abs(h.pl), 0)} (${h.plPercent >= 0 ? '+' : ''}${fmt(h.plPercent, 1)}%)`}
              </td>
              <td className="py-sm px-sm">
                <button onClick={() => onRemove(h.ticker)} aria-label={`Remove ${h.ticker}`} className="text-outline hover:text-error transition-colors">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PortfolioSummary({ currency, invested, currentValue, pl, plPercent, oneYear, fiveYear }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg grid grid-cols-2 sm:grid-cols-3 gap-md">
      <div className="col-span-2 sm:col-span-3 flex items-center justify-between">
        <h3 className="text-headline-md text-on-surface">Portfolio ({currency})</h3>
        <span className={`text-data-mono text-body-md ${pnlClass(pl)}`}>
          {pl >= 0 ? '+' : ''}
          {currency} {fmt(Math.abs(pl))} ({plPercent >= 0 ? '+' : ''}
          {fmt(plPercent)}%)
        </span>
      </div>
      <Stat label="Total Corpus" value={`${currency} ${fmt(currentValue, 0)}`} />
      <Stat label="Total Invested" value={`${currency} ${fmt(invested, 0)}`} />
      <Stat label="Absolute Return" value={`${plPercent >= 0 ? '+' : ''}${fmt(plPercent)}%`} />
      <Stat label="1Y Return (avg)" value={oneYear == null ? '—' : `${oneYear >= 0 ? '+' : ''}${fmt(oneYear, 1)}%`} />
      <Stat label="5Y Return (avg)" value={fiveYear == null ? '—' : `${fiveYear >= 0 ? '+' : ''}${fmt(fiveYear, 1)}%`} />
    </div>
  )
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [stats, setStats] = useState(null)
  const [tab, setTab] = useState('Posts')
  const [posts, setPosts] = useState(null)
  const [comments, setComments] = useState(null)
  const [watchlist, setWatchlist] = useState(null)
  const [form, setForm] = useState({ ticker: TICKERS[0], buyDate: '', buyPrice: '', quantity: 1 })
  const [editing, setEditing] = useState(false)
  const [bioDraft, setBioDraft] = useState('')
  const [error, setError] = useState('')

  // Accuracy calculation state
  const [loadingAccuracy, setLoadingAccuracy] = useState(false)
  const [accuracyError, setAccuracyError] = useState('')
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showBreakdownModal, setShowBreakdownModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('investcircle_gemini_api_key') || '')
  const [showKeyText, setShowKeyText] = useState(false)
  const [saveKeyLocally, setSaveKeyLocally] = useState(true)

  useEffect(() => {
    if (user) api.get(`/users/${user.id}`).then((u) => setStats(u.stats))
  }, [user])

  useEffect(() => {
    if (!user) return
    if (tab === 'Posts' && posts === null) api.get(`/users/${user.id}/posts`).then(setPosts)
    if (tab === 'Participation' && comments === null) api.get(`/users/${user.id}/comments`).then(setComments)
    if (tab === 'Portfolio' && watchlist === null) api.get('/watchlist').then(setWatchlist)
  }, [tab, user, posts, comments, watchlist])

  const holdings = useMemo(() => (watchlist || []).map(enrichHolding), [watchlist])
  const summaries = useMemo(() => summarizeByCurrency(holdings), [holdings])

  function handleVoteChange(postId, result) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, score: result.score, my_vote: result.my_vote } : p)))
  }

  async function saveBio() {
    try {
      updateUser(await api.patch('/users/me', { bio: bioDraft }))
      setEditing(false)
    } catch (err) {
      setError(err.message)
    }
  }

  async function addHolding(e) {
    e.preventDefault()
    if (!form.buyDate || !form.buyPrice) return
    const saved = await api.post('/watchlist', {
      ticker: form.ticker,
      buyDate: form.buyDate,
      buyPrice: Number(form.buyPrice),
      quantity: Number(form.quantity) || 1,
    })
    setWatchlist((prev) => [...(prev || []).filter((h) => h.ticker !== saved.ticker), saved].sort((a, b) => a.ticker.localeCompare(b.ticker)))
    setForm({ ticker: TICKERS[0], buyDate: '', buyPrice: '', quantity: 1 })
  }

  async function removeHolding(ticker) {
    await api.del(`/watchlist/${ticker}`)
    setWatchlist((prev) => prev.filter((h) => h.ticker !== ticker))
  }

  async function handleGetAccuracy(customKey) {
    const keyToUse =
      (typeof customKey === 'string' ? customKey : apiKeyInput).trim() ||
      localStorage.getItem('investcircle_gemini_api_key') ||
      ''

    setLoadingAccuracy(true)
    setAccuracyError('')

    try {
      const res = await api.post(`/users/${user.id}/accuracy`, keyToUse ? { apiKey: keyToUse } : {})
      if (res?.stats) {
        setStats(res.stats)
      }
      if (keyToUse && saveKeyLocally) {
        localStorage.setItem('investcircle_gemini_api_key', keyToUse)
      }
      setShowApiKeyModal(false)
      setShowBreakdownModal(true)
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('API key') || msg.includes('apiKeyRequired')) {
        setShowApiKeyModal(true)
      } else {
        setAccuracyError(msg || 'Failed to calculate accuracy')
      }
    } finally {
      setLoadingAccuracy(false)
    }
  }

  function handleKeySubmit(e) {
    e.preventDefault()
    if (!apiKeyInput.trim()) return
    handleGetAccuracy(apiKeyInput.trim())
  }

  if (!user) return null

  return (
    <div className="w-full max-w-[800px] mx-auto flex flex-col gap-xl">
      <section className="flex flex-col md:flex-row items-start gap-lg pt-lg">
        <Avatar user={user} className="w-24 h-24 text-display" />
        <div className="flex-1 w-full flex flex-col gap-md">
          <div className="flex justify-between items-start w-full gap-md">
            <div>
              <h1 className="text-display text-on-surface tracking-tight">{user.display_name}</h1>
              <p className="text-body-md text-on-surface-variant mt-xs">
                @{user.handle}
                {user.badge ? ` · ${user.badge}` : ''}
              </p>
            </div>
            {!editing && (
              <button
                onClick={() => {
                  setBioDraft(user.bio)
                  setEditing(true)
                }}
                className="flex items-center gap-xs px-md py-sm bg-surface-container-lowest border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span className="text-label-caps uppercase">Edit</span>
              </button>
            )}
          </div>

          {editing ? (
            <div className="flex flex-col gap-sm">
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                rows={3}
                className="w-full px-sm py-sm border border-outline-variant rounded bg-surface-container-lowest text-body-md text-on-surface focus:border-primary outline-none resize-y"
              />
              {error && <p className="text-body-sm text-error">{error}</p>}
              <div className="flex gap-sm">
                <button onClick={saveBio} className="bg-primary text-on-primary text-label-caps px-md py-xs rounded hover:bg-opacity-90 transition-all">
                  SAVE
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-on-surface-variant text-label-caps px-md py-xs border border-outline-variant rounded hover:bg-surface-container transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <p className="text-body-md text-on-surface max-w-2xl leading-relaxed">{user.bio || 'No bio yet.'}</p>
          )}

          <div className="flex flex-wrap items-center gap-lg md:gap-xl pt-sm border-t border-surface-variant mt-sm">
            {/* Accuracy block */}
            <div className="flex flex-col gap-xs">
              <span className="text-label-caps text-outline uppercase tracking-wider">Accuracy %</span>
              {stats?.accuracy ? (
                <div className="flex items-center gap-xs">
                  <span className="text-data-mono font-bold text-headline-sm text-secondary">
                    {stats.accuracy}
                  </span>
                  {stats.accuracy_details && (
                    <button
                      onClick={() => setShowBreakdownModal(true)}
                      className="text-body-xs text-primary hover:underline ml-1 inline-flex items-center gap-0.5"
                      title="View hit/miss breakdown"
                    >
                      <span className="material-symbols-outlined text-[15px]">insights</span>
                      <span className="text-xs">Breakdown</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleGetAccuracy()}
                    disabled={loadingAccuracy}
                    className="text-on-surface-variant hover:text-primary transition-colors ml-1 p-0.5 rounded"
                    title="Recalculate Accuracy"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${loadingAccuracy ? 'animate-spin' : ''}`}>
                      refresh
                    </span>
                  </button>
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    className="text-outline hover:text-on-surface transition-colors p-0.5 rounded"
                    title="Change Gemini API Key"
                  >
                    <span className="material-symbols-outlined text-[15px]">key</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1 items-start">
                  <button
                    onClick={() => handleGetAccuracy()}
                    disabled={loadingAccuracy}
                    className="inline-flex items-center gap-xs px-sm py-1 bg-primary text-on-primary text-label-caps rounded hover:bg-opacity-90 transition-all font-semibold shadow-sm text-xs"
                  >
                    {loadingAccuracy ? (
                      <>
                        <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                        <span>Checking online...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[15px]">analytics</span>
                        <span>Get Accuracy</span>
                      </>
                    )}
                  </button>
                  {accuracyError && (
                    <span className="text-body-xs text-error max-w-[200px] leading-tight">{accuracyError}</span>
                  )}
                </div>
              )}
            </div>

            <Stat label="Discussions" value={stats?.posts ?? '—'} />
            <Stat label="Followers" value={stats?.followers ?? '—'} />
            <Stat label="Following" value={stats?.following ?? '—'} />
          </div>
        </div>
      </section>

      <div className="border-b border-surface-variant flex gap-lg">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-label-caps uppercase pb-sm border-b-2 transition-colors tracking-wider ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Posts' && (
        <div className="flex flex-col gap-md pb-xl">
          {posts === null && <p className="text-body-md text-on-surface-variant">Loading…</p>}
          {posts?.length === 0 && <p className="text-body-md text-on-surface-variant">No posts yet.</p>}
          {posts?.map((post) => (
            <PostCard
              key={post.id}
              post={{ ...post, display_name: user.display_name, handle: user.handle, badge: user.badge, avatar: user.avatar }}
              onVoteChange={handleVoteChange}
            />
          ))}
        </div>
      )}

      {tab === 'Participation' && (
        <div className="flex flex-col gap-sm pb-xl">
          {comments === null && <p className="text-body-md text-on-surface-variant">Loading…</p>}
          {comments?.length === 0 && <p className="text-body-md text-on-surface-variant">No comments yet.</p>}
          {comments?.map((c) => (
            <Link
              key={c.id}
              to={`/discussions/${c.post_id}`}
              className="bg-surface-container-lowest border border-outline-variant p-md flex flex-col gap-xs hover:bg-surface-container-low transition-colors"
            >
              <span className="text-body-sm text-on-surface-variant">
                on <span className="text-on-surface font-bold">{c.post_title}</span> · {timeAgo(c.created_at)}
              </span>
              <p className="text-body-md text-on-surface">{c.body}</p>
            </Link>
          ))}
        </div>
      )}

      {tab === 'Portfolio' && (
        <div className="flex flex-col gap-lg pb-xl">
          {watchlist === null && <p className="text-body-md text-on-surface-variant">Loading…</p>}

          {watchlist && watchlist.length === 0 && <p className="text-body-md text-on-surface-variant">No holdings yet — add one below.</p>}

          {[...summaries]
            .sort((a, b) => CURRENCY_ORDER.indexOf(a.currency) - CURRENCY_ORDER.indexOf(b.currency))
            .map((s) => (
              <div key={s.currency} className="flex flex-col gap-md">
                <PortfolioSummary {...s} />
                <HoldingsTable holdings={holdings.filter((h) => h.currency === s.currency)} onRemove={removeHolding} />
              </div>
            ))}

          {holdings.some((h) => !h.currency) && (
            <div className="flex flex-col gap-md">
              <h3 className="text-headline-md text-on-surface">Other</h3>
              <HoldingsTable holdings={holdings.filter((h) => !h.currency)} onRemove={removeHolding} />
            </div>
          )}

          <form onSubmit={addHolding} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-wrap items-end gap-sm">
            <div className="flex flex-col gap-xs">
              <label className="text-label-caps text-on-surface-variant uppercase">Ticker</label>
              <select
                value={form.ticker}
                onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))}
                className="h-9 px-sm border border-outline-variant rounded bg-surface text-data-mono text-on-surface focus:border-primary outline-none"
              >
                {TICKERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-label-caps text-on-surface-variant uppercase">Buy Date</label>
              <input
                type="date"
                required
                value={form.buyDate}
                onChange={(e) => setForm((f) => ({ ...f, buyDate: e.target.value }))}
                className="h-9 px-sm border border-outline-variant rounded bg-surface text-body-sm text-on-surface focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-label-caps text-on-surface-variant uppercase">Buy Price</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={form.buyPrice}
                onChange={(e) => setForm((f) => ({ ...f, buyPrice: e.target.value }))}
                placeholder={FUNDAMENTALS[form.ticker]?.currentPrice ?? ''}
                className="h-9 w-28 px-sm border border-outline-variant rounded bg-surface text-data-mono text-on-surface focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-label-caps text-on-surface-variant uppercase">Qty</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="h-9 w-20 px-sm border border-outline-variant rounded bg-surface text-data-mono text-on-surface focus:border-primary outline-none"
              />
            </div>
            <button type="submit" className="h-9 bg-primary text-on-primary text-label-caps px-md rounded hover:bg-opacity-90 transition-all">
              ADD HOLDING
            </button>
          </form>
        </div>
      )}

      {/* Accuracy Breakdown Modal */}
      {showBreakdownModal && stats?.accuracy_details && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-outline-variant rounded-lg max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-md border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-2xl">verified</span>
                <div>
                  <h2 className="text-headline-sm text-on-surface font-bold">Accuracy & Hit-Rate Breakdown</h2>
                  <p className="text-body-xs text-on-surface-variant">
                    Verified with Gemini against online market data & discussions sentiment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBreakdownModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-md overflow-y-auto flex flex-col gap-md">
              {/* Score Summary Box */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-col sm:flex-row items-center justify-between gap-md">
                <div>
                  <span className="text-label-caps text-outline uppercase tracking-wider text-xs">Total Accuracy Score</span>
                  <div className="text-display font-bold text-secondary mt-0.5">{stats.accuracy}</div>
                  <p className="text-body-xs text-on-surface-variant mt-1">
                    Formula: <span className="text-on-surface font-mono font-medium">Hits ÷ (Hits + Misses) × 100</span>
                  </p>
                  {stats.accuracy_details.formula && (
                    <p className="text-body-xs text-primary font-mono font-medium mt-0.5">
                      {stats.accuracy_details.formula}
                    </p>
                  )}
                </div>

                <div className="flex gap-sm">
                  <div className="flex flex-col items-center bg-surface border border-outline-variant px-md py-sm rounded min-w-[70px]">
                    <span className="text-label-caps text-secondary uppercase text-xs flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span> Hits
                    </span>
                    <span className="text-data-mono font-bold text-headline-sm text-secondary">
                      {stats.accuracy_details.hits ?? 0}
                    </span>
                  </div>
                  <div className="flex flex-col items-center bg-surface border border-outline-variant px-md py-sm rounded min-w-[70px]">
                    <span className="text-label-caps text-error uppercase text-xs flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[14px]">cancel</span> Misses
                    </span>
                    <span className="text-data-mono font-bold text-headline-sm text-error">
                      {stats.accuracy_details.misses ?? 0}
                    </span>
                  </div>
                  <div className="flex flex-col items-center bg-surface border border-outline-variant px-md py-sm rounded min-w-[70px]">
                    <span className="text-label-caps text-outline uppercase text-xs font-bold">Neutral</span>
                    <span className="text-data-mono font-bold text-headline-sm text-on-surface-variant">
                      {stats.accuracy_details.neutral ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Evaluated Discussions List */}
              <div className="flex flex-col gap-xs">
                <span className="text-label-caps text-outline uppercase tracking-wider text-xs">
                  Evaluated Discussions & Calls ({stats.accuracy_details.evaluations?.length ?? 0})
                </span>

                {(!stats.accuracy_details.evaluations || stats.accuracy_details.evaluations.length === 0) && (
                  <p className="text-body-sm text-on-surface-variant py-md text-center">
                    No discussions found to evaluate.
                  </p>
                )}

                <div className="flex flex-col gap-sm">
                  {stats.accuracy_details.evaluations?.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-surface-container-lowest border border-outline-variant rounded p-sm flex flex-col gap-xs"
                    >
                      <div className="flex items-start justify-between gap-sm flex-wrap">
                        <div className="flex items-center gap-xs flex-wrap">
                          {item.ticker && item.ticker !== 'N/A' && (
                            <span className="bg-surface border border-outline-variant text-data-mono text-on-surface text-xs font-bold px-1.5 py-0.5 rounded">
                              ${item.ticker}
                            </span>
                          )}
                          <span
                            className={`text-label-caps text-xs px-2 py-0.5 rounded uppercase font-semibold ${
                              item.sentiment?.toLowerCase() === 'bullish'
                                ? 'bg-secondary/15 text-secondary border border-secondary/30'
                                : item.sentiment?.toLowerCase() === 'bearish'
                                ? 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                                : 'bg-surface-variant text-on-surface-variant border border-outline-variant'
                            }`}
                          >
                            {item.sentiment || 'Discussion'}
                          </span>
                          <span className="text-body-sm font-semibold text-on-surface">
                            {item.title}
                          </span>
                        </div>

                        <span
                          className={`text-label-caps text-xs px-2 py-0.5 rounded font-bold uppercase ${
                            item.verdict?.toUpperCase() === 'HIT'
                              ? 'bg-secondary text-on-primary'
                              : item.verdict?.toUpperCase() === 'MISS'
                              ? 'bg-error text-on-error'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {item.verdict?.toUpperCase() === 'HIT'
                            ? '✓ HIT'
                            : item.verdict?.toUpperCase() === 'MISS'
                            ? '✗ MISS'
                            : 'NEUTRAL'}
                        </span>
                      </div>

                      {item.claim && (
                        <div className="text-body-xs text-on-surface-variant">
                          <span className="text-on-surface font-semibold">User Stance:</span> {item.claim}
                        </div>
                      )}

                      {item.online_truth && (
                        <div className="text-body-xs text-on-surface-variant">
                          <span className="text-primary font-semibold">Online Market Data:</span> {item.online_truth}
                        </div>
                      )}

                      {item.reason && (
                        <p className="text-body-xs text-on-surface bg-surface/60 p-2 rounded border border-outline-variant/60 leading-relaxed">
                          {item.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-md border-t border-outline-variant bg-surface-container-low flex justify-between items-center">
              <button
                onClick={() => {
                  setShowBreakdownModal(false)
                  setShowApiKeyModal(true)
                }}
                className="text-body-xs text-outline hover:text-on-surface flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">key</span>
                <span>Configure API Key</span>
              </button>

              <div className="flex gap-sm">
                <button
                  onClick={() => handleGetAccuracy()}
                  disabled={loadingAccuracy}
                  className="px-md py-xs bg-surface border border-outline-variant hover:border-primary text-on-surface text-label-caps rounded transition-colors flex items-center gap-1 text-xs"
                >
                  <span className={`material-symbols-outlined text-[15px] ${loadingAccuracy ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                  <span>Recalculate</span>
                </button>
                <button
                  onClick={() => setShowBreakdownModal(false)}
                  className="px-md py-xs bg-primary text-on-primary text-label-caps rounded hover:bg-opacity-90 transition-all text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gemini API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-outline-variant rounded-lg max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-md border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-2xl">key</span>
                <h2 className="text-headline-sm text-on-surface font-bold">Gemini API Key</h2>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleKeySubmit} className="p-md flex flex-col gap-md">
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                InvestCircle uses the Google Gemini API with Google Search grounding to fetch online stock data and verify the trueness of your discussion calls.
              </p>

              <div className="flex flex-col gap-xs">
                <label className="text-label-caps text-on-surface-variant uppercase text-xs">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    required
                    placeholder="AIzaSy..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full px-sm py-2 bg-surface-container-lowest border border-outline-variant rounded text-data-mono text-on-surface text-sm focus:border-primary outline-none pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showKeyText ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-xs">
                <input
                  type="checkbox"
                  id="saveKey"
                  checked={saveKeyLocally}
                  onChange={(e) => setSaveKeyLocally(e.target.checked)}
                  className="rounded border-outline-variant bg-surface text-primary focus:ring-0"
                />
                <label htmlFor="saveKey" className="text-body-xs text-on-surface-variant cursor-pointer">
                  Remember in this browser (localStorage)
                </label>
              </div>

              <div className="text-body-xs text-on-surface-variant bg-surface-container-lowest p-sm rounded border border-outline-variant">
                Need a free key? Get one in seconds at{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline hover:text-opacity-80 inline-flex items-center gap-0.5"
                >
                  Google AI Studio <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                </a>
              </div>

              {accuracyError && (
                <div className="p-xs bg-error/10 border border-error/30 rounded text-error text-body-xs">
                  {accuracyError}
                </div>
              )}

              <div className="flex justify-end gap-sm pt-xs">
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(false)}
                  className="px-md py-xs border border-outline-variant text-on-surface-variant text-label-caps rounded hover:bg-surface-container transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAccuracy || !apiKeyInput.trim()}
                  className="px-md py-xs bg-primary text-on-primary text-label-caps rounded hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center gap-1 text-xs"
                >
                  {loadingAccuracy && (
                    <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                  )}
                  <span>Verify & Calculate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
