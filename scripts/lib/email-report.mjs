// The weekly summary email sent after product discovery: the best prices right now,
// what was added automatically, what needs review, and open price-checker problems.
//
// Prices come from the price checker's last snapshot, store sites only: Amazon prices
// aren't used outside the site (Associates rules), so Amazon listings are named without one.

const STALE_HOURS = 72
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const money = n => `$${n.toFixed(2)}`

export function bestPrices(snapshot, now = Date.now()) {
  const products = new Map((snapshot?.products ?? []).map(p => [p.id, p]))
  const best = new Map()   // productId -> cheapest fresh, in-stock store offer
  for (const o of snapshot?.offers ?? []) {
    if (o.source !== 'shopify' || o.price == null || !o.doses || o.inStock === false || !o.checkedAt) continue
    if ((now - Date.parse(o.checkedAt)) / 36e5 > STALE_HOURS) continue
    const perDose = o.price / o.doses
    if (!best.has(o.productId) || perDose < best.get(o.productId).perDose) best.set(o.productId, { ...o, perDose })
  }
  return [...best.values()]
    .map(o => ({ ...o, product: products.get(o.productId) }))
    .filter(o => o.product)
    .sort((a, b) => a.perDose - b.perDose)
}

export function buildReport({ snapshot, newRows, summary, issueUrl, sheetUrl, today, failed }) {
  const ranked = bestPrices(snapshot)
  const top = ranked[0]
  const bestOfForm = form => ranked.find(o => o.product.form === form)
  const auto = newRows.filter(r => r[7].startsWith('AUTO-ADDED'))
  const review = newRows.filter(r => !r[7].startsWith('AUTO-ADDED'))
  const problems = snapshot?.problems ?? []

  const subject = `Alginate Compare weekly: ` + [
    top && `best is ${top.product.name} at ${money(top.perDose)}/dose`,
    auto.length && `${auto.length} added`,
    review.length && `${review.length} to review`,
  ].filter(Boolean).join(', ')

  const offerLine = o => `<b>${esc(o.product.name)}</b>: ${money(o.perDose)}/dose at ${esc(o.retailer)} (${esc(o.packSize)}, ${money(o.price)}) <a href="${esc(o.buyUrl || o.url)}">link</a>`
  const rowLine = r => `<b>${esc(r[1])}</b>, ${esc(r[2])}${r[4] ? `, ${esc(r[4])}` : ''} <a href="${esc(r[3])}">link</a>`
  const reason = r => r[7].match(/^NEEDS REVIEW: (.*?)\. (?=New )/)?.[1] ?? ''
  const section = (title, items) => items.length
    ? `<h3 style="margin:24px 0 8px">${title}</h3><ul style="margin:0;padding-left:20px">${items.map(i => `<li style="margin-bottom:6px">${i}</li>`).join('')}</ul>` : ''

  const headline = top
    ? `<p style="font-size:17px;margin:0 0 4px"><b>Best price right now:</b> ${esc(top.product.name)}, ${money(top.perDose)} per dose at ${esc(top.retailer)}.</p>` +
      `<p style="margin:0;color:#555">${[['liquid', 'Best liquid'], ['tablet', 'Best tablet'], ['capsule', 'Best capsule']]
        .map(([f, label]) => { const o = bestOfForm(f); return o && o !== top ? `${label}: ${esc(o.product.name)}, ${money(o.perDose)}/dose at ${esc(o.retailer)}` : null })
        .filter(Boolean).join('<br>')}</p>`
    : '<p><b>No store prices are current right now</b> (check the price-tracker issue).</p>'

  const html = `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.45;color:#222;max-width:640px">
${failed ? `<p style="color:#b91c1c"><b>The product search failed this week.</b> ${esc(failed)}</p>` : ''}
${headline}
${section('Cheapest per dose, by product', ranked.slice(0, 8).map(offerLine))}
${section(`Needs your review (${review.length})`, review.map(r => `${rowLine(r)}<br><i style="color:#555">${esc(reason(r))}</i>`))}
${section(`Added to the site automatically (${auto.length})`, auto.map(rowLine))}
${auto.length ? '<p style="color:#555;margin:6px 0 0">To undo one, mark it Reject on the Candidates tab.</p>' : ''}
${section(`Price checker problems (${problems.length})`, problems.map(p => esc(p.message)))}
<p style="margin-top:24px;color:#555">${esc(summary)}</p>
<p>${[sheetUrl && `<a href="${esc(sheetUrl)}">Candidates tab</a>`, issueUrl && `<a href="${esc(issueUrl)}">This week's GitHub issue</a>`, '<a href="https://alginatecompare.com">alginatecompare.com</a>'].filter(Boolean).join(' · ')}</p>
<p style="color:#888;font-size:12px">Store-site prices from the last price check; Amazon prices aren't included. Sent by the weekly discovery job (${esc(today)}).</p>
</div>`

  return { subject, html }
}
