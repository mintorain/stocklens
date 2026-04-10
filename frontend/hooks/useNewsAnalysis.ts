'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { NewsAnalysis } from '@/types'

export function useNewsAnalysis(ticker: string, market: string) {
  const [data, setData] = useState<NewsAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    api.getNewsAnalysis(ticker, market)
      .then((res) => {
        const d = res.data
        setData({
          ticker: d.ticker,
          analysisDate: d.analysis_date,
          sentiment: d.sentiment,
          sentimentScore: d.sentiment_score,
          summary: d.summary,
          reasoning: d.reasoning,
          newsSources: d.news_sources,
          newsCount: d.news_count,
          updatedAt: d.updated_at,
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [ticker, market])

  return { data, loading, error }
}
