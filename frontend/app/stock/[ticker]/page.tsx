import Link from 'next/link'
import { Suspense } from 'react'
import { NewsAnalysis } from '@/components/stock/NewsAnalysis'
import { StockChartSection } from '@/components/stock/StockChartSection'
import { StockHeader } from '@/components/stock/StockHeader'

interface PageProps {
  params: { ticker: string }
  searchParams: { market?: string }
}

export default function StockDetailPage({ params, searchParams }: PageProps) {
  const { ticker } = params
  const market = searchParams.market ?? 'KR'

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <nav aria-label="뒤로가기">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            ← 대시보드로
          </Link>
        </nav>

        <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded-xl" />}>
          <StockHeader ticker={ticker} market={market} />
        </Suspense>

        <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-xl" />}>
          <StockChartSection ticker={ticker} market={market} />
        </Suspense>

        <NewsAnalysis ticker={ticker} market={market} />
      </div>
    </main>
  )
}
