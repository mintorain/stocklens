'use client'

import Link from 'next/link'
import { formatChangePct, formatPrice, getChangeColor } from '@/lib/utils'
import { SentimentBadge } from './SentimentBadge'
import type { PortfolioItem } from '@/types'

interface StockCardProps {
  item: PortfolioItem
  onRemove: (ticker: string) => void
}

export function StockCard({ item, onRemove }: StockCardProps) {
  const colorClass = getChangeColor(item.changePct, item.exchange.startsWith('KO') ? 'KR' : 'US')

  return (
    <article className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <Link
          href={`/stock/${item.ticker}?market=${item.exchange.startsWith('KO') ? 'KR' : 'US'}`}
          className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {item.name}
        </Link>
        <p className="text-xs text-muted-foreground">{item.ticker} · {item.exchange}</p>
        <div className="mt-1">
          <SentimentBadge sentiment={item.sentiment} score={item.sentimentScore} />
        </div>
      </div>

      <div className="text-right ml-4 shrink-0">
        <p className="font-bold">{formatPrice(item.currentPrice, item.exchange.startsWith('KO') ? 'KR' : 'US')}</p>
        <p className={`text-sm ${colorClass}`}>{formatChangePct(item.changePct)}</p>
        <button
          onClick={() => onRemove(item.ticker)}
          className="mt-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          aria-label={`${item.name} 관심 종목 삭제`}
        >
          삭제
        </button>
      </div>
    </article>
  )
}
