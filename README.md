# Price data

Written automatically by `scripts/update-prices.mjs` on the `main` branch. Do not edit by hand.

- `latest.json`: the current snapshot the site reads
- `history.csv`: price and stock changes over time (store-site prices only; Amazon prices are not stored, per Associates rules)
- `candidates.csv`: possible new products found by `scripts/discover-products.mjs` (shown on the sheet's Candidates tab)
- `auto-offers.csv`: store listings the discovery job added to the site by itself (mark one Reject on the Candidates tab to remove it)
