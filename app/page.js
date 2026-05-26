import ProductTable from '@/app/components/ProductTable'

export const metadata = {
  title: 'Alginate Compare — Find the cheapest sodium alginate reflux medication',
  description: 'Compare prices of sodium alginate raft-forming antacids available in the US. Gaviscon Advance (UK), Reflux Gourmet, Reflux Raft — sorted by cost per dose.',
}

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 sm:py-14">

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-600">Sodium Alginate</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Alginate Compare
        </h1>
        <p className="text-lg text-gray-500">
          Find the cheapest raft-forming antacid available in the US — sorted by cost per dose.
        </p>
      </header>

      <section className="bg-teal-50 border border-teal-100 rounded-xl p-5 mb-8 text-sm text-gray-700 space-y-2">
        <p>
          <strong className="text-gray-900">What is sodium alginate?</strong>{' '}
          It's a seaweed-derived ingredient that forms a floating gel "raft" on top of stomach contents when it contacts acid — physically blocking reflux rather than just neutralizing it. It works differently from calcium carbonate or proton pump inhibitors.
        </p>
        <p>
          <strong className="text-gray-900">Why isn't this at CVS?</strong>{' '}
          The Gaviscon sold in US pharmacies uses aluminum and magnesium hydroxide — <em>not</em> sodium alginate. The UK formulation does. The products below are US-made sodium alginate brands and UK Gaviscon imports available on Amazon.
        </p>
      </section>

      <ProductTable />

      <footer className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-400 space-y-1">
        <p>Prices are sourced from Amazon and updated periodically. Verify current pricing before purchasing.</p>
        <p>This site may earn an affiliate commission on qualifying Amazon purchases at no extra cost to you.</p>
      </footer>

    </main>
  )
}
