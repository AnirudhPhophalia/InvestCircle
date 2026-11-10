import { useEffect, useState } from 'react'
import { api } from '../../shared/lib/api.js'
import { FUNDAMENTALS, TICKERS } from '../../shared/lib/fundamentals.js'
import { useActiveTicker } from '../../shared/context/TickerContext.jsx'

function Metric({ label, value }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <span className="text-label-caps text-outline uppercase tracking-wider">{label}</span>
      <span className="text-data-mono text-on-surface">{value ?? '—'}</span>
    </div>
  )
}

// Live (Finnhub) data has gaps the demo data doesn't — show "—", not "$ null".
function fmt(value, prefix = '', suffix = '') {
  return value === null || value === undefined || value === '—' ? '—' : `${prefix}${value}${suffix}`
}

function TickerSelect({ value, options, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 px-sm border border-outline-variant rounded bg-surface-container-lowest text-data-mono text-on-surface focus:border-primary outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function growthLabel(key) {
  return { y10: '10 Years', y5: '5 Years', y3: '3 Years', ttm: 'TTM', y1: '1 Year', last: 'Last Year' }[key] || key
}

function GrowthTable({ title, rows }) {
  return (
    <div className="bg-surface border border-outline-variant rounded p-md flex-1 min-w-[160px]">
      <p className="text-label-caps text-on-surface-variant uppercase tracking-wider mb-sm">{title}</p>
      <div className="flex flex-col gap-xs">
        {Object.entries(rows).map(([key, value]) => {
          const empty = value === null || value === undefined
          const colorClass = empty ? 'text-on-surface' : value < 0 ? 'text-tertiary' : 'text-secondary'
          return (
            <div key={key} className="flex items-center justify-between text-body-sm">
              <span className="text-on-surface-variant">{growthLabel(key)}</span>
              <span className={`text-data-mono ${colorClass}`}>{empty ? '—' : `${value}%`}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function exportToCsv(ticker, data) {
  const rows = [
    ['Metric', 'Value'],
    ['Company', data.name],
    ['Ticker', ticker],
    ['Price', data.price],
    ['Change %', data.changePercent],
    ...Object.entries(data.metrics).map(([k, v]) => [k, v]),
  ]
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${ticker}-fundamentals.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// `affected` (live news only): { articleId, companies: [{ ticker, name, primary? }] }
// — the most affected company first, then the secondarily affected ones.
// `finding` ('searching' | 'failed'): the AI match for this news isn't ready.
export default function CompanyFundamentals({ affected = null, finding = null, initialTicker = null }) {
  const { activeTicker, aiCompanies, addAiCompany } = useActiveTicker()
  const [ticker, setTicker] = useState(initialTicker || activeTicker || 'TCS')
  const [following, setFollowing] = useState(false)
  const [loadState, setLoadState] = useState({}) // ticker -> 'loading' | 'unavailable'

  // Follow whatever company the current page is about; a manual dropdown pick
  // sticks until the page context changes to a different one.
  useEffect(() => {
    if (activeTicker) setTicker(activeTicker)
  }, [activeTicker])

  if (finding) {
    return (
      <section className="w-full max-w-3xl mx-auto mt-xl pt-lg border-t border-outline-variant flex flex-col gap-md">
        <h2 className="text-headline-md text-on-surface">Company Fundamentals</h2>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg text-body-md text-on-surface-variant">
          {finding === 'failed' ? (
            "Couldn't find a related company for this story right now."
          ) : (
            <span className="flex items-center gap-xs animate-pulse">
              <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
              Finding the most related company…
            </span>
          )}
        </div>
      </section>
    )
  }

  // AI-matched companies carry real Finnhub numbers, so they win over demo data.
  const companies = { ...FUNDAMENTALS, ...aiCompanies }
  const data = companies[ticker]

  const options = affected
    ? affected.companies.map((c) => ({
        value: c.ticker,
        label: `${c.ticker} · ${c.name}${c.primary ? ' (most affected)' : ''}`,
      }))
    : [...new Set([...TICKERS, ticker])].map((t) => ({ value: t, label: t }))

  // Secondary companies' data is fetched only when someone picks one.
  function selectTicker(next) {
    setTicker(next)
    const isSecondary = affected?.companies.some((c) => c.ticker === next && !c.primary)
    if (!isSecondary || companies[next] || loadState[next] === 'loading') return
    setLoadState((s) => ({ ...s, [next]: 'loading' }))
    api
      .get(`/news/live/${affected.articleId}/company/${encodeURIComponent(next)}`)
      .then((r) => {
        if (r.data) addAiCompany(next, { ...r.data, aiReason: r.reason })
        setLoadState((s) => ({ ...s, [next]: r.data ? undefined : 'unavailable' }))
      })
      .catch(() => setLoadState((s) => ({ ...s, [next]: 'unavailable' })))
  }

  const header = (
    <div className="flex items-center justify-between gap-md flex-wrap">
      <div>
        <h2 className="text-headline-md text-on-surface">Company Fundamentals</h2>
        {activeTicker === ticker && !data?.aiReason && <p className="text-body-sm text-on-surface-variant">Matched from this page</p>}
      </div>
      <TickerSelect value={ticker} options={options} onChange={selectTicker} />
    </div>
  )

  // No data yet (loading), or the ticker couldn't be verified — say so rather
  // than leave the previous company's numbers on screen.
  if (!data) {
    const name = affected?.companies.find((c) => c.ticker === ticker)?.name || ticker
    return (
      <section className="w-full max-w-3xl mx-auto mt-xl pt-lg border-t border-outline-variant flex flex-col gap-md">
        {header}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg text-body-md text-on-surface-variant">
          {loadState[ticker] === 'loading' ? (
            <span className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px] text-primary animate-pulse">sync</span>
              Loading market data for {name}…
            </span>
          ) : (
            <>
              No verified market data for <span className="text-data-mono text-on-surface">{ticker}</span> ({name}) — its
              ticker couldn&rsquo;t be confirmed on Finnhub, so no figures are shown.
            </>
          )}
        </div>
      </section>
    )
  }

  const positive = data.changePercent >= 0
  const isLive = Boolean(data.aiReason)

  return (
    <section className="w-full max-w-3xl mx-auto mt-xl pt-lg border-t border-outline-variant flex flex-col gap-md">
      {header}

      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg flex flex-col gap-md">
        <div className="flex items-start justify-between gap-md flex-wrap">
          <div>
            <h3 className="text-headline-lg text-on-surface">{data.name}</h3>
            <div className="flex items-center gap-sm mt-xs">
              <span className="text-data-mono text-headline-md text-on-surface">
                {data.currency} {data.price}
              </span>
              <span className={`text-data-mono text-body-sm ${positive ? 'text-secondary' : 'text-tertiary'}`}>
                {positive ? '+' : ''}
                {data.changePercent}%
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant mt-xs">{data.asOf}</p>
          </div>
          <div className="flex flex-col items-end gap-xs">
            <div className="flex gap-xs">
              <button
                onClick={() => exportToCsv(ticker, data)}
                className="flex items-center gap-xs text-label-caps px-sm py-xs border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">download</span>
                EXPORT
              </button>
              <button
                onClick={() => setFollowing((f) => !f)}
                className={`text-label-caps px-sm py-xs rounded transition-colors ${
                  following ? 'bg-primary/10 text-primary' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {following ? 'FOLLOWING' : 'FOLLOW'}
              </button>
            </div>
            <div className="flex items-center gap-sm text-body-sm text-on-surface-variant">
              {data.website !== '—' && <span>{data.website}</span>}
              {data.bse !== '—' && <span>BSE: {data.bse}</span>}
              {data.nse !== '—' && <span>NSE: {data.nse}</span>}
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant pt-md">
          <p className="text-label-caps text-on-surface-variant uppercase tracking-wider mb-xs">About</p>
          <p className="text-body-sm text-on-surface-variant leading-relaxed">{data.about}</p>
        </div>

        <div>
          <p className="text-label-caps text-on-surface-variant uppercase tracking-wider mb-xs">Key Points</p>
          <p className="text-body-sm text-on-surface-variant leading-relaxed">{data.keyPoints}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-md border-t border-outline-variant pt-md">
          <Metric label="Market Cap" value={fmt(data.metrics.marketCap, `${data.currency} `)} />
          <Metric label="Current Price" value={fmt(data.metrics.currentPrice, `${data.currency} `)} />
          <Metric
            label={isLive ? '52W High / Low' : 'High / Low'}
            value={data.metrics.high == null ? '—' : `${data.currency} ${data.metrics.high} / ${data.metrics.low}`}
          />
          <Metric label="Stock P/E" value={fmt(data.metrics.stockPE)} />
          <Metric label="Book Value" value={fmt(data.metrics.bookValue, `${data.currency} `)} />
          <Metric label="Dividend Yield" value={fmt(data.metrics.dividendYield, '', ' %')} />
          <Metric label="ROCE" value={fmt(data.metrics.roce, '', ' %')} />
          <Metric label="ROE" value={fmt(data.metrics.roe, '', ' %')} />
          <Metric label="Face Value" value={fmt(data.metrics.faceValue, `${data.currency} `)} />
        </div>

        <div className="flex flex-wrap gap-md border-t border-outline-variant pt-md">
          <GrowthTable title="Compounded Sales Growth" rows={data.growth.sales} />
          <GrowthTable title="Compounded Profit Growth" rows={data.growth.profit} />
          <GrowthTable title="Stock Price CAGR" rows={data.growth.priceCagr} />
          <GrowthTable title="Return on Equity" rows={data.growth.roe} />
        </div>

        <p className="text-body-sm text-outline">
          {isLive
            ? 'Live market data from Finnhub. Company matched to the news by AI — not investment advice.'
            : 'Demo data for illustration — not a live market feed.'}
        </p>
      </div>
    </section>
  )
}
