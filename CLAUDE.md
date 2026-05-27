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

Currently **hardcoded** in `app/components/ProductTable.js`. Sourced from the user's Google Sheet:
`https://docs.google.com/spreadsheets/d/1ogEg7jDV9SxR-rJUzMAjxbAuohxTVUNFlymoKtBse30`

**Phase 2 goal:** Switch to Google Sheets API (read-only, ISR revalidation every 24h) so the user can update prices in the spreadsheet and the site auto-reflects them. This requires making the sheet publicly viewable and getting a Google API key.

---

## Data model (per product in ProductTable.js)

```js
{
  id, name, variant, form,          // form: 'liquid' | 'tablet'
  origin,                            // 'US' | 'UK import'
  containerCost, doseDescription,
  standardDosage,                    // null — user will fill from product docs
  algMg, doses, costPerDose,
  buyLinks: [{ label, url }],        // supports multiple retailers
  productUrl,                        // null — user will fill in manufacturer URLs
  image,                             // null — filename in /public/images/ when added
}
```

Fields still needing population:
- `standardDosage` — from each product's official documentation
- `productUrl` — manufacturer/brand website for each product
- `image` — product photo filename; drop JPG/PNG into `/public/images/` and set filename

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

### 2. Google Sheets as live CMS
Replace hardcoded data with a fetch from the Sheets API v4.
- Make sheet publicly viewable (share → anyone with link → viewer)
- Get Google Cloud API key with Sheets API enabled
- Fetch in a server component: `https://sheets.googleapis.com/v4/spreadsheets/{ID}/values/Sheet1?key={KEY}`
- Use `export const revalidate = 86400` for daily refresh
- Spreadsheet columns to add: `Standard Dosage`, `Buy URL 2`, `Buy Label 2`, `Product URL`, `Image Filename`

### 3. Product images
Drop product photos (400×400px PNG/JPG) into `/public/images/` and set each product's `image` field to the filename. Next.js `<Image>` component is already wired up.

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

---

## GitHub

`https://github.com/raider708/alginate-compare`

---

## Dev workflow

- `npm run dev` starts at `localhost:3000` (or 3003 if 3000/3001/3002 are busy)
- All data is in `app/components/ProductTable.js` until Sheets API is wired up
- Images go in `public/images/`
