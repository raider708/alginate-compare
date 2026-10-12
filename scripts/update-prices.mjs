#!/usr/bin/env node
// Checks every offer in the catalog for current price and stock, then writes a
// snapshot the website reads. Runs on a schedule in GitHub Actions
// (.github/workflows/update-prices.yml); can also be run locally:
//
//   node scripts/update-prices.mjs --out /tmp/prices \
//     --products data/seed/products.csv --offers data/seed/offers.csv
//
// Options:
//   --out <dir>        where to write latest.json, history.csv (required)
//   --prev <dir>       previous output, for history and change alerts
//   --products <src>   Products tab: published CSV URL or file (default: $SHEET_PRODUCTS_CSV_URL)
//   --offers <src>     Offers tab: published CSV URL or file (default: $SHEET_OFFERS_CSV_URL)
//   --debug-amazon     print raw Creators API responses

import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { loadCatalog, isAmazonUrl, offerKey } from './lib/catalog.mjs'
import { fetchShopifyOffer } from './lib/shopify.mjs'
import { resolveAsin, fetchAmazonPrices, checkAmazonLink } from './lib/amazon.mjs'
import { parseCSV, toCSV } from './lib/csv.mjs'

const HISTORY_HEADER = ['checked_at', 'product_id', 'retailer', 'pack_size', 'price', 'in_stock', 'url']

const { values: args } = parseArgs({
  options: {
    out:            { type: 'string' },
    prev:           { type: 'string' },
    products:       { type: 'string', default: process.env.SHEET_PRODUCTS_CSV_URL },
    offers:         { type: 'string', default: process.env.SHEET_OFFERS_CSV_URL },
    'debug-amazon': { type: 'boolean', default: false },
  },
})
if (!args.out) throw new Error('--out is required')

const now = new Date().toISOString()
const prev = await readPrev(args.prev)
const prevOffers = new Map((prev?.offers ?? []).map(o => [o.key, o]))

// ── Catalog ───────────────────────────────────────────────────────────────────
let catalog
try {
  if (!args.products || !args.offers) throw new Error('Sheet URLs not configured (SHEET_PRODUCTS_CSV_URL / SHEET_OFFERS_CSV_URL)')
  catalog = await loadCatalog({ productsSource: args.products, offersSource: args.offers })
} catch (e) {
  if (!prev) throw e
  // Keep the site working on the last good catalog; the alert tells you to fix the sheet.
  console.warn(`Couldn't load catalog (${e.message}); reusing previous catalog`)
  catalog = {
    products: prev.products,
    offers: prev.offers.map(({ productId, retailer, packSize, doses, url, variant }) => ({ productId, retailer, packSize, doses, url, variant })),
    problems: [{ key: 'catalog:unreadable', message: `Couldn't read the Google Sheet, so the site is using the last good copy: ${e.message}` }],
  }
}
const problems = [...catalog.problems]

// ── Offers ────────────────────────────────────────────────────────────────────
const results = []
const amazonOffers = []

for (const offer of catalog.offers) {
  const key = offerKey(offer)
  const label = `${offer.retailer} — ${offer.productId} (${offer.packSize})`
  const base = { key, ...offer, buyUrl: offer.url, source: 'none', asin: null, price: null, inStock: null, checkedAt: null, error: null }

  if (isAmazonUrl(offer.url)) {
    const asin = prevOffers.get(key)?.asin ?? await resolveAsin(offer.url).catch(() => null)
    const r = { ...base, source: 'amazon', asin }
    if (!asin) {
      r.error = "Couldn't find the Amazon product ID (ASIN) in this link"
      problems.push({ key: `offer-error:${key}`, message: `${label}: ${r.error}` })
    } else {
      amazonOffers.push(r)
    }
    results.push(r)
    continue
  }

  try {
    const s = await fetchShopifyOffer(offer)
    if (!s.supported) { results.push(base); continue }   // not a store we can read; shown as a plain link
    results.push({ ...base, source: 'shopify', price: s.price, inStock: s.inStock, checkedAt: now })
  } catch (e) {
    // Keep the last good price (with its original timestamp) so a blip doesn't blank the row.
    const last = prevOffers.get(key)
    results.push({ ...base, source: 'shopify', price: last?.price ?? null, inStock: last?.inStock ?? null, checkedAt: last?.checkedAt ?? null, error: e.message })
    problems.push({ key: `offer-error:${key}`, message: `${label}: ${e.message}` })
  }
}

// ── Amazon ────────────────────────────────────────────────────────────────────
const asins = [...new Set(amazonOffers.map(o => o.asin))]
const amazon = asins.length === 0
  ? { status: 'ok', message: null, items: new Map(), itemErrors: new Map() }
  : await fetchAmazonPrices(asins, {
      credentialId:     process.env.AMAZON_CREDENTIAL_ID,
      credentialSecret: process.env.AMAZON_CREDENTIAL_SECRET,
      version:          process.env.AMAZON_CREDENTIAL_VERSION || '3.1',
      partnerTag:       process.env.AMAZON_PARTNER_TAG || 'alginatecompa-20',
      debug:            args['debug-amazon'],
    })

if (amazon.status === 'ok') {
  for (const o of amazonOffers) {
    const item = amazon.items.get(o.asin)
    if (item) {
      Object.assign(o, { price: item.price, inStock: item.inStock, checkedAt: now })
      if (item.detailPageUrl) o.buyUrl = item.detailPageUrl
    } else {
      o.error = amazon.itemErrors.get(o.asin) ?? 'No data from Amazon'
      problems.push({ key: `offer-error:${o.key}`, message: `Amazon — ${o.productId} (${o.packSize}): ${o.error}` })
    }
  }
} else {
  // No API access: no prices (Amazon's rules), but still make sure the links work.
  if (amazon.status === 'error') problems.push({ key: 'amazon:error', message: `Amazon price lookups failed: ${amazon.message}` })
  const linkStatus = new Map()
  for (const asin of asins) linkStatus.set(asin, await checkAmazonLink(asin))
  for (const o of amazonOffers) {
    o.linkStatus = linkStatus.get(o.asin)
    if (o.linkStatus === 'dead') {
      o.error = 'Amazon listing not found (404)'
      problems.push({ key: `amazon-dead:${o.key}`, message: `Amazon — ${o.productId} (${o.packSize}): listing is gone (404). Find a replacement and update the Offers tab. ${o.url}` })
    }
  }
}

for (const o of results) {
  if (o.inStock === false) problems.push({ key: `oos:${o.key}`, message: `Out of stock: ${o.retailer} — ${o.productId} (${o.packSize}) ${o.buyUrl}` })
}

// ── Write snapshot ────────────────────────────────────────────────────────────
const snapshot = {
  generatedAt: now,
  amazon: { status: amazon.status, message: amazon.message, checkedAt: amazon.status === 'ok' ? now : null },
  products: catalog.products,
  offers: results,
  problems,
}

await mkdir(args.out, { recursive: true })
await writeFile(path.join(args.out, 'latest.json'), JSON.stringify(snapshot, null, 2) + '\n')
// The data branch has no app in it; stop Vercel from trying to deploy it.
await writeFile(path.join(args.out, 'vercel.json'), JSON.stringify({ git: { deploymentEnabled: false } }, null, 2) + '\n')
await writeFile(path.join(args.out, 'README.md'),
  '# Price data\n\nWritten automatically by `scripts/update-prices.mjs` on the `main` branch. Do not edit by hand.\n\n' +
  '- `latest.json`: the current snapshot the site reads\n- `history.csv`: price and stock changes over time (store-site prices only; Amazon prices are not stored, per Associates rules)\n')
await writeHistory()

// ── Report ────────────────────────────────────────────────────────────────────
const prevKeys = new Set((prev?.problems ?? []).map(p => p.key))
const curKeys = new Set(problems.map(p => p.key))
const added = problems.filter(p => !prevKeys.has(p.key))
const resolved = (prev?.problems ?? []).filter(p => !curKeys.has(p.key))
const amazonChange = prev && prev.amazon?.status !== amazon.status ? describeAmazonChange(prev.amazon?.status, amazon) : null

const priced = results.filter(o => o.price != null && o.checkedAt === now).length
console.log(`Checked ${results.length} offers; ${priced} priced this run. Amazon: ${amazon.status}${amazon.message ? ` (${amazon.message})` : ''}`)
for (const p of problems) console.log(`  ! ${p.message}`)
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
    `### Price check\n${results.length} offers, ${priced} priced this run. Amazon: **${amazon.status}**\n\n` +
    (problems.length ? problems.map(p => `- ${p.message}`).join('\n') : 'No problems.') + '\n')
}
if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
  await syncAlertIssue({ problems, added, resolved, amazonChange })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function readPrev(dir) {
  if (!dir) return null
  const file = path.join(dir, 'latest.json')
  if (!existsSync(file)) return null
  return JSON.parse(await readFile(file, 'utf8'))
}

async function writeHistory() {
  const out = path.join(args.out, 'history.csv')
  let rows = [HISTORY_HEADER]
  const prevFile = args.prev && path.join(args.prev, 'history.csv')
  if (prevFile && existsSync(prevFile)) rows = parseCSV(await readFile(prevFile, 'utf8'))
  for (const o of results) {
    if (o.source !== 'shopify' || o.checkedAt !== now) continue
    const last = prevOffers.get(o.key)
    if (last && last.price === o.price && last.inStock === o.inStock) continue
    rows.push([now, o.productId, o.retailer, o.packSize, o.price, o.inStock, o.url])
  }
  await writeFile(out, toCSV(rows))
}

function describeAmazonChange(before, after) {
  if (after.status === 'ok') return '🎉 Amazon prices are now live on the site (the Associates account is eligible for the Creators API).'
  if (after.status === 'not_eligible' && before === 'ok') return 'Amazon prices are paused: the account dropped below 10 qualifying sales in the last 30 days. Amazon rows now show a "Check price" button and will switch back on automatically.'
  if (after.status === 'error') return `Amazon price lookups are failing: ${after.message}`
  return null
}

async function syncAlertIssue({ problems, added, resolved, amazonChange }) {
  const repo = process.env.GITHUB_REPOSITORY
  const gh = async (method, url, body) => {
    const res = await fetch(`https://api.github.com/repos/${repo}${url}`, {
      method,
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok && !(method === 'POST' && url === '/labels' && res.status === 422)) {
      throw new Error(`GitHub ${method} ${url}: HTTP ${res.status} ${await res.text()}`)
    }
    return res.status === 204 ? null : res.json()
  }

  const LABEL = 'price-tracker'
  await gh('POST', '/labels', { name: LABEL, color: '0d9488', description: 'Automatic price checker alerts' })
  const [issue] = await gh('GET', `/issues?labels=${LABEL}&state=open&per_page=1`)

  const body = '_Kept up to date by the price checker. It closes itself when everything is fixed._\n\n' +
    (problems.length ? problems.map(p => `- [ ] ${p.message}`).join('\n') : 'Nothing needs attention.')
  const changes = [
    amazonChange,
    added.length && `**New:**\n${added.map(p => `- ${p.message}`).join('\n')}`,
    resolved.length && `**Fixed:**\n${resolved.map(p => `- ${p.message}`).join('\n')}`,
  ].filter(Boolean).join('\n\n')

  if (!issue) {
    if (!problems.length && !amazonChange) return
    const created = await gh('POST', '/issues', { title: 'Price tracker: things need attention', body: amazonChange ? `${amazonChange}\n\n${body}` : body, labels: [LABEL] })
    if (!problems.length) await gh('PATCH', `/issues/${created.number}`, { state: 'closed' })
    return
  }
  if (changes) await gh('POST', `/issues/${issue.number}/comments`, { body: changes })
  if (issue.body !== body) await gh('PATCH', `/issues/${issue.number}`, { body })
  if (!problems.length) await gh('PATCH', `/issues/${issue.number}`, { state: 'closed' })
}
