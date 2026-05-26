'use client'
import { useState, useMemo } from 'react'

const PRODUCTS = [
  {
    id: 1,
    name: 'Reflux Gourmet',
    variant: '8 oz liquid',
    form: 'liquid',
    origin: 'US',
    containerCost: 28.00,
    doseDescription: '5ml',
    algMg: 425,
    doses: 47,
    costPerDose: 0.60,
    amazonUrl: null,
  },
  {
    id: 2,
    name: 'Reflux Gourmet',
    variant: 'Single-serve packs (25 ct)',
    form: 'liquid',
    origin: 'US',
    containerCost: 32.00,
    doseDescription: '5ml',
    algMg: 425,
    doses: 25,
    costPerDose: 1.28,
    amazonUrl: 'https://a.co/d/bnGGaDH',
  },
  {
    id: 3,
    name: 'Reflux Raft',
    variant: '8 oz liquid',
    form: 'liquid',
    origin: 'US',
    containerCost: 33.00,
    doseDescription: '5ml',
    algMg: 245,
    doses: 47,
    costPerDose: 0.70,
    amazonUrl: 'https://a.co/d/7TYqIHg',
  },
  {
    id: 4,
    name: 'Gaviscon Advance Chewable',
    variant: '60 ct',
    form: 'tablet',
    origin: 'UK import',
    containerCost: 19.00,
    doseDescription: '1 tablet',
    algMg: 500,
    doses: 60,
    costPerDose: 0.37,
    amazonUrl: 'https://a.co/d/cdQMvXD',
  },
  {
    id: 5,
    name: 'Gaviscon Advance Chewable',
    variant: '120 ct (2-pack)',
    form: 'tablet',
    origin: 'UK import',
    containerCost: 29.49,
    doseDescription: '1 tablet',
    algMg: 500,
    doses: 120,
    costPerDose: 0.25,
    amazonUrl: 'https://a.co/d/cdQMvXD',
  },
  {
    id: 6,
    name: 'Gaviscon Double Action Mint',
    variant: '48 ct chewable tablets',
    form: 'tablet',
    origin: 'UK import',
    containerCost: 12.00,
    doseDescription: '2 tablets',
    algMg: 500,
    doses: 24,
    costPerDose: 0.50,
    amazonUrl: 'https://a.co/d/5wzAVE6',
  },
  {
    id: 7,
    name: 'Gaviscon Double Action Liquid',
    variant: '600ml peppermint',
    form: 'liquid',
    origin: 'UK import',
    containerCost: 52.00,
    doseDescription: '10ml',
    algMg: 500,
    doses: 60,
    costPerDose: 0.86,
    amazonUrl: 'https://a.co/d/dpRogZa',
  },
  {
    id: 8,
    name: 'Gaviscon Advance Liquid',
    variant: '1000ml (2-pack)',
    form: 'liquid',
    origin: 'UK import',
    containerCost: 71.00,
    doseDescription: '5ml',
    algMg: 500,
    doses: 100,
    costPerDose: 0.71,
    amazonUrl: 'https://a.co/d/1NyKegT',
  },
]

const SORT_COLS = [
  { key: 'algMg', label: 'Alginate/dose' },
  { key: 'containerCost', label: 'Container price' },
  { key: 'doses', label: 'Doses' },
  { key: 'costPerDose', label: '$/dose' },
]

export default function ProductTable() {
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('costPerDose')
  const [sortDir, setSortDir] = useState('asc')

  const sorted = useMemo(() => {
    const base = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.form === filter)
    return [...base].sort((a, b) => {
      const diff = a[sortBy] - b[sortBy]
      return sortDir === 'asc' ? diff : -diff
    })
  }, [filter, sortBy, sortDir])

  const cheapestDose = Math.min(...sorted.map(p => p.costPerDose))

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
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { value: 'all', label: 'All products' },
          { value: 'liquid', label: 'Liquid' },
          { value: 'tablet', label: 'Chewable tablet' },
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

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Form</th>
              {SORT_COLS.map(({ key, label }) => (
                <th
                  key={key}
                  className={`text-right px-4 py-3 font-semibold cursor-pointer select-none whitespace-nowrap ${
                    sortBy === key ? 'text-teal-700' : 'text-gray-600 hover:text-teal-600'
                  } ${key !== 'costPerDose' ? 'hidden md:table-cell' : ''}`}
                  onClick={() => handleSort(key)}
                >
                  {label}
                  <SortIcon col={key} />
                </th>
              ))}
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Buy</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const isBest = p.costPerDose === cheapestDose
              return (
                <tr
                  key={p.id}
                  className={`border-b border-gray-100 last:border-0 ${isBest ? 'bg-green-50' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{p.variant}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block font-medium ${
                      p.origin === 'US'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-orange-50 text-orange-600'
                    }`}>
                      {p.origin}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell capitalize">{p.form}</td>
                  <td className="px-4 py-3 text-right text-gray-700 hidden md:table-cell">
                    {p.algMg}mg
                    <div className="text-xs text-gray-400">{p.doseDescription}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 hidden md:table-cell">${p.containerCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-700 hidden md:table-cell">{p.doses}</td>
                  <td className="px-4 py-3 text-right">
                    <div className={`font-bold text-base ${isBest ? 'text-green-700' : 'text-gray-900'}`}>
                      ${p.costPerDose.toFixed(2)}
                    </div>
                    {isBest && (
                      <div className="text-xs text-green-600 font-medium">Best value</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.amazonUrl ? (
                      <a
                        href={p.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-amber-400 hover:bg-amber-500 text-gray-900 text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                      >
                        Amazon →
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
