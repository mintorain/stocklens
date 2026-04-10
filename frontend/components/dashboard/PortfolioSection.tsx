'use client'

import { useEffect } from 'react'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { StockCard } from '@/components/stock/StockCard'

export function PortfolioSection() {
  const { portfolio, setPortfolio, removeFromPortfolio } = useAppStore()

  useEffect(() => {
    api.getPortfolio()
      .then((res) => setPortfolio(res.data.map((d: any) => ({
        id: d.id,
        ticker: d.ticker,
        name: d.name,
        exchange: d.exchange,
        groupName: d.group_name,
        currentPrice: d.current_price,
        changePct: d.change_pct,
        sentiment: d.sentiment,
        sentimentScore: d.sentiment_score,
        lastAnalysis: d.last_analysis,
      }))))
      .catch(console.error)
  }, [setPortfolio])

  const handleRemove = async (ticker: string) => {
    try {
      await api.removeFromPortfolio(ticker)
      removeFromPortfolio(ticker)
    } catch (err) {
      console.error('삭제 실패', err)
    }
  }

  return (
    <section aria-labelledby="portfolio-heading">
      <div className="flex items-center justify-between mb-3">
        <h2 id="portfolio-heading" className="text-lg font-semibold">관심 종목</h2>
        <span className="text-sm text-muted-foreground">{portfolio.length}개</span>
      </div>

      {portfolio.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
          <p className="text-sm">위 검색창에서 종목을 추가해보세요</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {portfolio.map((item) => (
            <li key={item.ticker}>
              <StockCard item={item} onRemove={handleRemove} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
