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

## Data & automatic price tracking

Prices are **never typed in by hand**. The flow:

1. **Google Sheet** (`https://docs.google.com/spreadsheets/d/1ogEg7jDV9SxR-rJUzMAjxbAuohxTVUNFlymoKtBse30`) holds the catalog, on three tabs:
   - **Products**: `ID, Name, Form, Origin, Standard Dosage, Alginate mg, Sodium mg, Image, Note` (one row per formulation)
   - **Offers**: `Product ID, Retailer, Pack Size, Doses, URL, Variant` (one row per store × pack size; no prices). `Variant` picks a Shopify option by name (e.g. "1-month subscription"); default is the non-subscription option. Any Amazon link form works (amzn.to, a.co, /dp/ASIN).
   - **Candidates**: for the upcoming new-product discovery job (not built yet).
   Seed copies of the tabs live in `data/seed/*.csv`. The old single tab (gid=0, `SHEET_CSV_URL`) is no longer read.
2. **`scripts/update-prices.mjs`** runs every 3 hours in GitHub Actions (`.github/workflows/update-prices.yml`, also has a manual "Run workflow" button). It reads the Products/Offers tabs (repo variables `SHEET_PRODUCTS_CSV_URL`, `SHEET_OFFERS_CSV_URL`), then:
   - **Shopify stores** (Reflux Gourmet, Reflux Raft, HartSpan, Nutritist, British Essentials): reads `/products/<handle>.js` for price + stock. Any Shopify store works automatically.
   - **Amazon**: Creators API (`scripts/lib/amazon.mjs`), secrets `AMAZON_CREDENTIAL_ID` / `AMAZON_CREDENTIAL_SECRET` (credential version 3.1). Needs 10 qualifying sales in the trailing 30 days; when not eligible the API says so and the script falls back to just checking links (404 = dead). Eligibility switches on/off by itself.
   - Other stores: shown as a plain link with no price.
   - Writes `latest.json` + `history.csv` to the **`data` branch** (single force-pushed commit; `history.csv` carries the price history, store sites only).
   - Keeps one GitHub issue labelled `price-tracker` up to date with problems (dead links, out of stock, sheet typos, Amazon status changes) and closes it when all clear.
3. **Site** (`app/lib/getProducts.js`) fetches `latest.json` from raw.githubusercontent.com (ISR, 15 min), falling back to `data/snapshot-fallback.json`. Freshness rules: Amazon prices hidden if older than 24h (Associates policy), store prices hidden after 72h.

**Amazon Associates rules that shape this:** Amazon prices may only be shown if they come from the API, with a timestamp next to them and Amazon's disclaimer (the footer shows it when Amazon prices are live). Don't add manually entered or scraped Amazon prices, and don't store Amazon prices in history.

Run locally: `node scripts/update-prices.mjs --out /tmp/prices --products data/seed/products.csv --offers data/seed/offers.csv` (add `--prev <dir>` to test history/alerts, `--debug-amazon` to see raw Creators API responses).

---

## Data model (site, from `getProducts()`)

```js
{
  id, name, form, origin, standardDosage, algMg, sodiumMg, image, note,
  costPerDose,   // best fresh, in-stock $/dose across offers (null if none) — used for sorting
  offers: [{ key, retailer, packSize, doses, url, isAmazon, price, costPerDose, inStock, checkedAt }],
}
```

---

## Products tracked (8 formulations, 18 offers)

Reflux Gourmet, Reflux Raft, Gaviscon Advance Chewable, Gaviscon Double Action Tablets, Gaviscon Double Action Liquid, Gaviscon Advance Liquid ("Gav"), HartSpan Khelp, Refluxter. See the Offers tab for stores and pack sizes.

Spotted but not yet added: Life Extension "Esophageal Guardian" (alginic acid chewable, Amazon B00SJNL5E0); larger Gaviscon Advance Chewable multi-packs on Amazon (3/6/12-pack).

---

## What's built

- Comparison table: sortable by best $/dose (default), alginate, sodium, name
- Filter pills: All / Liquid / Tablet
- Responsive: full columns on desktop, Product + $/dose + Buy on mobile
- Product image thumbnails with initials fallback
- One sub-row per offer (store × pack size) with package price, "as of" timestamp, $/dose, stock status; out-of-stock offers dimmed and excluded from best value
- Amazon gets a distinct amber button; other retailers get a text link style
- Standard dosage sub-line in Form column
- Per-product editorial notes (italic, shown under product name)
- Origin badge (US = blue, UK import = orange)
- "Best value" badge on the cheapest $/dose row across all products and retailers
- SEO intro copy explaining sodium alginate and the US Gaviscon difference
- Automatic price + stock tracking every 3h (see "Data & automatic price tracking"), alerts via GitHub issue
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

### 8. Personal voice + About panel ← DESIGN PRIORITY FOR NEXT SESSION
The site currently feels like a neutral tool. Goal: soften the tone and make it more personal.

- **About Chris panel** — photo of Chris + short personal note about his own journey discovering sodium alginate for reflux. Sits between the intro section and the product table (or after it). Warm, first-person, relatable.
- **Reframe the content section** — "Research & Resources" becomes more like "My Research" or similar. Cards and articles written in Chris's voice with his own take, not just neutral links.
- **Tone of the whole page** — revisit the intro copy to feel less like a data tool and more like a recommendation from someone who's been through it.

### 9. SEO / structured data
- Product schema markup (JSON-LD) on the comparison table entries
- XML sitemap at `/sitemap.xml`
- Each product gets a short written blurb (can live in sheet Note column or as MDX)

### 10. Price automation follow-ups
- **Amazon Creators API:** code is in place; needs the Creators API app credentials added as GitHub secrets. Account `alginatecompa-20` was at ~6 shipped orders / 30 days in Oct 2026 (needs 10). Once eligible, prices appear automatically. First time it's live, run with `--debug-amazon` to confirm the response parsing (field names were inferred from partial docs).
- **New-product discovery (weekly):** search for new sodium alginate products (Amazon/Google Shopping/Shopify brands), have a cheap Claude model extract alginate mg/dose, pack size, form; append to the sheet's **Candidates** tab for Chris to approve. Never auto-publish. Writing to the sheet needs a Google service account with edit access.
- **Brand affiliate programs:** Reflux Gourmet reportedly pays ~14% via FlexOffers/Impact (vs Amazon's 1–4%). Ask Nutritist, HartSpan, Reflux Raft. Swap affiliate URLs into the Offers tab once approved.

### ~~Add Refluxter~~ ✅ DONE

---

## GitHub

`https://github.com/raider708/alginate-compare`

---

## Dev workflow

- `npm run dev` starts at `localhost:3000` (or port 3002 per `.claude/launch.json`)
- Sheet changes: edit the Products/Offers tabs → picked up on the next price run (every 3h), or run the "Update prices" workflow in GitHub Actions for an immediate refresh
- Images go in `public/images/`
- To force-push large image files that fail with HTTP 400: `git config http.postBuffer 157286400` then push again
