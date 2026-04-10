'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function MarketSummary() {
  const [summary, setSummary] = useState<string | null>(null)
  const [date, setDate] = useState<string | null>(null)

  useEffect(() => {
    api.getMarketSummary()
      .then((res) => {
        setSummary(res.summary)
        setDate(res.date)
      })
      .catch(() => setSummary(null))
  }, [])

  if (!summary) return null

  return (
    <div
      className="rounded-xl border bg-muted/40 px-5 py-3 flex items-start gap-3"
      role="status"
      aria-live="polite"
      aria-label="오늘의 시장 요약"
    >
      <span className="text-lg" aria-hidden="true">🤖</span>
      <div>
        <p className="text-sm font-medium">{summary}</p>
        {date && <p className="text-xs text-muted-foreground mt-0.5">{date} · AI 분석</p>}
      </div>
    </div>
  )
}
