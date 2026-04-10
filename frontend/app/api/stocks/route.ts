import { NextRequest, NextResponse } from 'next/server'
import yf from '@/lib/yahoo'
import { cacheGet, cacheSet } from '@/lib/cache'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ticker = searchParams.get('ticker')
  const market = searchParams.get('market') ?? 'KR'
  const action = searchParams.get('action') ?? 'detail'

  // 종목 검색
  if (action === 'search') {
    const q = searchParams.get('q') ?? ''
    if (q.length < 2) {
      return NextResponse.json({ error: { message: '검색어는 2자 이상 입력하세요.' } }, { status: 400 })
    }

    const cacheKey = `search:${q}`
    const cached = cacheGet(cacheKey)
    if (cached) return NextResponse.json(cached)

    try {
      const results = await yf.search(q, { quotesCount: 10, newsCount: 0 })
      const data = (results.quotes ?? [])
        .filter((r: any) => r.isYahooFinance)
        .slice(0, 10)
        .map((r: any) => ({
          ticker: r.symbol?.replace('.KS', '').replace('.KQ', '') ?? '',
          name: r.shortname ?? r.longname ?? r.symbol ?? '',
          exchange: r.exchange ?? '',
          market: r.exchange === 'KSC' || r.exchange === 'KOE' ? 'KR' : 'US',
          current_price: null,
          change_pct: null,
        }))

      const response = { data, meta: { total: data.length, query: q } }
      cacheSet(cacheKey, response, 5 * 60 * 1000) // 5분
      return NextResponse.json(response)
    } catch {
      return NextResponse.json({ data: [], meta: { total: 0, query: q } })
    }
  }

  // 주가 차트
  if (action === 'price' && ticker) {
    const period = searchParams.get('period') ?? '1m'
    const periodMap: Record<string, string> = { '1d': '1d', '1w': '5d', '1m': '1mo', '3m': '3mo' }
    const intervalMap: Record<string, string> = { '1d': '5m', '1w': '1h', '1m': '1d', '3m': '1d' }
    const yf_ticker = market === 'US' ? ticker : `${ticker}.KS`

    const cacheKey = `chart:${ticker}:${period}`
    const cached = cacheGet(cacheKey)
    if (cached) return NextResponse.json(cached)

    try {
      const hist = await yf.chart(yf_ticker, {
        period1: periodMap[period] === '1d' ? new Date(Date.now() - 86400000).toISOString().split('T')[0] : undefined,
        period2: new Date().toISOString().split('T')[0],
        interval: (intervalMap[period] ?? '1d') as any,
      })

      const candles = (hist.quotes ?? []).map((c: any) => ({
        date: c.date instanceof Date ? c.date.toISOString().split('T')[0] : String(c.date),
        open: +(c.open?.toFixed(2) ?? 0),
        high: +(c.high?.toFixed(2) ?? 0),
        low: +(c.low?.toFixed(2) ?? 0),
        close: +(c.close?.toFixed(2) ?? 0),
        volume: c.volume ?? 0,
      }))

      const result = { data: { ticker, period, candles } }
      cacheSet(cacheKey, result, 60 * 60 * 1000) // 1시간
      return NextResponse.json(result)
    } catch {
      return NextResponse.json({ data: { ticker, period, candles: [] } })
    }
  }

  // 종목 상세
  if (ticker) {
    const yf_ticker = market === 'US' ? ticker : `${ticker}.KS`
    const cacheKey = `price:${ticker}`
    const cached = cacheGet(cacheKey)
    if (cached) return NextResponse.json(cached)

    try {
      const quote = await yf.quote(yf_ticker)
      const result = {
        data: {
          ticker,
          name: quote.shortName ?? quote.longName ?? ticker,
          exchange: quote.fullExchangeName ?? '',
          market,
          current_price: quote.regularMarketPrice ?? 0,
          open: quote.regularMarketOpen ?? 0,
          high: quote.regularMarketDayHigh ?? 0,
          low: quote.regularMarketDayLow ?? 0,
          volume: quote.regularMarketVolume ?? 0,
          change: +(quote.regularMarketChange?.toFixed(2) ?? 0),
          change_pct: +(quote.regularMarketChangePercent?.toFixed(3) ?? 0),
          market_cap: quote.marketCap ?? null,
          per: quote.trailingPE ?? null,
          pbr: quote.priceToBook ?? null,
          eps: quote.epsTrailingTwelveMonths ?? null,
          week52_high: quote.fiftyTwoWeekHigh ?? null,
          week52_low: quote.fiftyTwoWeekLow ?? null,
        },
      }
      cacheSet(cacheKey, result, 15 * 60 * 1000)
      return NextResponse.json(result)
    } catch {
      return NextResponse.json({ error: { message: '종목 정보를 찾을 수 없습니다.' } }, { status: 404 })
    }
  }

  return NextResponse.json({ error: { message: 'ticker 파라미터가 필요합니다.' } }, { status: 400 })
}
