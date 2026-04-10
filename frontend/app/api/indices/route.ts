import { NextResponse } from 'next/server'
import yf from '@/lib/yahoo'
import { isKisAvailable, getDomesticIndex } from '@/lib/kis'
import { cacheGet, cacheSet } from '@/lib/cache'

const INDEX_MAP: Record<string, { yf: string; kis?: string; name: string }> = {
  KOSPI:    { yf: '^KS11',    kis: '0001', name: '코스피' },
  KOSDAQ:   { yf: '^KQ11',    kis: '1001', name: '코스닥' },
  SP500:    { yf: '^GSPC',    name: 'S&P 500' },
  NASDAQ:   { yf: '^IXIC',    name: '나스닥' },
  DOW:      { yf: '^DJI',     name: '다우존스' },
  NIKKEI:   { yf: '^N225',    name: '니케이 225' },
  SHANGHAI: { yf: '000001.SS', name: '상하이종합' },
  FTSE:     { yf: '^FTSE',    name: 'FTSE 100' },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const cached = cacheGet('indices:all')
  if (cached) return NextResponse.json(cached)

  const useKis = isKisAvailable()
  const data: any[] = []

  for (const [code, info] of Object.entries(INDEX_MAP)) {
    try {
      // KIS 사용 가능하고 국내 지수인 경우 KIS 우선
      if (useKis && info.kis) {
        const kisData = await getDomesticIndex(info.kis)
        if (kisData) {
          data.push({
            code, name: info.name,
            value: kisData.value,
            change: kisData.change,
            change_pct: kisData.change_pct,
            source: 'KIS',
          })
          continue
        }
      }

      // Yahoo Finance fallback
      const quote = await yf.quote(info.yf)
      if (!quote.regularMarketPrice) continue

      data.push({
        code, name: info.name,
        value: +(quote.regularMarketPrice.toFixed(2)),
        prev_close: +(quote.regularMarketPreviousClose?.toFixed(2) ?? 0),
        change: +((quote.regularMarketChange ?? 0).toFixed(2)),
        change_pct: +((quote.regularMarketChangePercent ?? 0).toFixed(3)),
        source: 'Yahoo',
      })
    } catch { continue }
  }

  const result = {
    data,
    meta: {
      count: data.length,
      updated_at: new Date().toISOString(),
      source: useKis ? 'KIS+Yahoo' : 'Yahoo',
    },
  }

  cacheSet('indices:all', result, useKis ? 30 * 1000 : 15 * 60 * 1000)
  return NextResponse.json(result)
}
