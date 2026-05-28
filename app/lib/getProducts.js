// Fallback data — used when the sheet is unavailable or SHEET_CSV_URL is unset.
// Update these if prices change and the sheet is temporarily unreachable.
export const FALLBACK_PRODUCTS = [
  {
    id: 1, name: 'Reflux Gourmet', variant: '8 oz', form: 'liquid', origin: 'US',
    standardDosage: '5ml', algMg: 425, sodiumMg: 28, doses: 47, containerCost: 28.00, costPerDose: 0.60,
    buyLinks: [
      { label: 'Amazon',         url: 'https://a.co/d/0cfw6PVa',                                       packagePrice: 28.00, costPerDose: 0.60 },
      { label: 'Reflux Gourmet', url: 'https://refluxgourmet.com/product/vanilla-caramel-rescue-dd/',  packagePrice: null,  costPerDose: null  },
    ],
    note: null, image: 'reflux-gourmet-8oz.png',
  },
  {
    id: 2, name: 'Reflux Gourmet', variant: '25 single-serve packs', form: 'liquid', origin: 'US',
    standardDosage: '5ml', algMg: 425, sodiumMg: 0, doses: 25, containerCost: 32.00, costPerDose: 1.28,
    buyLinks: [
      { label: 'Amazon',         url: 'https://a.co/d/bnGGaDH',                                          packagePrice: 32.00, costPerDose: 1.28 },
      { label: 'Reflux Gourmet', url: 'https://refluxgourmet.com/product/single-serve-multi-pack-dd/',   packagePrice: null,  costPerDose: null  },
    ],
    note: null, image: 'reflux-gourmet-single-serve.png',
  },
  {
    id: 3, name: 'Reflux Raft', variant: '8 oz', form: 'liquid', origin: 'US',
    standardDosage: null, algMg: 245, sodiumMg: 0, doses: 47, containerCost: 33.00, costPerDose: 0.70,
    buyLinks: [
      { label: 'Amazon',      url: 'https://a.co/d/7TYqIHg',                                                               packagePrice: 33.00, costPerDose: 0.70 },
      { label: 'Reflux Raft', url: 'https://refluxraft.com/collections/frontpage/products/lemon-ginger', packagePrice: null,  costPerDose: null  },
    ],
    note: null, image: 'reflux-raft-8oz.png',
  },
  {
    id: 4, name: 'Gaviscon Advance Chewable', variant: '60 tablets', form: 'tablet', origin: 'UK import',
    standardDosage: '2 tablets', algMg: 500, sodiumMg: 0, doses: 60, containerCost: 19.00, costPerDose: 0.32,
    buyLinks: [
      { label: 'Amazon', url: 'https://a.co/d/cdQMvXD', packagePrice: 19.00, costPerDose: 0.32 },
    ],
    note: null, image: 'gaviscon-advance-chewable.png',
  },
  {
    id: 5, name: 'Gaviscon Advance Chewable', variant: '120 tablets (2-pack)', form: 'tablet', origin: 'UK import',
    standardDosage: '2 tablets', algMg: 500, sodiumMg: 0, doses: 120, containerCost: 29.49, costPerDose: 0.25,
    buyLinks: [
      { label: 'Amazon', url: 'https://a.co/d/cdQMvXD', packagePrice: 29.49, costPerDose: 0.25 },
    ],
    note: null, image: 'gaviscon-advance-chewable.png',
  },
  {
    id: 6, name: 'Gaviscon Double Action Mint', variant: '48 tablets', form: 'tablet', origin: 'UK import',
    standardDosage: '2 tablets', algMg: 500, sodiumMg: 0, doses: 24, containerCost: 12.00, costPerDose: 0.50,
    buyLinks: [
      { label: 'Amazon', url: 'https://a.co/d/5wzAVE6', packagePrice: 12.00, costPerDose: 0.50 },
    ],
    note: null, image: 'gaviscon-double-action-mint.png',
  },
  {
    id: 7, name: 'Gaviscon Double Action Liquid', variant: '600ml', form: 'liquid', origin: 'UK import',
    standardDosage: null, algMg: 500, sodiumMg: 0, doses: 60, containerCost: 52.00, costPerDose: 0.87,
    buyLinks: [
      { label: 'Amazon', url: 'https://a.co/d/dpRogZa', packagePrice: 52.00, costPerDose: 0.87 },
    ],
    note: null, image: 'gaviscon-double-action-liquid.png',
  },
  {
    id: 8, name: 'Gaviscon Advance Liquid ("Gav")', variant: '500ml', form: 'liquid', origin: 'UK import',
    standardDosage: '5ml', algMg: 500, sodiumMg: 0, doses: 100, containerCost: 35.99, costPerDose: 0.36,
    buyLinks: [
      { label: 'Amazon', url: 'https://a.co/d/08IB9kWQ', packagePrice: 35.99, costPerDose: 0.36 },
    ],
    note: null, image: 'gaviscon-advance-liquid.png',
  },
  {
    id: 9, name: 'HartSpan Khelp', variant: '60 capsules', form: 'tablet', origin: 'US',
    standardDosage: '2 tablets', algMg: 950, sodiumMg: 0, doses: 30, containerCost: 54.00, costPerDose: 1.80,
    buyLinks: [
      { label: 'Amazon',   url: 'https://a.co/d/0dsveMM3',            packagePrice: 54.00, costPerDose: 1.80 },
      { label: 'HartSpan', url: 'https://hartspan.com/products/khelp', packagePrice: null,  costPerDose: null  },
    ],
    note: null, image: null,
  },
]

// Sheet columns (0-indexed):
// 0:Name  1:Package Size  2:Form  3:Origin  4:Standard Dosage  5:Alginate mg  6:Sodium mg  7:Doses per Package
// 8:Amazon Package Price  9:Amazon Cost per dose  10:Amazon URL
// 11:2nd Retailer Label  12:2nd Retailer Package Price  13:2nd Retailer Cost Per Dose  14:2nd Retailer URL
// 15:Image  16:Note
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
    const amazonUrl          = (c[10] ?? '').trim()

    const buy2Label        = (c[11] ?? '').trim()
    const buy2PackagePrice = parseFloat((c[12] ?? '').replace(/[$,]/g, '')) || 0
    const buy2CostPerDose  = parseFloat((c[13] ?? '').replace(/[$,]/g, '')) || 0
    const buy2Url          = (c[14] ?? '').trim()

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
      note:  (c[16] ?? '').trim() || null,
      image: (c[15] ?? '').trim() || null,
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
