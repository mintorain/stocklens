'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { IndexWidget } from './IndexWidget'

const REFRESH_INTERVAL = 30_000 // 30초

export function IndexGrid() {
  const [indices, setIndices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [source, setSource] = useState<string>('')
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const fetchData = useCallback(async () => {
    try {
      const res = await api.getIndices()
      setIndices(res.data)
      setLastUpdate(new Date().toLocaleTimeString('ko-KR'))
      setSource(res.meta?.source ?? '')
    } catch { /* 무시 — 다음 주기에 재시도 */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [fetchData])

  const placeholders = Array.from({ length: 8 })

  return (
    <section aria-labelledby="indices-heading">
      <div className="flex items-center justify-between mb-3">
        <h2 id="indices-heading" className="text-lg font-semibold">주요 지수</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {source && <span className="px-1.5 py-0.5 rounded bg-muted">{source}</span>}
          {lastUpdate && (
            <span aria-live="polite">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" aria-hidden="true" />
              {lastUpdate}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading
          ? placeholders.map((_, i) => <IndexWidget key={i} code="" name="" value={0} change={0} changePct={0} isLoading />)
          : indices.map((idx) => (
              <IndexWidget
                key={idx.code}
                code={idx.code}
                name={idx.name}
                value={idx.value}
                change={idx.change}
                changePct={idx.change_pct}
              />
            ))}
      </div>
    </section>
  )
}
