# Alginate Compare — Project Brief

## What this is

A public-facing price comparison site for sodium alginate reflux medications available in the US. Sodium alginate is the active ingredient in UK Gaviscon (not US Gaviscon) and a few small US brands. It forms a physical "raft" on stomach contents to prevent acid reflux — a different mechanism from typical US antacids.

The site earns affiliate commission by linking to Amazon (and eventually other retailers). SEO and AI citation are the main traffic strategies.

**Full plan file:** `~/.claude/plans/i-want-to-create-goofy-emerson.md`

---

## Tech stack

- **Next.js 16.2.4** with React 19 — see note below about breaking changes
- **Tailwind CSS v4** — `@import "tailwindcss"` only, no config file
- **JavaScript** (not TypeScript)
- App Router, no `src/` directory
- Deployed to **Vercel** (not yet set up — user doesn't have a Vercel account yet)

⚠️ This version of Next.js has breaking changes. Read `node_modules/next/dist/docs/` before writing unfamiliar APIs.

---

## Data source

**Live:** Google Sheet published CSV, fetched server-side (ISR, revalidated every hour).
Sheet: `https://docs.google.com/spreadsheets/d/1ogEg7jDV9SxR-rJUzMAjxbAuohxTVUNFlymoKtBse30`
CSV URL stored in `.env.local` as `SHEET_CSV_URL`.

Fetching logic is in `app/lib/getProducts.js`. If the sheet is unreachable or `SHEET_CSV_URL` is unset, the app falls back to hardcoded data in `FALLBACK_PRODUCTS`. Add/edit rows in the sheet and the site reflects them within an hour (instant in dev with `cache: 'no-store'`).

---

## Data model (per product in ProductTable.js)

```js
{
  id, name, variant, form,           // form: 'liquid' | 'tablet'
  origin,                             // 'US' | 'UK import'
  containerCost,                      // Amazon package price
  standardDosage,                     // e.g. "5ml", "2 tablets" — from product docs
  algMg, doses,
  costPerDose,                        // BEST price across all retailers (used for sorting)
  buyLinks: [{ label, url, packagePrice, costPerDose }],  // per-retailer; packagePrice/costPerDose null if not yet known
  note,                               // freeform editorial note shown on the site
  image,                              // filename in /public/images/
}
```

**Live data source:** Google Sheet published CSV, fetched server-side, revalidated every hour.
Sheet columns (0-indexed):
- 0:Name, 1:Package Size, 2:Form, 3:Origin, 4:Standard Dosage, 5:Alginate mg, 6:Sodium mg, 7:Doses per Package
- 8:Amazon Package Price, 9:Amazon Cost per dose, 10:Amazon URL
- 11:2nd Retailer Label, 12:2nd Retailer Package Price, 13:2nd Retailer Cost Per Dose, 14:2nd Retailer URL
- 15:Image, 16:Note

Fields still needing population:
- `standardDosage` — still null for Reflux Raft and Gaviscon Double Action Liquid
- `packagePrice` / `costPerDose` on 2nd retailer buyLinks — where product site prices are known

---

## Products tracked (8 total)

| Brand | Variant | Origin | $/dose |
|---|---|---|---|
| Reflux Gourmet | 8 oz liquid | US | $0.60 |
| Reflux Gourmet | Single-serve packs | US | $1.28 |
| Reflux Raft | 8 oz liquid | US | $0.70 |
| Gaviscon Advance Chewable | 60 ct | UK import | $0.37 |
| Gaviscon Advance Chewable | 120 ct (2-pack) | UK import | **$0.25** ← cheapest |
| Gaviscon Double Action Mint | 48 ct tablets | UK import | $0.50 |
| Gaviscon Double Action Liquid | 600ml | UK import | $0.86 |
| Gaviscon Advance Liquid | 1000ml (2-pack) | UK import | $0.71 |

---

## What's built

- Comparison table: sortable by $/dose (default), alginate/dose, container price, doses
- Filter pills: All / Liquid / Chewable tablet
- Responsive: full columns on desktop, Product + $/dose + Buy on mobile
- Product image thumbnails (shows initials placeholder until real images added)
- Multiple buy links per product (stacked buttons)
- "Product site ↗" link per product (when `productUrl` is set)
- Standard dosage sub-line in Form column (when `standardDosage` is set)
- SEO intro copy explaining sodium alginate and the US Gaviscon difference
- "Best value" badge on cheapest $/dose row

---

## What's not built yet (priority order)

### 1. Vercel deployment + custom domain
User doesn't have a Vercel account yet. Steps:
1. Sign up at vercel.com with GitHub
2. Import `raider708/alginate-compare` repo
3. Deploy (auto, zero config needed)
4. Add custom domain — leaning toward `alginatecompare.com`, checking availability

### 2. ~~Google Sheets as live CMS~~ ✅ DONE
Published CSV approach — no API key needed. See `app/lib/getProducts.js`.

### 3. ~~Product images~~ ✅ DONE
7 products have transparent PNG images in `/public/images/` at full, 500px, and 48px sizes, generated via rembg AI background removal. Script at `/tmp/process_images.py`.

### 4. Populate missing data fields
- `standardDosage` — from product documentation
- `productUrl` — manufacturer websites
- Additional `buyLinks` entries beyond Amazon (iHerb, etc.)

### 5. Amazon Associates affiliate account
Apply once the site has content indexed and some traffic. Health/personal care pays 1–4% commission. Requires 3 qualifying sales within 180 days of approval.

### 6. SEO content expansion
- Each product gets a short written blurb/review
- Structured data: Product schema markup
- XML sitemap

### 7. Blog / content section
Simple editorial section for SEO and AI citation. MDX files in `/content/posts/` are the likely approach — write in Markdown, supports images, no external CMS needed, renders via Next.js App Router. Each post gets a slug-based URL (`/blog/[slug]`). No Sanity or other headless CMS required.

### 8. Product notes / comment field
A per-product freeform text field visible on the site — useful for caveats, sourcing notes, import warnings, etc. Add a `Notes` column (col O, shifting Image to col P) to the sheet and wire it into the data model and table UI.

### 9. Multi-retailer pricing design problem
When a product has buy links from more than one retailer (e.g. Amazon + BritishEssentials), the prices will often differ. The current data model stores one `containerCost` and `costPerDose`, and the $/dose column reflects that single figure. This breaks down once secondary retailer prices are added.

**Example:** Gaviscon Advance Liquid 300ml is ~$33.99 on BritishEssentials.com, which yields a different $/dose than the Amazon 1000ml 2-pack at $71.

**Design options to evaluate:**

1. **Per-button price label (recommended starting point)** — Extend `buyLinks` to `[{ label, url, price? }]`. Show the price inline on each buy button (e.g. "Amazon $0.71 →", "BritishEssentials $0.52 →"). The $/dose column shows the lowest available price across all linked retailers. Simple to implement, fully transparent.

2. **Price range in $/dose column** — Display "from $0.52" or "$0.52–$0.71" when multiple prices exist. Clean for scanning; loses per-retailer detail in the table view.

3. **Keep $/dose as primary price only** — Amazon (or whichever link is first) is always the canonical price. Secondary buttons are labeled "Also available" with no price comparison implied. Simplest; least informative.

4. **Separate row per retailer** — Each retailer listing gets its own table row. Maximally transparent but balloons the table and creates confusing duplicates for the same product.

**Data model change needed for option 1:**
```js
// Sheet columns to add: Buy 1 Price, Buy 2 Price
buyLinks: [{ label, url, price? }]   // price is optional $/dose override
```
The `costPerDose` field would become `Math.min(...buyLinks.map(l => l.price ?? containerCost / doses))`.

---

## GitHub

`https://github.com/raider708/alginate-compare`

---

## Dev workflow

- `npm run dev` starts at `localhost:3000` (or 3003 if 3000/3001/3002 are busy)
- All data is in `app/components/ProductTable.js` until Sheets API is wired up
- Images go in `public/images/`
