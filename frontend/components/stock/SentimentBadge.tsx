import { getSentimentColor, getSentimentLabel } from '@/lib/utils'

interface SentimentBadgeProps {
  sentiment: 'positive' | 'neutral' | 'negative' | null
  score: number | null
  showBar?: boolean
}

export function SentimentBadge({ sentiment, score, showBar = true }: SentimentBadgeProps) {
  const label = getSentimentLabel(sentiment)
  const colorClass = getSentimentColor(sentiment)
  const barColor = sentiment === 'positive' ? 'bg-green-500' : sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'
  const barWidth = score != null ? Math.round(Math.abs(score) * 100) : 0

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-semibold ${colorClass}`}>{label}</span>
      {showBar && score != null && (
        <div className="flex-1 max-w-[100px] h-2 bg-muted rounded-full overflow-hidden" aria-hidden="true">
          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${barWidth}%` }} />
        </div>
      )}
      {score != null && (
        <span className="text-xs text-muted-foreground">{(score > 0 ? '+' : '') + score.toFixed(2)}</span>
      )}
    </div>
  )
}
