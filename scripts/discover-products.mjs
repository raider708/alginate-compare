#!/usr/bin/env node
// Weekly: asks Claude to search the web for sodium alginate reflux products sold to US
// buyers that aren't on the site yet, and appends them to candidates.csv on the `data`
// branch. The sheet's Candidates tab displays that file (IMPORTDATA). Nothing reaches the
// site until a product is added to the Products/Offers tabs by hand.
//
// Runs in .github/workflows/discover-products.yml. Locally:
//   ANTHROPIC_API_KEY=... node scripts/discover-products.mjs --out /tmp/disc \
//     --products data/seed/products.csv --offers data/seed/offers.csv
//
// Options:
//   --out <dir>               where to write candidates.csv (required)
//   --prev <dir>              previous data-branch files (candidates.csv, latest.json), for de-duplication
//   --products / --offers     catalog sources, as in update-prices.mjs
//   --max-searches <n>        web searches Claude may run (default 12)
//   --candidates-json <file>  skip Claude and post-process this JSON instead (for testing)

import Anthropic from '@anthropic-ai/sdk'
import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { loadCatalog, isAmazonUrl } from './lib/catalog.mjs'
import { parseCSV, toCSV } from './lib/csv.mjs'
import { fetchShopifyOffer, shopifyJsonUrl } from './lib/shopify.mjs'
import { resolveAsin } from './lib/amazon.mjs'
import { hasGitHub, gh, ensureLabel } from './lib/github.mjs'

const MODEL = 'claude-opus-5-5'
const BETAS = ['server-side-fallback-2026-07-01']   // re-runs a declined request on Anthropic's recommended fallback model
const MAX_NEW_PER_RUN = 15
const HEADER = ['Found', 'Name', 'Retailer', 'URL', 'Price', 'Pack Size', 'Alginate mg per dose', 'Why flagged']

// ── Prompts and schema ───────────────────────────────────────────────────────
const RESEARCH_SYSTEM = `You research products for alginatecompare.com, a price comparison site for people who use sodium alginate to manage acid reflux and LPR (silent reflux). Sodium alginate (or alginic acid with a bicarbonate) forms a gel "raft" on top of stomach contents. The site helps US readers find the cheapest place to buy it.

Search the web for products that a US buyer can order online and that the site doesn't list yet. Two kinds of finds count:
1. New products whose active ingredient is sodium alginate, potassium alginate, or alginic acid as a raft-former, in any form (liquid, chewable, capsule, powder, sachet). Include US brands, UK and EU imports sold to the US (for example Gaviscon Advance, Gaviscon Double Action, Peptac, Acidex), and supplements.
2. New stores or pack sizes for products already listed, when they might be cheaper than what is listed.

Exclude:
- Products where alginate is only an inactive ingredient. US Gaviscon (aluminum hydroxide and magnesium carbonate as actives) is the main example.
- Stores that don't ship to the US, listings that are clearly out of stock or discontinued, and marketplace listings that look counterfeit or relabeled.
- Anything you can't find a working product page for.

Check the product page or label for the alginate amount per dose rather than guessing. If a page doesn't state it, say so. Prefer a store's own product page over a search results page. Finding nothing new is a fine result; don't pad the list.`

const CANDIDATES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['candidates'],
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'kind', 'retailer', 'url', 'price_usd', 'pack_size', 'doses_per_pack', 'alginate_mg_per_dose', 'evidence', 'why', 'confidence'],
        properties: {
          name:                 { type: 'string', description: 'Brand and product name' },
          kind:                 { type: 'string', enum: ['new_product', 'new_store'] },
          retailer:             { type: 'string' },
          url:                  { type: 'string', description: 'Product page URL' },
          price_usd:            { type: ['number', 'null'] },
          pack_size:            { type: 'string' },
          doses_per_pack:       { type: ['integer', 'null'] },
          alginate_mg_per_dose: { type: ['number', 'null'] },
          evidence:             { type: 'string', description: 'Where the alginate amount comes from (label text or page URL), or "not stated"' },
          why:                  { type: 'string', description: 'One sentence on why it belongs on the site' },
          confidence:           { type: 'string', enum: ['high', 'medium', 'low'] },
        },
      },
    },
  },
}

const { values: args } = parseArgs({
  options: {
    out:               { type: 'string' },
    prev:              { type: 'string' },
    products:          { type: 'string', default: process.env.SHEET_PRODUCTS_CSV_URL || 'data/seed/products.csv' },
    offers:            { type: 'string', default: process.env.SHEET_OFFERS_CSV_URL || 'data/seed/offers.csv' },
    'max-searches':    { type: 'string', default: '12' },
    'candidates-json': { type: 'string' },
  },
})
if (!args.out) throw new Error('--out is required')

const today = new Date().toISOString().slice(0, 10)

// ── What we already know ─────────────────────────────────────────────────────
let catalog
try { catalog = await loadCatalog({ productsSource: args.products, offersSource: args.offers }) }
catch (e) {
  console.warn(`Couldn't read the sheet (${e.message}); using data/seed`)
  catalog = await loadCatalog({ productsSource: 'data/seed/products.csv', offersSource: 'data/seed/offers.csv' })
}
const prevSnapshot = await readJson(args.prev && path.join(args.prev, 'latest.json'))
const prevRows = await readCandidateRows(args.prev && path.join(args.prev, 'candidates.csv'))

// ASINs for the catalog's short Amazon links come from the price checker's last run.
const asinByUrl = new Map((prevSnapshot?.offers ?? []).filter(o => o.asin).map(o => [o.url, o.asin]))
const knownKeys = new Set()
for (const o of catalog.offers) knownKeys.add(listingKey(o.url, asinByUrl.get(o.url)))
for (const r of prevRows) knownKeys.add(listingKey(r[3]))

// ── Ask Claude ───────────────────────────────────────────────────────────────
const usage = { input: 0, output: 0, cacheRead: 0, searches: 0, fetches: 0 }
const skipped = !args['candidates-json'] && !process.env.ANTHROPIC_API_KEY
if (skipped) console.warn('ANTHROPIC_API_KEY is not set, so the web search was skipped. Add it as a GitHub secret to turn discovery on.')
const found = args['candidates-json']
  ? JSON.parse(await readFile(args['candidates-json'], 'utf8')).candidates
  : skipped ? [] : await askClaude()

// ── Filter, verify, append ───────────────────────────────────────────────────
const newRows = []
for (const c of found) {
  if (newRows.length >= MAX_NEW_PER_RUN) break
  if (!c.url || !/^https?:\/\//.test(c.url)) continue
  const asin = isAmazonUrl(c.url) ? await resolveAsin(c.url).catch(() => null) : null
  const key = listingKey(c.url, asin)
  if (knownKeys.has(key)) continue
  knownKeys.add(key)

  const check = await verifyListing(c.url)
  if (check.dead) { console.log(`  skip (dead link): ${c.name} ${c.url}`); continue }
  // Amazon prices may only be stored/shown when they come from Amazon's API.
  const price = asin || isAmazonUrl(c.url) ? null : (check.price ?? c.price_usd)
  newRows.push([
    today,
    c.name,
    c.retailer,
    asin ? `https://www.amazon.com/dp/${asin}` : c.url,
    price != null ? `$${Number(price).toFixed(2)}` : '',
    c.doses_per_pack ? `${c.pack_size} (${c.doses_per_pack} doses)` : c.pack_size,
    c.alginate_mg_per_dose ?? '',
    `${c.kind === 'new_store' ? 'New store for a product already listed' : 'New product'}. ${c.why} Evidence: ${c.evidence} (${c.confidence} confidence${check.inStock === false ? ', currently out of stock' : ''})`,
  ])
}

await mkdir(args.out, { recursive: true })
await writeFile(path.join(args.out, 'candidates.csv'), toCSV([HEADER, ...prevRows, ...newRows]))

const summary = skipped ? 'Search skipped: ANTHROPIC_API_KEY secret not set.' :
  `${found.length} found, ${newRows.length} new after removing ones already listed or suggested.` +
  (args['candidates-json'] ? '' : ` Claude usage: ${usage.input} input + ${usage.output} output tokens (${usage.cacheRead} cached), ${usage.searches} searches, ${usage.fetches} page fetches.`)
console.log(summary)
for (const r of newRows) console.log(`  + ${r[1]} — ${r[2]} ${r[3]}`)
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Product discovery\n${summary}\n\n${newRows.map(r => `- ${r[1]} (${r[2]}) ${r[3]}`).join('\n')}\n`)
}
if (hasGitHub() && newRows.length) await announce(newRows)

// ── Claude ───────────────────────────────────────────────────────────────────
async function askClaude() {
  const client = new Anthropic()

  const known = catalog.products.map(p => {
    const offers = catalog.offers.filter(o => o.productId === p.id).map(o => `${o.retailer} ${o.packSize}`)
    return `- ${p.name} (${p.algMg} mg alginate per dose): ${offers.join('; ')}`
  }).join('\n')
  const alreadySuggested = prevRows.map(r => `- ${r[1]} — ${r[2]} ${r[3]}`).join('\n') || '(none yet)'

  // Step 1: research with web search. Free text, since search results come back with
  // citations, and citations can't be combined with structured output.
  const messages = [{
    role: 'user',
    content:
      `Today is ${today}. These products are already on the site, with the stores and pack sizes listed:\n${known}\n\n` +
      `These were suggested in earlier weeks; don't repeat them:\n${alreadySuggested}\n\n` +
      'Find what is missing. Report each find with: product name, brand, store, product page URL, current price in USD if shown, ' +
      'pack size, doses per pack, sodium alginate (or alginic acid) mg per dose, the label text or page that states the alginate amount, ' +
      'and whether it is a new product or a new store/pack size for a product already listed.',
  }]
  let response
  const transcript = []
  for (let turn = 0; turn < 6; turn++) {
    response = await client.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      betas: BETAS,
      fallbacks: 'default',
      cache_control: { type: 'ephemeral' },        // pause_turn continuations resend the same prefix
      output_config: { effort: 'medium' },
      system: RESEARCH_SYSTEM,
      tools: [
        { type: 'web_search_20260209', name: 'web_search', max_uses: Number(args['max-searches']), user_location: { type: 'approximate', country: 'US' } },
        { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 10 },
      ],
      messages,
    }).finalMessage()
    tally(response.usage)
    transcript.push(...response.content)
    if (response.stop_reason !== 'pause_turn') break
    messages.push({ role: 'assistant', content: response.content })
  }
  if (response.stop_reason === 'refusal') throw new Error(`Research request declined (${response.stop_details?.category ?? 'no category'})`)

  // Keep the cited source URLs with the text so step 2 can use them as evidence.
  const report = transcript.filter(b => b.type === 'text').map(b => {
    const urls = [...new Set((b.citations ?? []).map(c => c.url).filter(Boolean))]
    return urls.length ? `${b.text} [sources: ${urls.join(', ')}]` : b.text
  }).join('')
  if (!report.trim()) throw new Error(`Research returned no text (stop_reason: ${response.stop_reason})`)

  // Step 2: turn the report into rows. No tools, schema-constrained output.
  const extraction = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: BETAS,
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: CANDIDATES_SCHEMA } },
    messages: [{
      role: 'user',
      content: 'Extract every product listing from this research report. Use only what the report states; use null for a number it doesn\'t give. ' +
        'Skip anything the report says to exclude.\n\n<report>\n' + report + '\n</report>',
    }],
  })
  tally(extraction.usage)
  if (extraction.stop_reason === 'refusal') throw new Error('Extraction request declined')
  const json = extraction.content.find(b => b.type === 'text')?.text
  if (!json) throw new Error(`Extraction returned no JSON (stop_reason: ${extraction.stop_reason})`)
  return JSON.parse(json).candidates
}

function tally(u) {
  usage.input += u.input_tokens ?? 0
  usage.output += u.output_tokens ?? 0
  usage.cacheRead += u.cache_read_input_tokens ?? 0
  usage.searches += u.server_tool_use?.web_search_requests ?? 0
  usage.fetches += u.server_tool_use?.web_fetch_requests ?? 0
}

// ── Helpers ──────────────────────────────────────────────────────────────────
// Two links point at the same listing if they share an ASIN, or the same host + path
// (ignoring query strings, "www.", and Shopify's /collections/<x>/ prefix).
function listingKey(url, asin) {
  try {
    if (!asin) asin = url.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i)?.[1]
    if (asin) return `amazon:${asin.toUpperCase()}`
    const u = new URL(url)
    const p = u.pathname.replace(/\/collections\/[^/]+(?=\/products\/)/, '').replace(/\/+$/, '')
    return `${u.hostname.replace(/^www\./, '').toLowerCase()}${p.toLowerCase()}`
  } catch {
    return url
  }
}

// Drops links that 404; reads the real price from Shopify stores. Amazon blocks
// automated checks, so Amazon links are kept as-is.
async function verifyListing(url) {
  if (isAmazonUrl(url)) return {}
  if (shopifyJsonUrl(url)) {
    try {
      const s = await fetchShopifyOffer({ url })
      if (s.supported) return { price: s.price, inStock: s.inStock }
    } catch (e) {
      if (/404/.test(e.message)) return { dead: true }
    }
  }
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15_000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AlginateCompareBot/1.0; +https://alginatecompare.com)' } })
    return { dead: res.status === 404 || res.status === 410 }
  } catch {
    return {}
  }
}

async function announce(rows) {
  const LABEL = 'product-discovery'
  await ensureLabel(LABEL, '7c3aed', 'Possible new products found by the weekly search')
  // One open issue at a time: the newest week replaces the last one.
  for (const old of await gh('GET', `/issues?labels=${LABEL}&state=open&per_page=20`)) {
    await gh('PATCH', `/issues/${old.number}`, { state: 'closed', state_reason: 'not_planned' })
  }
  const sheet = process.env.SHEET_EDIT_URL ? `[Candidates tab](${process.env.SHEET_EDIT_URL})` : 'Candidates tab of the sheet'
  await gh('POST', '/issues', {
    title: `${rows.length} possible new product${rows.length === 1 ? '' : 's'} (${today})`,
    labels: [LABEL],
    body: `The weekly search found these. They're on the ${sheet}; mark each one Approve or Reject there. ` +
      'To list one on the site, add it to the Products and Offers tabs (or ask Claude to).\n\n' +
      rows.map(r => `- **${r[1]}**, ${r[2]}${r[4] ? `, ${r[4]}` : ''}${r[6] !== '' ? `, ${r[6]} mg alginate per dose` : ''}\n  ${r[3]}`).join('\n'),
  })
}

async function readJson(file) {
  if (!file || !existsSync(file)) return null
  return JSON.parse(await readFile(file, 'utf8'))
}

async function readCandidateRows(file) {
  if (!file || !existsSync(file)) return []
  const [, ...rows] = parseCSV(await readFile(file, 'utf8'))
  return rows
}
