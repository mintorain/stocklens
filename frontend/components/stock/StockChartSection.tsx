'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

const PERIODS = [
  { value: '1d', label: '1일' },
  { value: '1w', label: '1주' },
  { value: '1m', label: '1달' },
  { value: '3m', label: '3달' },
]

interface StockChartSectionProps {
  ticker: string
  market: string
}

export function StockChartSection({ ticker, market }: StockChartSectionProps) {
  const [period, setPeriod] = useState('1m')
  const [candles, setCandles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const chartRef = useRef<HTMLDivElement>(null)
  const tvChartRef = useRef<any>(null)

  useEffect(() => {
    setLoading(true)
    api.getPriceHistory(ticker, market, period)
      .then((res) => setCandles(res.data.candles))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ticker, market, period])

  // TradingView Lightweight Charts 동적 로드
  useEffect(() => {
    if (!chartRef.current || loading || candles.length === 0) return

    import('lightweight-charts').then((lc) => {
      if (tvChartRef.current) {
        tvChartRef.current.remove()
      }

      const chart = lc.createChart(chartRef.current!, {
        width: chartRef.current!.clientWidth,
        height: 280,
        layout: { background: { color: 'transparent' }, textColor: '#888' },
        grid: { vertLines: { color: '#f0f0f0' }, horzLines: { color: '#f0f0f0' } },
        timeScale: { borderColor: '#e0e0e0' },
      })

      const series = chart.addCandlestickSeries({
        upColor: '#ef4444',
        downColor: '#3b82f6',
        borderVisible: false,
        wickUpColor: '#ef4444',
        wickDownColor: '#3b82f6',
      })

      series.setData(
        candles.map((c) => ({
          time: c.date,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      )

      chart.timeScale().fitContent()
      tvChartRef.current = chart

      const ro = new ResizeObserver(() => chart.applyOptions({ width: chartRef.current!.clientWidth }))
      ro.observe(chartRef.current!)
      return () => ro.disconnect()
    })
  }, [candles, loading])

  return (
    <section className="rounded-xl border bg-card p-5" aria-labelledby="chart-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="chart-heading" className="font-semibold">주가 차트</h2>
        <div className="flex gap-1" role="tablist" aria-label="차트 기간 선택">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              role="tab"
              aria-selected={period === p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                period === p.value ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[280px] animate-pulse bg-muted rounded" aria-label="차트 로딩 중" />
      ) : (
        <div ref={chartRef} className="w-full" aria-label="주가 캔들스틱 차트" />
      )}
    </section>
  )
}
