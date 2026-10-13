// Amazon prices via the Creators API (the only source Amazon's Associates policy
// allows for displaying prices). Access needs 10 qualifying sales in the trailing
// 30 days, so eligibility comes and goes; callers treat 'not_eligible' as a normal
// state, not an error.

const TOKEN_URL = 'https://api.amazon.com/auth/o2/token' // NA region, credential version 3.1
const GET_ITEMS_URL = 'https://creatorsapi.amazon/catalog/v1/getItems'
const MARKETPLACE = 'www.amazon.com'
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'

const ASIN_RE = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?#]|$)/i

// Short links (amzn.to, a.co) are followed one hop at a time so we never load the
// Amazon page itself just to learn the ASIN.
export async function resolveAsin(url) {
  let current = url
  for (let hop = 0; hop < 6; hop++) {
    const m = current.match(ASIN_RE)
    if (m) return m[1].toUpperCase()
    const res = await fetch(current, { redirect: 'manual', headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(15_000) })
    const next = res.headers.get('location')
    if (!next) break
    current = new URL(next, current).toString()
  }
  return null
}

// Case-insensitive path lookup, so camelCase (Creators API) and PascalCase
// (legacy PA-API) responses both parse.
function get(obj, path) {
  return path.split('.').reduce((o, key) => {
    if (o == null || typeof o !== 'object') return undefined
    const k = Object.keys(o).find(x => x.toLowerCase() === key.toLowerCase())
    return k === undefined ? undefined : o[k]
  }, obj)
}

const looksIneligible = text => /AssociateNotEligible|not\s*eligible|NotEligible/i.test(text)

async function getToken({ credentialId, credentialSecret }) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: credentialId,
      client_secret: credentialSecret,
      scope: 'creatorsapi::default',
    }),
    signal: AbortSignal.timeout(20_000),
  })
  const body = await res.text()
  if (/invalid_client/.test(body)) {
    throw new Error('Amazon rejected the Creators API credentials: the ID and secret don\'t match an active credential. Re-enter the AMAZON_CREDENTIAL_SECRET (and ID) GitHub secrets from the Creators API page')
  }
  if (!res.ok) throw new Error(`Amazon login failed (HTTP ${res.status}): ${body.slice(0, 300)}`)
  return JSON.parse(body).access_token
}

function parseItem(item) {
  const listings = get(item, 'offersV2.listings') ?? []
  const listing = listings.find(l => get(l, 'isBuyBoxWinner')) ?? listings[0]
  const amount = get(listing, 'price.money.amount') ?? get(listing, 'price.amount')
  const availability = String(get(listing, 'availability.type') ?? '')
  let inStock = null
  if (!listing) inStock = false
  else if (/OUT_OF_STOCK|UNAVAILABLE/i.test(availability)) inStock = false
  else if (/IN_STOCK/i.test(availability)) inStock = true
  return {
    price: typeof amount === 'number' ? amount : (amount != null ? parseFloat(amount) : null),
    inStock,
    detailPageUrl: get(item, 'detailPageURL') ?? null,
    title: get(item, 'itemInfo.title.displayValue') ?? null,
  }
}

// Returns { status, message, items: Map<asin, {price, inStock, detailPageUrl, title}>, itemErrors: Map<asin, message> }
// status: 'ok' | 'not_eligible' | 'not_configured' | 'error'
export async function fetchAmazonPrices(asins, { credentialId, credentialSecret, version = '3.1', partnerTag, debug = false }) {
  const result = { status: 'ok', message: null, items: new Map(), itemErrors: new Map() }
  if (!credentialId || !credentialSecret) {
    return { ...result, status: 'not_configured', message: 'No Creators API credentials set' }
  }
  if (!String(version).startsWith('3.')) {
    return { ...result, status: 'error', message: `Credential version ${version} isn't supported yet — create a 3.x credential in Associates Central` }
  }

  let token
  try { token = await getToken({ credentialId, credentialSecret }) }
  catch (e) { return { ...result, status: looksIneligible(e.message) ? 'not_eligible' : 'error', message: e.message } }

  for (let i = 0; i < asins.length; i += 10) {
    const batch = asins.slice(i, i + 10)
    const res = await fetch(GET_ITEMS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-marketplace': MARKETPLACE },
      body: JSON.stringify({
        itemIds: batch,
        itemIdType: 'ASIN',
        marketplace: MARKETPLACE,
        partnerTag,
        resources: ['itemInfo.title', 'offersV2.listings.price', 'offersV2.listings.availability', 'offersV2.listings.isBuyBoxWinner'],
      }),
      signal: AbortSignal.timeout(30_000),
    })
    const text = await res.text()
    if (debug) console.log(`[amazon] HTTP ${res.status}\n${text}\n`)

    if (looksIneligible(text)) {
      return { ...result, items: new Map(), status: 'not_eligible', message: 'Amazon says this Associates account is not eligible yet (needs 10 qualifying sales in the last 30 days)' }
    }
    let data
    try { data = JSON.parse(text) } catch { data = null }
    if (!res.ok && !get(data, 'itemsResult')) {
      return { ...result, items: new Map(), status: 'error', message: `Creators API HTTP ${res.status}: ${text.slice(0, 300)}` }
    }

    for (const item of get(data, 'itemsResult.items') ?? []) {
      const asin = String(get(item, 'asin') ?? '').toUpperCase()
      if (asin) result.items.set(asin, parseItem(item))
    }
    // Per-item errors (e.g. a delisted ASIN) arrive alongside the good items.
    for (const err of get(data, 'errors') ?? []) {
      const message = String(get(err, 'message') ?? get(err, 'code') ?? 'Unknown error')
      const asin = batch.find(a => message.includes(a))
      if (asin) result.itemErrors.set(asin, message)
    }
    for (const asin of batch) {
      if (!result.items.has(asin) && !result.itemErrors.has(asin)) result.itemErrors.set(asin, 'Amazon returned no data for this item')
    }
  }
  return result
}

// Used only while the API is unavailable: is the product page still there?
// Returns 'ok' | 'dead' | 'unknown'. Amazon often answers automated requests with a
// robot check (503), which we treat as unknown rather than raising a false alarm.
export async function checkAmazonLink(asin) {
  try {
    const res = await fetch(`https://www.amazon.com/dp/${asin}`, {
      headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(20_000),
    })
    if (res.status === 404) return 'dead'
    if (res.ok) {
      const html = await res.text()
      if (/captcha|Type the characters you see/i.test(html)) return 'unknown'
      return 'ok'
    }
    return 'unknown'
  } catch {
    return 'unknown'
  }
}
