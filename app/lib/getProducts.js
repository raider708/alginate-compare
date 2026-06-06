// Fallback data — used when the sheet is unavailable or SHEET_CSV_URL is unset.
// Update these if prices change and the sheet is temporarily unreachable.
export const FALLBACK_PRODUCTS = [
  {
    id: 1, name: 'Reflux Gourmet', variant: '8 oz', form: 'liquid', origin: 'US',
    standardDosage: '5 ml / 1 tsp', algMg: 425, sodiumMg: 28, doses: 47, containerCost: 28.00, costPerDose: 0.60,
    buyLinks: [
      { label: 'Amazon',         url: 'https://amzn.to/4uWGcjq',                                       packagePrice: 28.00, costPerDose: 0.60 },
      { label: 'Reflux Gourmet', url: 'https://refluxgourmet.com/product/vanilla-caramel-rescue-dd/',  packagePrice: null,  costPerDose: null  },
    ],
    note: null, image: 'reflux-gourmet-8oz.png',
  },
  {
    id: 2, name: 'Reflux Gourmet', variant: '25 single-serve packs', form: 'liquid', origin: 'US',
    standardDosage: '5 ml / 1 tsp', algMg: 425, sodiumMg: 28, doses: 25, containerCost: 32.00, costPerDose: 1.28,
    buyLinks: [
      { label: 'Amazon',         url: 'https://amzn.to/4fpq2tY',                                         packagePrice: 32.00, costPerDose: 1.28 },
      { label: 'Reflux Gourmet', url: 'https://refluxgourmet.com/product/single-serve-multi-pack-dd/',   packagePrice: null,  costPerDose: null  },
    ],
    note: null, image: 'reflux-gourmet-single-serve.png',
  },
  {
    id: 3, name: 'Reflux Raft', variant: '8 oz', form: 'liquid', origin: 'US',
    standardDosage: '5 ml / 1 tsp', algMg: 338, sodiumMg: 28, doses: 47, containerCost: 33.00, costPerDose: 0.70,
    buyLinks: [
      { label: 'Amazon',      url: 'https://amzn.to/43RayaW',                                                              packagePrice: 33.00, costPerDose: 0.70 },
      { label: 'Reflux Raft', url: 'https://refluxraft.com/collections/frontpage/products/lemon-ginger', packagePrice: null,  costPerDose: null  },
    ],
    note: 'Discount with subscription', image: 'reflux-raft-8oz.png',
  },
  {
    id: 4, name: 'Gaviscon Advance Chewable', variant: '60 tablets', form: 'tablet', origin: 'UK import',
    standardDosage: '1 tablet', algMg: 500, sodiumMg: 53, doses: 60, containerCost: 30.00, costPerDose: 0.50,
    buyLinks: [
      { label: 'Amazon', url: 'https://amzn.to/43g01Gj', packagePrice: 30.00, costPerDose: 0.50 },
    ],
    note: 'These get really gummy when chewing', image: 'gaviscon-advance-chewable.png',
  },
  {
    id: 5, name: 'Gaviscon Advance Chewable', variant: '120 tablets (2-pack)', form: 'tablet', origin: 'UK import',
    standardDosage: '1 tablet', algMg: 500, sodiumMg: 53, doses: 120, containerCost: 50.00, costPerDose: 0.42,
    buyLinks: [
      { label: 'Amazon', url: 'https://amzn.to/4fNHCbp', packagePrice: 50.00, costPerDose: 0.42 },
    ],
    note: 'These get really gummy when chewing', image: 'gaviscon-advance-chewable.png',
  },
  {
    id: 6, name: 'Gaviscon Double Action Tablets', variant: '24 tablets', form: 'tablet', origin: 'UK import',
    standardDosage: '2 tablets', algMg: 500, sodiumMg: 106, doses: 12, containerCost: 27.00, costPerDose: 2.25,
    buyLinks: [
      { label: 'Amazon', url: 'https://amzn.to/49LftOb', packagePrice: 27.00, costPerDose: 2.25 },
    ],
    note: null, image: 'gaviscon-double-action-mint.png',
  },
  {
    id: 7, name: 'Gaviscon Double Action Liquid', variant: '150ml x 2 pack', form: 'liquid', origin: 'UK import',
    standardDosage: '10 ml / 2 tsp', algMg: 500, sodiumMg: 127, doses: 30, containerCost: 34.00, costPerDose: 1.13,
    buyLinks: [
      { label: 'Amazon',            url: 'https://amzn.to/3PItGVu',                                                                                                      packagePrice: 34.00, costPerDose: 1.13 },
      { label: 'British Essentials', url: 'https://us.britishessentials.com/products/gaviscon-double-action-liquid-heartburn-indigestion-relief-mint-500ml-copy', packagePrice: 61.79, costPerDose: 2.06 },
    ],
    note: 'Pink bottle', image: 'gaviscon-double-action-liquid.png',
  },
  {
    id: 8, name: 'Gaviscon Advance Liquid ("Gav")', variant: '500ml', form: 'liquid', origin: 'UK import',
    standardDosage: '5 ml / 1 tsp', algMg: 500, sodiumMg: 58, doses: 100, containerCost: 36.00, costPerDose: 0.36,
    buyLinks: [
      { label: 'Amazon',             url: 'https://amzn.to/4uP0IlS',                                                                                                    packagePrice: 36.00, costPerDose: 0.36 },
      { label: 'British Essentials', url: 'https://us.britishessentials.com/products/gaviscon-advance-double-strength-heartburn-indigestion-aniseed-300ml', packagePrice: 33.99, costPerDose: 0.68 },
    ],
    note: null, image: 'gaviscon-advance-liquid.png',
  },
  {
    id: 9, name: 'Gaviscon Advance Liquid ("Gav")', variant: '500ml x 2 pack', form: 'liquid', origin: 'UK import',
    standardDosage: '5 ml / 1 tsp', algMg: 500, sodiumMg: 58, doses: 200, containerCost: 67.00, costPerDose: 0.34,
    buyLinks: [
      { label: 'Amazon',             url: 'https://amzn.to/4uP0IlS',                                                                                                    packagePrice: 67.00, costPerDose: 0.34 },
      { label: 'British Essentials', url: 'https://us.britishessentials.com/products/gaviscon-advance-double-strength-heartburn-indigestion-aniseed-300ml', packagePrice: 33.99, costPerDose: 0.68 },
    ],
    note: null, image: 'gaviscon-advance-liquid.png',
  },
  {
    id: 10, name: 'HartSpan Khelp', variant: '60 capsules', form: 'tablet', origin: 'US',
    standardDosage: '2 capsules', algMg: 950, sodiumMg: 190, doses: 30, containerCost: 54.00, costPerDose: 1.80,
    buyLinks: [
      { label: 'Amazon',   url: 'https://amzn.to/4vD527X',            packagePrice: 54.00, costPerDose: 1.80 },
      { label: 'HartSpan', url: 'https://hartspan.com/products/khelp', packagePrice: null,  costPerDose: null  },
    ],
    note: 'Newest on market? Discount with subscription', image: 'hartspan-khelp.png',
  },
  {
    id: 11, name: 'Refluxter', variant: '60 capsules', form: 'tablet', origin: 'US',
    standardDosage: '2 capsules', algMg: 1000, sodiumMg: 150, doses: 30, containerCost: 30.00, costPerDose: 0.90,
    buyLinks: [
      { label: 'Amazon',   url: 'https://amzn.to/49FxoGa',                                       packagePrice: 30.00, costPerDose: 1.00 },
      { label: 'Nutritist', url: 'https://www.nutritist.us/products/refluxter-acid-reflux-support', packagePrice: 27.00, costPerDose: 0.90 },
    ],
    note: null, image: 'refluxter.png',
  },
]

// Sheet columns (0-indexed):
// 0:Name  1:Package Size  2:Form  3:Origin  4:Standard Dosage  5:Alginate mg  6:Sodium mg  7:Doses per Package
// 8:Amazon Package Price  9:Amazon Cost per dose  10:Amazon URL  11:Amazon URL affiliate link
// 12:2nd Retailer Label  13:2nd Retailer Package Price  14:2nd Retailer Cost Per Dose  15:2nd Retailer URL
// 16:Image  17:Note
function parseSheet(csv) {
  const [headerLine, ...dataLines] = csv.trim().split('\n')
  const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase())

  // Bail out if the sheet hasn't been migrated to the current schema yet
  if (headers[0] !== 'name' || headers[1] !== 'package size' || headers[6] !== 'sodium mg') return null
  if (dataLines.length === 0) return null

  return dataLines.map((line, i) => {
    const c = parseCSVLine(line)

    const amazonPackagePrice = parseFloat((c[8]  ?? '').replace(/[$,]/g, '')) || 0
    const amazonCostPerDose  = parseFloat((c[9]  ?? '').replace(/[$,]/g, '')) || 0
    // Use affiliate link (col 11) if available, fall back to plain Amazon URL (col 10)
    const amazonUrl          = (c[11] ?? '').trim() || (c[10] ?? '').trim()

    const buy2Label        = (c[12] ?? '').trim()
    const buy2PackagePrice = parseFloat((c[13] ?? '').replace(/[$,]/g, '')) || 0
    const buy2CostPerDose  = parseFloat((c[14] ?? '').replace(/[$,]/g, '')) || 0
    const buy2Url          = (c[15] ?? '').trim()

    // Product-level $/dose = best available price across all retailers (used for sorting)
    const bestCostPerDose = (buy2CostPerDose > 0)
      ? Math.min(amazonCostPerDose, buy2CostPerDose)
      : amazonCostPerDose

    return {
      id: i + 1,
      name:           (c[0] ?? '').trim(),
      variant:        (c[1] ?? '').trim(),
      form:           (c[2] ?? '').trim(),
      origin:         (c[3] ?? '').trim(),
      standardDosage: (c[4] ?? '').trim() || null,
      algMg:          parseInt((c[5]  ?? '').replace(/[^0-9]/g, ''), 10) || 0,
      sodiumMg:       parseInt((c[6]  ?? '').replace(/[^0-9]/g, ''), 10) || 0,
      doses:          parseInt((c[7]  ?? '').replace(/[^0-9]/g, ''), 10) || 0,
      containerCost:  amazonPackagePrice,
      costPerDose:    bestCostPerDose,
      buyLinks: [
        amazonUrl && {
          label: 'Amazon',
          url: amazonUrl,
          packagePrice: amazonPackagePrice,
          costPerDose: amazonCostPerDose,
        },
        buy2Label && buy2Url && {
          label: buy2Label,
          url: buy2Url,
          packagePrice: buy2PackagePrice || null,
          costPerDose:  buy2CostPerDose  || null,
        },
      ].filter(Boolean),
      note:  (c[17] ?? '').trim() || null,
      image: (c[16] ?? '').trim() || null,
    }
  })
}

// RFC 4180-compliant CSV line parser — handles "" escaped quotes inside quoted fields
function parseCSVLine(line) {
  const cells = []
  let cur = ''
  let inQuotes = false
  let i = 0
  while (i < line.length) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'  // escaped double-quote → single literal "
          i += 2
          continue
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        cells.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
    i++
  }
  cells.push(cur)
  return cells
}

export async function getProducts() {
  const url = process.env.SHEET_CSV_URL
  if (!url) return FALLBACK_PRODUCTS

  try {
    const fetchOpts = process.env.NODE_ENV === 'development'
      ? { cache: 'no-store' }
      : { next: { revalidate: 3600 } }
    const res = await fetch(url, fetchOpts)
    if (!res.ok) return FALLBACK_PRODUCTS
    const csv = await res.text()
    return parseSheet(csv) ?? FALLBACK_PRODUCTS
  } catch {
    return FALLBACK_PRODUCTS
  }
}
