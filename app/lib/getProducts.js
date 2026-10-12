import fallbackSnapshot from '@/data/snapshot-fallback.json'

// Written every few hours by scripts/update-prices.mjs (GitHub Actions) to the `data` branch.
const PRICES_URL = process.env.PRICES_URL
  || 'https://raw.githubusercontent.com/raider708/alginate-compare/data/latest.json'

// Amazon's Associates rules only allow showing API-sourced prices, refreshed within 24h.
// Store-site prices get a little more slack so a missed run doesn't blank the table.
const MAX_AGE_HOURS = { amazon: 24, shopify: 72 }

const ptFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
})
const formatTime = iso => `${ptFormat.format(new Date(iso))} PT`

async function getSnapshot() {
  try {
    const fetchOpts = process.env.NODE_ENV === 'development'
      ? { cache: 'no-store' }
      : { next: { revalidate: 900 } }
    const res = await fetch(PRICES_URL, fetchOpts)
    if (!res.ok) return fallbackSnapshot
    const data = await res.json()
    return Array.isArray(data?.products) && Array.isArray(data?.offers) ? data : fallbackSnapshot
  } catch {
    return fallbackSnapshot
  }
}

function toOfferView(o, now) {
  const maxAge = MAX_AGE_HOURS[o.source]
  const fresh = maxAge != null && o.checkedAt != null && (now - Date.parse(o.checkedAt)) < maxAge * 3_600_000
  const price = fresh ? o.price : null
  return {
    key:         o.key,
    retailer:    o.retailer,
    packSize:    o.packSize,
    doses:       o.doses,
    url:         o.buyUrl || o.url,
    isAmazon:    o.source === 'amazon',
    price,
    costPerDose: price != null && o.doses > 0 ? price / o.doses : null,
    inStock:     fresh ? o.inStock : null,
    checkedAt:   fresh ? formatTime(o.checkedAt) : null,
  }
}

// Within a product: cheapest in-stock first, then out-of-stock, then unpriced links.
function offerRank(o) {
  if (o.costPerDose == null) return [2, 0]
  return [o.inStock === false ? 1 : 0, o.costPerDose]
}
const byRank = (a, b) => {
  const [ra, rb] = [offerRank(a), offerRank(b)]
  return ra[0] - rb[0] || ra[1] - rb[1]
}

export async function getProducts() {
  const snapshot = await getSnapshot()
  const now = Date.now()

  const products = snapshot.products.map(p => {
    const offers = snapshot.offers
      .filter(o => o.productId === p.id)
      .map(o => toOfferView(o, now))
      .sort(byRank)
    const buyable = offers.filter(o => o.costPerDose != null && o.inStock !== false)
    return {
      ...p,
      offers,
      // Product-level $/dose = best price you can actually buy right now (used for sorting)
      costPerDose: buyable.length ? Math.min(...buyable.map(o => o.costPerDose)) : null,
    }
  })

  return {
    products,
    amazonLive: snapshot.amazon?.status === 'ok',
    generatedAt: snapshot.generatedAt ? formatTime(snapshot.generatedAt) : null,
  }
}
