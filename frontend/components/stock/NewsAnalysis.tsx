'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { SentimentBadge } from './SentimentBadge'
import type { NewsAnalysis as NewsAnalysisType } from '@/types'

interface NewsAnalysisProps {
  ticker: string
  market: string
}

export function NewsAnalysis({ ticker, market }: NewsAnalysisProps) {
  const [data, setData] = useState<NewsAnalysisType | null>(null)
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
      .catch(() => setError('뉴스 분석을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [ticker, market])

  if (loading) {
    return (
      <section className="rounded-xl border bg-card p-5 animate-pulse" aria-label="AI 뉴스 분석 로딩 중">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="h-4 w-full bg-muted rounded mb-2" />
        <div className="h-4 w-3/4 bg-muted rounded mb-2" />
        <div className="h-4 w-1/2 bg-muted rounded" />
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">{error ?? '분석 데이터가 없습니다.'}</p>
      </section>
    )
  }

  const updatedTime = new Date(data.updatedAt).toLocaleString('ko-KR', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <section className="rounded-xl border bg-card p-5" aria-labelledby="news-analysis-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="news-analysis-heading" className="font-semibold">AI 뉴스 시황 분석</h2>
        <span className="text-xs text-muted-foreground">업데이트: {updatedTime}</span>
      </div>

      <div className="mb-4">
        <SentimentBadge sentiment={data.sentiment} score={data.sentimentScore} showBar />
      </div>

      <ul className="space-y-2 mb-4" aria-label="핵심 이슈 요약">
        {data.summary.map((point, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="text-muted-foreground shrink-0">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>

      {data.reasoning && (
        <p className="text-xs text-muted-foreground border-t pt-3 mb-4">{data.reasoning}</p>
      )}

      {data.newsSources.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">관련 뉴스 ({data.newsCount}건)</h3>
          <ul className="space-y-1.5">
            {data.newsSources.slice(0, 8).map((news, i) => (
              <li key={i}>
                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline line-clamp-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  {news.title}
                  <span className="text-muted-foreground ml-1">— {news.source}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
