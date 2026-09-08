import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { timeAgo } from '../lib/time.js'
import { FUNDAMENTALS, TICKERS, numericPrice } from '../lib/fundamentals.js'
import Avatar from '../components/Avatar.jsx'
import PostCard from '../components/PostCard.jsx'

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

          <div className="flex flex-wrap gap-lg md:gap-xl pt-sm border-t border-surface-variant mt-sm">
            <Stat label="Accuracy %" value={stats?.accuracy ?? '—'} />
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
    </div>
  )
}
