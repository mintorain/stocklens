export function formatPrice(price: number | null | undefined, market: string = 'KR'): string {
  if (price == null) return '-'
  if (market === 'KR') {
    return new Intl.NumberFormat('ko-KR').format(Math.round(price)) + '원'
  }
  return '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)
}

export function formatChangePct(pct: number | null | undefined): string {
  if (pct == null) return '-'
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

export function formatLargeNumber(num: number | null | undefined): string {
  if (num == null) return '-'
  if (num >= 1_000_000_000_000) return `${(num / 1_000_000_000_000).toFixed(1)}조`
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(0)}억`
  if (num >= 10_000) return `${(num / 10_000).toFixed(0)}만`
  return num.toLocaleString()
}

export function formatVolume(vol: number | null | undefined): string {
  if (vol == null) return '-'
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}K`
  return vol.toLocaleString()
}

/** KR 시장: 상승=빨강, 하락=파랑 / 해외: 상승=초록, 하락=빨강 */
export function getChangeColor(pct: number | null | undefined, market: string = 'KR'): string {
  if (pct == null) return 'text-muted-foreground'
  if (market === 'KR') {
    return pct > 0 ? 'text-red-500' : pct < 0 ? 'text-blue-500' : 'text-muted-foreground'
  }
  return pct > 0 ? 'text-green-500' : pct < 0 ? 'text-red-500' : 'text-muted-foreground'
}

export function getSentimentColor(sentiment: string | null): string {
  switch (sentiment) {
    case 'positive': return 'text-green-600'
    case 'negative': return 'text-red-500'
    default: return 'text-muted-foreground'
  }
}

export function getSentimentLabel(sentiment: string | null): string {
  switch (sentiment) {
    case 'positive': return '긍정'
    case 'negative': return '부정'
    case 'neutral': return '중립'
    default: return '-'
  }
}
