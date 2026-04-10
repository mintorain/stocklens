'use client'

import { useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { formatChangePct, formatPrice, getChangeColor } from '@/lib/utils'

export function SearchResults() {
  const { searchResults, isSearchOpen, setSearchOpen, addToPortfolio, portfolio } = useAppStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setSearchOpen])

  if (!isSearchOpen || searchResults.length === 0) return null

  const handleAdd = async (item: any) => {
    try {
      await api.addToPortfolio({ ticker: item.ticker, exchange: item.exchange, market: item.market })
      addToPortfolio({
        id: '',
        ticker: item.ticker,
        name: item.name,
        exchange: item.exchange,
        groupName: '기본',
        currentPrice: item.current_price,
        changePct: item.change_pct,
        sentiment: null,
        sentimentScore: null,
        lastAnalysis: null,
      })
      setSearchOpen(false)
    } catch (err) {
      console.error('관심 종목 추가 실패', err)
    }
  }

  const inPortfolioTickers = new Set(portfolio.map((p) => p.ticker))

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label="검색 결과"
      className="absolute z-50 top-full mt-1 w-full rounded-xl border bg-popover shadow-lg overflow-hidden"
    >
      {searchResults.map((item) => {
        const market = item.exchange?.startsWith('KO') ? 'KR' : 'US'
        const colorClass = getChangeColor(item.change_pct, market)
        const alreadyAdded = inPortfolioTickers.has(item.ticker)

        return (
          <div
            key={`${item.ticker}-${item.exchange}`}
            role="option"
            aria-selected={alreadyAdded}
            className="flex items-center justify-between px-4 py-3 hover:bg-accent cursor-pointer"
          >
            <div>
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.ticker} · {item.exchange}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold">{formatPrice(item.current_price, market)}</p>
                <p className={`text-xs ${colorClass}`}>{formatChangePct(item.change_pct)}</p>
              </div>
              <button
                onClick={() => handleAdd(item)}
                disabled={alreadyAdded}
                className="text-xs px-2 py-1 rounded-md border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={alreadyAdded ? `${item.name} 이미 추가됨` : `${item.name} 관심 종목 추가`}
              >
                {alreadyAdded ? '추가됨' : '+ 추가'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
