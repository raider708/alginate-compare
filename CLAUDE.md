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
- Deployed to **Vercel**, live at **alginatecompare.com** (registered on Cloudflare, DNS auto-configured via Vercel integration)

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
- `packagePrice` / `costPerDose` on 2nd retailer buyLinks for products where site prices are unknown

---

## Products tracked (9 total)

| Brand | Variant | Origin | $/dose |
|---|---|---|---|
| Reflux Gourmet | 8 oz liquid | US | $0.60 |
| Reflux Gourmet | 25 single-serve packs | US | $1.28 |
| Reflux Raft | 8 oz liquid | US | $0.70 |
| Gaviscon Advance Chewable | 60 ct | UK import | $0.32 |
| Gaviscon Advance Chewable | 120 ct (2-pack) | UK import | **$0.25** ← cheapest |
| Gaviscon Double Action Tablets | 48 ct | UK import | $0.50 |
| Gaviscon Double Action Liquid | 600ml | UK import | $0.87 |
| Gaviscon Advance Liquid ("Gav") | 500ml | UK import | $0.36 |
| HartSpan Khelp | 60 capsules | US | $1.80 |

Missing: **Refluxter** (by Nutritist.us) — most-cited sodium alginate product online, ~1100mg/dose. Should be added to sheet to be comprehensive and compete for AI citations.

---

## What's built

- Comparison table: sortable by $/dose (default), alginate/dose, sodium/dose, container price, doses
- Filter pills: All / Liquid / Tablet
- Responsive: full columns on desktop, Product + $/dose + Buy on mobile
- Product image thumbnails with initials fallback
- Multiple buy links per product — each retailer gets its own sub-row with its own $/dose
- Amazon gets a distinct amber button; other retailers get a text link style
- Standard dosage sub-line in Form column
- Per-product editorial notes (italic, shown under product name)
- Origin badge (US = blue, UK import = orange)
- "Best value" badge on the cheapest $/dose row across all products and retailers
- SEO intro copy explaining sodium alginate and the US Gaviscon difference
- Live Google Sheet CMS (ISR, revalidated hourly; fallback to hardcoded data)
- Deployed to Vercel at alginatecompare.com

---

## What's not built yet (priority order)

### 1. ~~Vercel deployment + custom domain~~ ✅ DONE
Live at alginatecompare.com. Domain on Cloudflare, DNS auto-configured via Vercel integration.

### 2. ~~Google Sheets as live CMS~~ ✅ DONE
Published CSV approach — no API key needed. See `app/lib/getProducts.js`.

### 3. ~~Product images~~ ✅ DONE
9 products tracked; 8 have transparent PNG images in `/public/images/`. HartSpan Khelp still needs an image.

### 4. ~~Multi-retailer pricing + sub-rows~~ ✅ DONE
Each retailer gets its own sub-row with its own $/dose. Amazon = amber button, others = teal text link. Product-level costPerDose = min across all retailers.

### 5. ~~Product notes field~~ ✅ DONE
Note column (col P/index 16) in sheet renders italic under product name.

### 6. Blog / content section ← NEXT PRIORITY
MDX files in `/content/posts/` rendered via Next.js App Router at `/blog/[slug]`. No CMS — write in Markdown, deploy via git.

**Priority posts (from SEO plan):**
1. "UK Gaviscon vs US Gaviscon: What's the Real Difference?" — highest traffic potential
2. "What is Sodium Alginate? How the Raft Mechanism Works" — educational foundation, AI citation target
3. "Sodium Alginate for LPR (Silent Reflux): What You Should Know"
4. "Sodium Alginate vs PPIs: A Comparison"

**Implementation notes:**
- Install `@next/mdx` or use `next-mdx-remote` for MDX rendering
- Each post frontmatter: `title`, `description`, `date`, `slug`
- `/blog` index page lists posts sorted by date
- Individual post at `/blog/[slug]`
- Add a TL;DR summary box at top of each post (AI systems cite these)

### 7. Curated links / resources section ← NEXT PRIORITY (alongside blog)
User wants a section for categorized external links — not blog content, but a curated directory. Categories discussed:
- **Research** — clinical studies, PubMed papers on sodium alginate / raft therapy
- **Medical professionals to follow** — doctors/GI specialists active on social media or with public content on reflux/LPR
- **Related sites** — other useful resources for reflux patients

**Proposed approach — Google Sheet as data source (2nd tab):**
- Add a second sheet tab named `links` to the existing spreadsheet
- Columns: Category | Title | URL | Description | (optional) Author/Source
- Fetch via the same published CSV pattern, using `?gid=[tab_id]&output=csv`
- Render as a `/resources` page (or section on homepage) grouped by category
- Easy for user to maintain by editing the sheet — no code changes needed to add links

**Alternative:** MDX file at `/content/resources.mdx` — simpler if the list is small and changes infrequently.

### 8. SEO / structured data
- Product schema markup (JSON-LD) on the comparison table entries
- XML sitemap at `/sitemap.xml`
- Each product gets a short written blurb (can live in sheet Note column or as MDX)

### 9. Amazon Associates affiliate account
Apply once site has content indexed and some traffic. Health/personal care pays 1–4% commission. Requires 3 qualifying sales within 180 days of approval.

### 10. Add Refluxter to comparison table
Nutritist.us product, ~1100mg alginate/dose. Most-cited sodium alginate product online — its absence makes the site feel incomplete to anyone who's researched the topic. Add to sheet when pricing is confirmed.

---

## GitHub

`https://github.com/raider708/alginate-compare`

---

## Dev workflow

- `npm run dev` starts at `localhost:3000` (or port 3002 per `.claude/launch.json`)
- Sheet changes: edit the Google Sheet → Vercel auto-refreshes within 1 hour, or use Redeploy in Vercel dashboard for instant update
- Images go in `public/images/`
- To force-push large image files that fail with HTTP 400: `git config http.postBuffer 157286400` then push again
