import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { cacheGet, cacheSet } from '@/lib/cache'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  const cacheKey = `market:summary:${today}`
  const cached = cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ summary: '시장 요약을 위해 ANTHROPIC_API_KEY 환경변수가 필요합니다.', date: today })
  }

  // 먼저 지수 데이터 가져오기 (self-call)
  let indicesText = ''
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/indices`)
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
    return NextResponse.json({ summary: '오늘의 지수 데이터를 불러오는 중입니다.', date: today })
  }

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `오늘(${today}) 주요 주가지수 현황입니다:\n\n${indicesText}\n\n투자자를 위한 오늘의 시장 분위기를 1~2문장으로 간결하게 요약하세요.\n- 투자 조언 금지\n- 수치 기반 사실만 서술\n- 한국어`,
      }],
    })

    const summary = (message.content[0] as any).text?.trim() ?? ''
    const result = { summary, date: today }
    cacheSet(cacheKey, result, 24 * 60 * 60 * 1000)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ summary: '시장 요약을 생성할 수 없습니다.', date: today })
  }
}
