import { NextResponse } from 'next/server'
import yf from '@/lib/yahoo'
import { cacheGet, cacheSet } from '@/lib/cache'

const INDEX_MAP: Record<string, { symbol: string; name: string }> = {
  KOSPI:    { symbol: '^KS11',   name: '코스피' },
  KOSDAQ:   { symbol: '^KQ11',   name: '코스닥' },
  SP500:    { symbol: '^GSPC',   name: 'S&P 500' },
  NASDAQ:   { symbol: '^IXIC',   name: '나스닥' },
  DOW:      { symbol: '^DJI',    name: '다우존스' },
  NIKKEI:   { symbol: '^N225',   name: '니케이 225' },
  SHANGHAI: { symbol: '000001.SS', name: '상하이종합' },
  FTSE:     { symbol: '^FTSE',   name: 'FTSE 100' },
}

export async function GET() {
  const cached = cacheGet('indices:all')
  if (cached) return NextResponse.json(cached)

  const data: any[] = []

  for (const [code, { symbol, name }] of Object.entries(INDEX_MAP)) {
    try {
      const quote = await yf.quote(symbol)
      if (!quote.regularMarketPrice) continue

      data.push({
        code,
        name,
        value: +(quote.regularMarketPrice.toFixed(2)),
        prev_close: +(quote.regularMarketPreviousClose?.toFixed(2) ?? 0),
        change: +((quote.regularMarketChange ?? 0).toFixed(2)),
        change_pct: +((quote.regularMarketChangePercent ?? 0).toFixed(3)),
      })
    } catch {
      continue
    }
  }

  const result = {
    data,
    meta: { count: data.length, updated_at: new Date().toISOString() },
  }

  cacheSet('indices:all', result, 15 * 60 * 1000) // 15분
  return NextResponse.json(result)
}
