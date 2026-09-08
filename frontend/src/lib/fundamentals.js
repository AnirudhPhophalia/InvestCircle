// Static demo data (not a live feed — matches the rest of this prototype's seeded datasets).
export const FUNDAMENTALS = {
  TCS: {
    name: 'Tata Consultancy Services Ltd', currency: '₹',
    price: '4,082', changePercent: 0.42, asOf: '08 Sep, 9:54 a.m.',
    website: 'tcs.com', bse: '532540', nse: 'TCS',
    about: 'TCS is a global IT services, consulting and business solutions organisation, part of the Tata Group, serving clients across banking, retail, and manufacturing.',
    keyPoints: 'Business Overview: Provides IT services, consulting, and digital transformation, with BFSI as its largest vertical.',
    metrics: { marketCap: '14,77,000 Cr.', currentPrice: '4,082', high: '4,585', low: '3,500', stockPE: 27.4, bookValue: 320, dividendYield: 1.6, roce: 44.2, roe: 33.1, faceValue: 1 },
    growth: {
      sales: { y10: 10, y5: 8, y3: 6, ttm: 4 },
      profit: { y10: 11, y5: 9, y3: 5, ttm: 3 },
      priceCagr: { y10: 15, y5: 12, y3: 8, y1: -2 },
      roe: { y10: 33, y5: 32, y3: 31, last: 33 },
    },
  },
  NVDA: {
    name: 'NVIDIA Corporation', currency: '$',
    price: '187.42', changePercent: 2.14, asOf: '08 Sep, 9:54 a.m.',
    website: 'nvidia.com', bse: '—', nse: '—',
    about: 'NVIDIA designs GPUs and AI accelerators used across gaming, data centers, and AI infrastructure.',
    keyPoints: 'Business Overview: Data Center is now the largest revenue segment, driven by AI accelerator demand.',
    metrics: { marketCap: '4,600 B', currentPrice: '187.42', high: '212', low: '86', stockPE: 65.2, bookValue: 15.8, dividendYield: 0.03, roce: 78.4, roe: 91.5, faceValue: '0.001' },
    growth: {
      sales: { y10: 45, y5: 62, y3: 78, ttm: 94 },
      profit: { y10: 52, y5: 70, y3: 88, ttm: 110 },
      priceCagr: { y10: 68, y5: 95, y3: 110, y1: 45 },
      roe: { y10: 55, y5: 68, y3: 80, last: 92 },
    },
  },
  INFY: {
    name: 'Infosys Ltd', currency: '₹',
    price: '1,512', changePercent: -0.85, asOf: '08 Sep, 9:54 a.m.',
    website: 'infosys.com', bse: '500209', nse: 'INFY',
    about: 'Infosys provides IT consulting, software services, and digital transformation solutions to global enterprises.',
    keyPoints: 'Business Overview: Second-largest Indian IT services exporter, with a growing digital and AI services mix.',
    metrics: { marketCap: '6,27,000 Cr.', currentPrice: '1,512', high: '1,955', low: '1,358', stockPE: 24.1, bookValue: 220, dividendYield: 2.9, roce: 38.5, roe: 29.8, faceValue: 5 },
    growth: {
      sales: { y10: 11, y5: 9, y3: 6, ttm: 2 },
      profit: { y10: 10, y5: 8, y3: 4, ttm: 1 },
      priceCagr: { y10: 12, y5: 9, y3: 5, y1: -6 },
      roe: { y10: 27, y5: 28, y3: 29, last: 30 },
    },
  },
  JPM: {
    name: 'JPMorgan Chase & Co.', currency: '$',
    price: '215.60', changePercent: -0.31, asOf: '08 Sep, 9:54 a.m.',
    website: 'jpmorganchase.com', bse: '—', nse: '—',
    about: 'JPMorgan Chase is a leading global financial services firm spanning consumer banking, investment banking, and asset management.',
    keyPoints: 'Business Overview: Net interest income is under pressure from rising deposit costs even as trading revenue holds up.',
    metrics: { marketCap: '620 B', currentPrice: '215.60', high: '229', low: '155', stockPE: 12.1, bookValue: 105.4, dividendYield: 2.1, roce: '—', roe: 17.2, faceValue: 1 },
    growth: {
      sales: { y10: 6, y5: 7, y3: 9, ttm: 8 },
      profit: { y10: 8, y5: 10, y3: 12, ttm: 6 },
      priceCagr: { y10: 14, y5: 16, y3: 18, y1: 22 },
      roe: { y10: 14, y5: 16, y3: 17, last: 17 },
    },
  },
  BAC: {
    name: 'Bank of America Corp.', currency: '$',
    price: '41.28', changePercent: 0.12, asOf: '08 Sep, 9:54 a.m.',
    website: 'bankofamerica.com', bse: '—', nse: '—',
    about: 'Bank of America is a multinational investment bank and financial services company serving consumers, businesses, and institutions.',
    keyPoints: 'Business Overview: Consumer banking and global markets are the two largest contributors to net revenue.',
    metrics: { marketCap: '320 B', currentPrice: '41.28', high: '48', low: '33', stockPE: 13.4, bookValue: 35.9, dividendYield: 2.4, roce: '—', roe: 10.8, faceValue: '0.01' },
    growth: {
      sales: { y10: 4, y5: 5, y3: 7, ttm: 5 },
      profit: { y10: 5, y5: 6, y3: 8, ttm: 3 },
      priceCagr: { y10: 11, y5: 10, y3: 13, y1: 18 },
      roe: { y10: 9, y5: 10, y3: 11, last: 11 },
    },
  },
  AVANTEL: {
    name: 'Avantel Ltd', currency: '₹',
    price: '157', changePercent: 0.16, asOf: '08 Sep, 9:54 a.m.',
    website: 'avantel.in', bse: '532406', nse: 'AVANTEL',
    about: 'Avantel Limited designs, develops and maintains wireless and satellite communication products, defence electronics, and radar systems, and develops network management software for customers mainly in aerospace and defence.',
    keyPoints: 'Business Overview: Engaged in design, development and manufacturing of wireless front-end systems, satellite communication solutions, embedded systems, signal processing and network management products, along with software development and support services.',
    metrics: { marketCap: '4,173 Cr.', currentPrice: '157', high: '215', low: '117', stockPE: 243, bookValue: 12.7, dividendYield: 0.13, roce: 9.63, roe: 5.29, faceValue: 2 },
    growth: {
      sales: { y10: null, y5: 23, y3: 13, ttm: -3 },
      profit: { y10: null, y5: 0, y3: -17, ttm: -67 },
      priceCagr: { y10: 57, y5: 68, y3: 27, y1: -8 },
      roe: { y10: null, y5: 21, y3: 20, last: 5 },
    },
  },
}

export const TICKERS = Object.keys(FUNDAMENTALS)

// Metric strings carry commas/units for display ("4,082", "4,600 B") — this pulls
// the leading number back out for math.
export function numericPrice(value) {
  if (value == null) return null
  const n = parseFloat(String(value).replace(/,/g, ''))
  return Number.isNaN(n) ? null : n
}

// Picks the first ticker out of a comma-separated tags/tickers string that we
// actually have fundamentals for (news tags mix real tickers with categories
// like "AI" or "MACRO", so this filters down to the ones that match).
export function findKnownTicker(tagsOrTickers) {
  if (!tagsOrTickers) return null
  const tokens = tagsOrTickers.split(',').map((t) => t.trim().toUpperCase())
  return tokens.find((t) => TICKERS.includes(t)) || null
}
