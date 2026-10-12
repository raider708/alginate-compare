'use client'
import { useState, useMemo } from 'react'
import Image from 'next/image'

const SORT_COLS = [
  { key: 'algMg',    label: 'Alginate' },
  { key: 'sodiumMg', label: 'Sodium'   },
]

function ProductThumb({ image, name }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (image) {
    return (
      <div className="relative w-12 h-12 shrink-0 rounded overflow-hidden border border-gray-100">
        <Image src={`/images/${image}`} alt={name} fill className="object-contain" sizes="48px" />
      </div>
    )
  }
  return (
    <div className="w-12 h-12 shrink-0 rounded bg-gray-100 border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 select-none">
      {initials}
    </div>
  )
}

function BuyButton({ offer }) {
  if (!offer) return <span className="text-gray-300 text-xs">—</span>
  if (offer.isAmazon) {
    return (
      <a
        href={offer.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="inline-block bg-amber-400 hover:bg-amber-500 text-gray-900 text-xs font-semibold px-3 py-1.5 rounded transition-colors whitespace-nowrap"
      >
        Amazon →
      </a>
    )
  }
  return (
    <a
      href={offer.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-teal-600 hover:text-teal-800 hover:underline font-medium sm:whitespace-nowrap"
    >
      {offer.retailer} ↗
    </a>
  )
}

export default function ProductTable({ products }) {
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('costPerDose')
  const [sortDir, setSortDir] = useState('asc')

  const sorted = useMemo(() => {
    const base = filter === 'all' ? products : products.filter(p => p.form === filter)
    return [...base].sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      // Products with no current price always sink to the bottom.
      if (aVal == null || bVal == null) return (aVal == null) - (bVal == null)
      const diff = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal
      return sortDir === 'asc' ? diff : -diff
    })
  }, [products, filter, sortBy, sortDir])

  const cheapestDose = useMemo(() => {
    const prices = sorted.map(p => p.costPerDose).filter(v => v != null)
    return prices.length ? Math.min(...prices) : null
  }, [sorted])

  function handleSort(col) {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  function SortIcon({ col }) {
    if (sortBy !== col) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="text-teal-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { value: 'all',    label: 'All products' },
          { value: 'liquid', label: 'Liquid'        },
          { value: 'tablet', label: 'Tablet'        },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              filter === value
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300 hover:text-teal-700'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">{sorted.length} products</span>
      </div>

      <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-x-auto">
        <table className="w-full text-sm">

          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th
                className={`text-left px-2 sm:px-3 py-3 font-semibold cursor-pointer select-none ${
                  sortBy === 'name' ? 'text-teal-700' : 'text-gray-600 hover:text-teal-600'
                }`}
                onClick={() => handleSort('name')}
              >
                Product<SortIcon col="name" />
              </th>
              <th className="text-left px-2 sm:px-3 py-3 font-semibold text-gray-600 hidden sm:table-cell">
                Form
              </th>
              <th className="text-right px-2 sm:px-3 py-3 font-semibold whitespace-nowrap hidden md:table-cell">
                <div className="text-gray-600 font-semibold mb-0.5">Per dose</div>
                {SORT_COLS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`block ml-auto text-xs font-medium cursor-pointer select-none ${
                      sortBy === key ? 'text-teal-700' : 'text-gray-400 hover:text-teal-600'
                    }`}
                  >
                    {label}<SortIcon col={key} />
                  </button>
                ))}
              </th>
              <th className="text-left px-2 sm:px-3 py-3 font-semibold text-gray-600 hidden sm:table-cell min-w-40">Store &amp; size</th>
              <th className="text-right px-2 sm:px-3 py-3 font-semibold text-gray-600 hidden md:table-cell">Price</th>
              <th
                className={`text-right px-2 sm:px-3 py-3 font-semibold cursor-pointer select-none whitespace-nowrap ${
                  sortBy === 'costPerDose' ? 'text-teal-700' : 'text-gray-600 hover:text-teal-600'
                }`}
                onClick={() => handleSort('costPerDose')}
              >
                $/dose<SortIcon col="costPerDose" />
              </th>
              <th className="text-center px-2 sm:px-3 py-3 font-semibold text-gray-600 w-px">Buy</th>
            </tr>
          </thead>

          {sorted.map((p, productIdx) => {
            const isBestProduct = cheapestDose != null && p.costPerDose === cheapestDose
            const offers        = p.offers.length > 0 ? p.offers : [null]
            const rowCount      = offers.length
            const isLastProduct = productIdx === sorted.length - 1

            // Separator between products; none after the last one
            const productBorder = isLastProduct ? '' : 'border-b border-gray-200'
            const bgClass       = isBestProduct ? 'bg-green-50' : 'group-hover:bg-slate-50'

            return (
              <tbody key={p.id} className="group">
                {offers.map((offer, offerIdx) => {
                  const isFirst    = offerIdx === 0
                  const isLast     = offerIdx === rowCount - 1
                  const outOfStock = offer?.inStock === false
                  const isBestOffer = isBestProduct && !outOfStock && offer?.costPerDose === cheapestDose

                  // Between offers of the same product: hairline on the per-offer cells only.
                  // Between products: full border (rowspan cells show it at their bottom edge).
                  const offerBorder = isLast ? productBorder : 'border-b border-gray-100'
                  const dim = outOfStock ? 'opacity-50' : ''

                  return (
                    <tr key={offer?.key ?? offerIdx} className={bgClass}>

                      {/* ── Product-info cells (rowspan across all offers) ── */}
                      {isFirst && (<>
                        <td rowSpan={rowCount} className={`px-2 sm:px-3 py-3 align-top ${productBorder}`}>
                          <div className="flex items-start gap-3">
                            <ProductThumb image={p.image} name={p.name} />
                            <div>
                              <div className="font-medium text-gray-900">{p.name}</div>
                              <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block font-medium ${
                                p.origin === 'US'
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'bg-orange-50 text-orange-600'
                              }`}>
                                {p.origin}
                              </span>
                              {p.note && (
                                <p className="hidden sm:block text-xs text-gray-400 italic mt-1.5 min-w-40 max-w-xs">{p.note}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td rowSpan={rowCount} className={`px-2 sm:px-3 py-3 align-top hidden sm:table-cell ${productBorder}`}>
                          <div className="text-gray-600 capitalize">{p.form}</div>
                          {p.standardDosage && (
                            <div className="text-xs text-gray-400 mt-0.5">{p.standardDosage}</div>
                          )}
                        </td>

                        <td rowSpan={rowCount} className={`px-2 sm:px-3 py-3 text-right align-top whitespace-nowrap hidden md:table-cell ${productBorder}`}>
                          <div className="text-gray-700">{p.algMg}mg <span className="text-xs text-gray-400">alginate</span></div>
                          {p.sodiumMg > 0 && (
                            <div className="text-gray-700">{p.sodiumMg}mg <span className="text-xs text-gray-400">sodium</span></div>
                          )}
                        </td>
                      </>)}

                      {/* ── Per-offer: store & pack size ── */}
                      <td className={`px-2 sm:px-3 py-3 hidden sm:table-cell ${offerBorder}`}>
                        {offer && (
                          <div className={dim}>
                            <div className="text-gray-700">{offer.retailer}</div>
                            <div className="text-xs text-gray-400">{offer.packSize} · {offer.doses} doses</div>
                          </div>
                        )}
                      </td>

                      {/* ── Per-offer: package price ── */}
                      <td className={`px-2 sm:px-3 py-3 text-right hidden md:table-cell ${offerBorder}`}>
                        {offer?.price != null ? (
                          <div className={dim}>
                            <div className="text-gray-700">${offer.price.toFixed(2)}</div>
                            <div className="text-[11px] text-gray-400 whitespace-nowrap">as of {offer.checkedAt}</div>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* ── Per-offer: $/dose ── */}
                      <td className={`px-2 sm:px-3 py-3 text-right ${offerBorder}`}>
                        {offer?.costPerDose != null ? (
                          <div className={dim}>
                            <div className={`font-bold text-base ${isBestOffer ? 'text-green-700' : 'text-gray-900'}`}>
                              ${offer.costPerDose.toFixed(2)}
                            </div>
                            {isBestOffer && <div className="text-xs text-green-600 font-medium">Best value</div>}
                            {outOfStock && <div className="text-xs text-red-600 font-medium">Out of stock</div>}
                          </div>
                        ) : offer?.isAmazon ? (
                          <span className="hidden sm:inline text-xs text-gray-400 whitespace-nowrap">See price on Amazon</span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                        {offer && (
                          <div className="text-xs text-gray-400 sm:hidden">{offer.packSize}</div>
                        )}
                      </td>

                      {/* ── Per-offer: buy button ── */}
                      <td className={`px-2 sm:px-3 py-3 text-center ${offerBorder}`}>
                        <BuyButton offer={offer} />
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            )
          })}

        </table>
      </div>
    </div>
  )
}
