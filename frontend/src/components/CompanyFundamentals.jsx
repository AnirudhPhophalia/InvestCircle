import { useEffect, useState } from 'react'
import { FUNDAMENTALS, TICKERS } from '../lib/fundamentals.js'
import { useActiveTicker } from '../context/TickerContext.jsx'

function Metric({ label, value }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <span className="text-label-caps text-outline uppercase tracking-wider">{label}</span>
      <span className="text-data-mono text-on-surface">{value ?? '—'}</span>
    </div>
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

export default function CompanyFundamentals() {
  const { activeTicker } = useActiveTicker()
  const [ticker, setTicker] = useState(activeTicker || 'TCS')
  const [following, setFollowing] = useState(false)

  // Follow whatever company the current page is about; a manual dropdown pick
  // sticks until the page context changes to a different one.
  useEffect(() => {
    if (activeTicker) setTicker(activeTicker)
  }, [activeTicker])

  const data = FUNDAMENTALS[ticker]
  const positive = data.changePercent >= 0

  return (
    <section className="w-full max-w-3xl mx-auto mt-xl pt-lg border-t border-outline-variant flex flex-col gap-md">
      <div className="flex items-center justify-between gap-md flex-wrap">
        <div>
          <h2 className="text-headline-md text-on-surface">Company Fundamentals</h2>
          {activeTicker === ticker && <p className="text-body-sm text-on-surface-variant">Matched from this page</p>}
        </div>
        <select
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="h-8 px-sm border border-outline-variant rounded bg-surface-container-lowest text-data-mono text-on-surface focus:border-primary outline-none"
        >
          {TICKERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

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
              <span>{data.website}</span>
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
          <Metric label="Market Cap" value={`${data.currency} ${data.metrics.marketCap}`} />
          <Metric label="Current Price" value={`${data.currency} ${data.metrics.currentPrice}`} />
          <Metric label="High / Low" value={`${data.currency} ${data.metrics.high} / ${data.metrics.low}`} />
          <Metric label="Stock P/E" value={data.metrics.stockPE} />
          <Metric label="Book Value" value={`${data.currency} ${data.metrics.bookValue}`} />
          <Metric label="Dividend Yield" value={`${data.metrics.dividendYield} %`} />
          <Metric label="ROCE" value={`${data.metrics.roce}${data.metrics.roce === '—' ? '' : ' %'}`} />
          <Metric label="ROE" value={`${data.metrics.roe} %`} />
          <Metric label="Face Value" value={`${data.currency} ${data.metrics.faceValue}`} />
        </div>

        <div className="flex flex-wrap gap-md border-t border-outline-variant pt-md">
          <GrowthTable title="Compounded Sales Growth" rows={data.growth.sales} />
          <GrowthTable title="Compounded Profit Growth" rows={data.growth.profit} />
          <GrowthTable title="Stock Price CAGR" rows={data.growth.priceCagr} />
          <GrowthTable title="Return on Equity" rows={data.growth.roe} />
        </div>

        <p className="text-body-sm text-outline">Demo data for illustration — not a live market feed.</p>
      </div>
    </section>
  )
}
