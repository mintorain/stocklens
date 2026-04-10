import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import Parser from 'rss-parser'
import { cacheGet, cacheSet } from '@/lib/cache'

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
  } catch { /* RSS 파싱 실패 무시 */ }

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

  // 중복 제거
  const seen = new Set<string>()
  return articles.filter((a) => {
    if (seen.has(a.url)) return false
    seen.add(a.url)
    return true
  }).slice(0, 10)
}

async function analyzeWithClaude(stockName: string, ticker: string, articles: any[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      sentiment: 'neutral',
      sentiment_score: 0,
      summary: ['API 키가 설정되지 않았습니다', '환경변수를 확인하세요', 'ANTHROPIC_API_KEY 필요'],
      reasoning: 'API 키 미설정',
    }
  }

  if (articles.length === 0) {
    return {
      sentiment: 'neutral',
      sentiment_score: 0,
      summary: ['관련 뉴스를 찾을 수 없습니다', '데이터 없음', '추후 업데이트 예정'],
      reasoning: '수집된 뉴스 없음',
    }
  }

  const newsText = articles
    .map((a, i) => `[${i + 1}] ${a.title}\n    출처: ${a.source}`)
    .join('\n\n')

  const prompt = `당신은 주식 시장 전문 뉴스 분석가입니다.
아래는 [${stockName} (${ticker})]에 관한 최근 뉴스 ${articles.length}건입니다.

=== 뉴스 목록 ===
${newsText}
=================

다음 JSON 형식으로 분석 결과만 반환하세요 (다른 텍스트 금지):
{
  "sentiment": "positive",
  "sentiment_score": 0.65,
  "summary": ["핵심이슈1 (30자 이내)", "핵심이슈2 (30자 이내)", "핵심이슈3 (30자 이내)"],
  "reasoning": "판단 근거 1~2문장"
}

규칙:
- sentiment는 positive / neutral / negative 중 하나
- sentiment_score는 -1.0(매우 부정) ~ 1.0(매우 긍정)
- summary는 반드시 3개, 각 30자 이내
- 투자 조언, 매수/매도 추천 절대 금지
- 한국어로 응답`

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    })

    let raw = (message.content[0] as any).text?.trim() ?? '{}'
    if (raw.includes('```')) {
      raw = raw.split('```')[1].replace(/^json/, '').trim()
    }
    return JSON.parse(raw)
  } catch {
    return {
      sentiment: 'neutral',
      sentiment_score: 0,
      summary: ['AI 분석 일시 오류', '잠시 후 재시도', '뉴스는 아래에서 확인'],
      reasoning: 'AI 분석 실패',
    }
  }
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
  const analysis = await analyzeWithClaude(name, ticker, articles)

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
      updated_at: new Date().toISOString(),
    },
  }

  cacheSet(cacheKey, result, 60 * 60 * 1000) // 1시간
  return NextResponse.json(result)
}
