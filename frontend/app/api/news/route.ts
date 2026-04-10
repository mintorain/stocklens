import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { analyzeNews } from '@/lib/ai-analyze'
import { cacheGet, cacheSet } from '@/lib/cache'

export const dynamic = 'force-dynamic'

const parser = new Parser()

async function fetchNews(stockName: string, market: string): Promise<any[]> {
  const articles: any[] = []
  const queryKr = encodeURIComponent(`${stockName} 주식`)
  const googleKr = `https://news.google.com/rss/search?q=${queryKr}&hl=ko&gl=KR&ceid=KR:ko`

  try {
    const feed = await parser.parseURL(googleKr)
    for (const item of (feed.items ?? []).slice(0, 6)) {
      articles.push({
        title: item.title ?? '',
        url: item.link ?? '',
        source: item.creator ?? 'Google News',
        published_at: item.pubDate ?? '',
        summary: (item.contentSnippet ?? '').slice(0, 200),
      })
    }
  } catch { /* 무시 */ }

  if (market === 'US') {
    const queryEn = encodeURIComponent(`${stockName} stock`)
    const googleEn = `https://news.google.com/rss/search?q=${queryEn}&hl=en&gl=US&ceid=US:en`
    try {
      const feed = await parser.parseURL(googleEn)
      for (const item of (feed.items ?? []).slice(0, 4)) {
        articles.push({
          title: item.title ?? '',
          url: item.link ?? '',
          source: item.creator ?? 'Google News',
          published_at: item.pubDate ?? '',
          summary: (item.contentSnippet ?? '').slice(0, 200),
        })
      }
    } catch { /* 무시 */ }
  }

  const seen = new Set<string>()
  return articles.filter((a) => {
    if (seen.has(a.url)) return false
    seen.add(a.url)
    return true
  }).slice(0, 10)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ticker = searchParams.get('ticker') ?? ''
  const name = searchParams.get('name') ?? ticker
  const market = searchParams.get('market') ?? 'KR'

  const today = new Date().toISOString().split('T')[0]
  const cacheKey = `analysis:${ticker}:${today}`
  const cached = cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  const articles = await fetchNews(name, market)
  const analysis = await analyzeNews(name, ticker, articles)

  const result = {
    data: {
      ticker,
      analysis_date: today,
      sentiment: analysis.sentiment,
      sentiment_score: analysis.sentiment_score,
      summary: analysis.summary,
      reasoning: analysis.reasoning ?? '',
      news_sources: articles,
      news_count: articles.length,
      model_used: analysis.model_used ?? 'none',
      updated_at: new Date().toISOString(),
    },
  }

  cacheSet(cacheKey, result, 60 * 60 * 1000)
  return NextResponse.json(result)
}
