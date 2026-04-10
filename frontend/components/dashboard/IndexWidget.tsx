'use client'

import { formatChangePct, getChangeColor } from '@/lib/utils'

interface IndexWidgetProps {
  code: string
  name: string
  value: number
  change: number
  changePct: number
  isLoading?: boolean
}

export function IndexWidget({ code, name, value, change, changePct, isLoading }: IndexWidgetProps) {
  const market = ['KOSPI', 'KOSDAQ'].includes(code) ? 'KR' : 'US'
  const colorClass = getChangeColor(changePct, market)
  const arrow = changePct > 0 ? '▲' : changePct < 0 ? '▼' : '–'

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-4 animate-pulse">
        <div className="h-4 w-20 bg-muted rounded mb-2" />
        <div className="h-6 w-24 bg-muted rounded mb-1" />
        <div className="h-4 w-16 bg-muted rounded" />
      </div>
    )
  }

  return (
    <article className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{code}</p>
      <p className="text-sm text-foreground mt-0.5">{name}</p>
      <p className="text-xl font-bold mt-2">{value.toLocaleString()}</p>
      <p className={`text-sm font-medium mt-1 ${colorClass}`}>
        {arrow} {Math.abs(change).toLocaleString()} ({formatChangePct(changePct)})
      </p>
    </article>
  )
}
