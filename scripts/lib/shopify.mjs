// Shopify stores publish every product as JSON at /products/<handle>.js — price and
// stock straight from the store, no scraping. Works for any /products/... URL,
// including /collections/<x>/products/<handle> links.

const UA = 'Mozilla/5.0 (compatible; AlginateCompareBot/1.0; +https://alginatecompare.com)'

export function shopifyJsonUrl(url) {
  const u = new URL(url)
  const m = u.pathname.match(/\/products\/([^/?#]+)/)
  return m ? `${u.origin}/products/${m[1]}.js` : null
}

export async function fetchShopifyOffer({ url, variant }) {
  const jsonUrl = shopifyJsonUrl(url)
  if (!jsonUrl) return { supported: false }

  const res = await fetch(jsonUrl, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20_000) })
  if (res.status === 404) throw new Error('Product page not found (404) — the link may be dead or the product discontinued')
  if (!res.ok) throw new Error(`Store returned HTTP ${res.status}`)

  let data
  try { data = await res.json() } catch { return { supported: false } }
  if (!Array.isArray(data?.variants) || data.variants.length === 0) return { supported: false }

  let v
  if (variant) {
    v = data.variants.find(x => x.title.toLowerCase() === variant.toLowerCase())
      ?? data.variants.find(x => x.title.toLowerCase().includes(variant.toLowerCase()))
    if (!v) throw new Error(`No variant named "${variant}" (store has: ${data.variants.map(x => x.title).join(', ')})`)
  } else {
    // Default to a one-off purchase rather than a subscription option.
    v = data.variants.find(x => !/subscri/i.test(x.title)) ?? data.variants[0]
  }

  return {
    supported: true,
    price:   v.price / 100,          // Shopify prices are in cents
    inStock: Boolean(v.available),
    title:   data.title,
  }
}
