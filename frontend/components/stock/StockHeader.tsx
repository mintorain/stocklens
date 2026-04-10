'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { formatChangePct, formatLargeNumber, formatPrice, getChangeColor } from '@/lib/utils'

const REFRESH_INTERVAL = 30_000

interface StockHeaderProps {
  ticker: string
  market: string
}

export function StockHeader({ ticker, market }: StockHeaderProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const fetchData = useCallback(async () => {
    try {
      const res = await api.getStock(ticker, market)
      setData(res.data)
      setLastUpdate(new Date().toLocaleTimeString('ko-KR'))
    } catch { /* 다음 주기에 재시도 */ }
    setLoading(false)
  }, [ticker, market])

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [fetchData])

  if (loading) {
    return <div className="h-24 animate-pulse bg-muted rounded-xl" aria-label="종목 정보 로딩 중" />
  }

  if (!data) return <p className="text-sm text-muted-foreground">종목 정보를 찾을 수 없습니다.</p>

  const colorClass = getChangeColor(data.change_pct, market)
  const arrow = data.change_pct > 0 ? '▲' : data.change_pct < 0 ? '▼' : '–'

  return (
    <header className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{data.name ?? ticker}</h1>
        <p className="text-sm text-muted-foreground">
          {ticker} · {data.exchange ?? ''}
          {lastUpdate && (
            <span className="ml-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" aria-hidden="true" />
              {lastUpdate}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{formatPrice(data.current_price, market)}</span>
        <span className={`text-lg font-semibold ${colorClass}`}>
          {arrow} {formatChangePct(data.change_pct)}
        </span>
      </div>

      <dl className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-sm">
        {[
          { label: '시가', value: formatPrice(data.open, market) },
          { label: '고가', value: formatPrice(data.high, market) },
          { label: '저가', value: formatPrice(data.low, market) },
          { label: '거래량', value: formatLargeNumber(data.volume) },
          { label: '시총', value: formatLargeNumber(data.market_cap) },
          { label: 'PER', value: data.per ? `${Number(data.per).toFixed(1)}x` : '-' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border bg-card p-2 text-center">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-semibold mt-0.5">{value}</dd>
          </div>
        ))}
      </dl>
    </header>
  )
}
