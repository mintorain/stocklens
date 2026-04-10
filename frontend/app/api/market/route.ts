import { NextResponse } from 'next/server'
import { generateMarketSummary } from '@/lib/ai-analyze'
import { cacheGet, cacheSet } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  const cacheKey = `market:summary:${today}`
  const cached = cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  // 지수 데이터 조회
  let indicesText = ''
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/indices`, { cache: 'no-store' })
    const json = await res.json()
    indicesText = (json.data ?? [])
      .map((idx: any) => {
        const sign = idx.change_pct >= 0 ? '+' : ''
        return `- ${idx.name}: ${idx.value?.toLocaleString()} (${sign}${idx.change_pct?.toFixed(2)}%)`
      })
      .join('\n')
  } catch {
    return NextResponse.json({ summary: '지수 데이터를 불러오는 중입니다.', date: today })
  }

  if (!indicesText) {
    return NextResponse.json({ summary: '지수 데이터를 불러오는 중입니다.', date: today })
  }

  const summary = await generateMarketSummary(indicesText)
  const result = { summary, date: today }
  cacheSet(cacheKey, result, 24 * 60 * 60 * 1000)
  return NextResponse.json(result)
}
