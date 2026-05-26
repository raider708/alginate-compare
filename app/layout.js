import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] })

export const metadata = {
  title: 'Alginate Compare — Find the cheapest sodium alginate reflux medication',
  description: 'Compare prices of sodium alginate raft-forming antacids available in the US, including Gaviscon Advance (UK), Reflux Gourmet, and Reflux Raft. Sorted by cost per dose.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-slate-50 font-[family-name:var(--font-geist)]">
        {children}
      </body>
    </html>
  )
}
