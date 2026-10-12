import { readFile } from 'node:fs/promises'
import { parseCSVObjects } from './csv.mjs'

// A source is either a published-CSV URL or a local file path.
async function readSource(source) {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source)
    // An unpublished tab answers 401/403, or with Google's sign-in page instead of CSV.
    if (res.status === 401 || res.status === 403 || (res.ok && (res.headers.get('content-type') ?? '').includes('text/html'))) {
      throw new Error('a sheet tab isn\'t published as CSV. In the sheet: File → Share → Publish to web → include the Products and Offers tabs')
    }
    if (!res.ok) throw new Error(`Could not fetch ${source}: HTTP ${res.status}`)
    return res.text()
  }
  return readFile(source, 'utf8')
}

const toInt = v => parseInt(String(v ?? '').replace(/[^0-9]/g, ''), 10) || 0

export async function loadCatalog({ productsSource, offersSource }) {
  const [productRows, offerRows] = await Promise.all([readSource(productsSource), readSource(offersSource)])
  const problems = []

  const products = parseCSVObjects(productRows)
    .filter(r => r['ID'])
    .map(r => ({
      id:             r['ID'],
      name:           r['Name'],
      form:           r['Form'].toLowerCase(),
      origin:         r['Origin'],
      standardDosage: r['Standard Dosage'] || null,
      algMg:          toInt(r['Alginate mg']),
      sodiumMg:       toInt(r['Sodium mg']),
      image:          r['Image'] || null,
      note:           r['Note'] || null,
    }))

  if (products.length === 0) throw new Error('Products tab is empty or has unexpected headers (need an "ID" column)')

  const ids = new Set(products.map(p => p.id))
  const offers = []
  for (const r of parseCSVObjects(offerRows)) {
    if (!r['URL']) continue
    const offer = {
      productId: r['Product ID'],
      retailer:  r['Retailer'],
      packSize:  r['Pack Size'],
      doses:     toInt(r['Doses']),
      url:       r['URL'],
      variant:   r['Variant'] || null,
    }
    if (!ids.has(offer.productId)) {
      problems.push({ key: `catalog:unknown-product:${offer.url}`, message: `Offers tab: "${offer.productId}" isn't an ID on the Products tab (${offer.retailer}, ${offer.packSize})` })
      continue
    }
    if (!offer.doses) {
      problems.push({ key: `catalog:no-doses:${offer.url}`, message: `Offers tab: missing "Doses" for ${offer.productId} at ${offer.retailer} (${offer.packSize}), so its cost per dose can't be worked out` })
    }
    offers.push(offer)
  }

  return { products, offers, problems }
}

export const isAmazonUrl = url => /(^|\.)(amazon\.com|amzn\.to|a\.co)$/i.test(new URL(url).hostname)

// Offers are matched across runs by URL + variant, since that's what identifies a listing.
export const offerKey = o => `${o.url}#${o.variant ?? ''}`
