import { Suspense } from 'react'
import { IndexGrid } from '@/components/dashboard/IndexGrid'
import { PortfolioSection } from '@/components/dashboard/PortfolioSection'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchResults } from '@/components/search/SearchResults'
import { MarketSummary } from '@/components/dashboard/MarketSummary'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* 헤더 */}
        <header>
          <h1 className="text-2xl font-bold tracking-tight">StockLens</h1>
          <p className="text-sm text-muted-foreground mt-1">AI가 매일 분석하는 주식 뉴스 시황 대시보드</p>
        </header>

        {/* 검색 */}
        <div className="relative">
          <SearchBar />
          <SearchResults />
        </div>

        {/* AI 시장 요약 */}
        <Suspense fallback={<div className="h-12 animate-pulse bg-muted rounded-xl" />}>
          <MarketSummary />
        </Suspense>

        {/* 주요 지수 */}
        <IndexGrid />

        {/* 관심 종목 */}
        <PortfolioSection />
      </div>
    </main>
  )
}
