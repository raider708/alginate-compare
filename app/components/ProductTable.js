'use client'
import { useState, useMemo } from 'react'
import Image from 'next/image'

const SORT_COLS = [
  { key: 'algMg',         label: 'Alginate/dose' },
  { key: 'sodiumMg',      label: 'Sodium/dose'   },
  { key: 'containerCost', label: 'Price'         },
  { key: 'doses',         label: 'Doses'         },
  { key: 'costPerDose',   label: '$/dose'        },
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

export default function ProductTable({ products }) {
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('costPerDose')
  const [sortDir, setSortDir] = useState('asc')

  const sorted = useMemo(() => {
    const base = filter === 'all' ? products : products.filter(p => p.form === filter)
    return [...base].sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      const diff = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal
      return sortDir === 'asc' ? diff : -diff
    })
  }, [products, filter, sortBy, sortDir])

  const cheapestDose = useMemo(
    () => Math.min(...sorted.map(p => p.costPerDose)),
    [sorted]
  )

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

      <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
        <table className="w-full text-sm">

          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th
                className={`text-left px-4 py-3 font-semibold cursor-pointer select-none ${
                  sortBy === 'name' ? 'text-teal-700' : 'text-gray-600 hover:text-teal-600'
                }`}
                onClick={() => handleSort('name')}
              >
                Product<SortIcon col="name" />
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">
                Form
              </th>
              {SORT_COLS.map(({ key, label }) => (
                <th
                  key={key}
                  className={`text-right px-4 py-3 font-semibold cursor-pointer select-none whitespace-nowrap ${
                    sortBy === key ? 'text-teal-700' : 'text-gray-600 hover:text-teal-600'
                  } ${key !== 'costPerDose' ? 'hidden md:table-cell' : ''}`}
                  onClick={() => handleSort(key)}
                >
                  {label}<SortIcon col={key} />
                </th>
              ))}
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Buy</th>
            </tr>
          </thead>

          {sorted.map((p, productIdx) => {
            const isBestProduct  = p.costPerDose === cheapestDose
            const links          = p.buyLinks.length > 0 ? p.buyLinks : [null]
            const rowCount       = links.length
            const isLastProduct  = productIdx === sorted.length - 1

            // Separator between products; none after the last one
            const productBorder  = isLastProduct ? '' : 'border-b border-gray-200'
            const bgClass        = isBestProduct ? 'bg-green-50' : 'group-hover:bg-slate-50'

            return (
              <tbody key={p.id} className="group">
                {links.map((link, linkIdx) => {
                  const isFirstLink = linkIdx === 0
                  const isLastLink  = linkIdx === rowCount - 1
                  const isBestLink  = link?.costPerDose != null && link.costPerDose === cheapestDose

                  // Between sub-rows of the same product: hairline only on the per-retailer cells.
                  // Between products: full border on every cell (rowspan cells only show this at
                  // their bottom edge, which lines up with the last sub-row — exactly right).
                  const subRowBorder   = 'border-b border-gray-200'   // intra-product
                  const retailerBorder = isLastLink ? productBorder : subRowBorder

                  return (
                    <tr key={linkIdx} className={bgClass}>

                      {/* ── Product-info cells (rowspan across all sub-rows) ── */}
                      {isFirstLink && (<>
                        <td rowSpan={rowCount} className={`px-4 py-3 align-top ${productBorder}`}>
                          <div className="flex items-start gap-3">
                            <ProductThumb image={p.image} name={p.name} />
                            <div>
                              <div className="font-medium text-gray-900">{p.name}</div>
                              <div className="text-gray-500 text-xs mt-0.5">{p.variant}</div>
                              <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block font-medium ${
                                p.origin === 'US'
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'bg-orange-50 text-orange-600'
                              }`}>
                                {p.origin}
                              </span>
                              {p.note && (
                                <p className="text-xs text-gray-400 italic mt-1.5 max-w-xs">{p.note}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td rowSpan={rowCount} className={`px-4 py-3 align-top hidden sm:table-cell ${productBorder}`}>
                          <div className="text-gray-600 capitalize">{p.form}</div>
                          {p.standardDosage && (
                            <div className="text-xs text-gray-400 mt-0.5">{p.standardDosage}</div>
                          )}
                        </td>

                        <td rowSpan={rowCount} className={`px-4 py-3 text-right align-top hidden md:table-cell ${productBorder}`}>
                          <div className="text-gray-700">{p.algMg}mg</div>
                        </td>

                        <td rowSpan={rowCount} className={`px-4 py-3 text-right align-top hidden md:table-cell ${productBorder}`}>
                          <div className="text-gray-700">{p.sodiumMg > 0 ? `${p.sodiumMg}mg` : '—'}</div>
                        </td>

                        <td rowSpan={rowCount} className={`px-4 py-3 text-right align-top hidden md:table-cell ${productBorder}`}>
                          <div className="text-gray-700">${p.containerCost.toFixed(2)}</div>
                        </td>

                        <td rowSpan={rowCount} className={`px-4 py-3 text-right align-top hidden md:table-cell ${productBorder}`}>
                          <div className="text-gray-700">{p.doses}</div>
                        </td>
                      </>)}

                      {/* ── Per-retailer: $/dose ── */}
                      <td className={`px-4 py-3 text-right ${retailerBorder}`}>
                        {link?.costPerDose != null ? (
                          <>
                            <div className={`font-bold text-base ${isBestLink ? 'text-green-700' : 'text-gray-900'}`}>
                              ${link.costPerDose.toFixed(2)}
                            </div>
                            {isBestLink && (
                              <div className="text-xs text-green-600 font-medium">Best value</div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* ── Per-retailer: buy button ── */}
                      <td className={`px-4 py-3 text-center ${retailerBorder}`}>
                        {!link ? (
                          <span className="text-gray-300 text-xs">—</span>
                        ) : link.label === 'Amazon' ? (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-amber-400 hover:bg-amber-500 text-gray-900 text-xs font-semibold px-3 py-1.5 rounded transition-colors whitespace-nowrap"
                          >
                            Amazon →
                          </a>
                        ) : (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-teal-600 hover:text-teal-800 hover:underline font-medium whitespace-nowrap"
                          >
                            {link.label} ↗
                          </a>
                        )}
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
