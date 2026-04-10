'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { IndexData } from '@/types'

export function useIndices() {
  const [indices, setIndices] = useState<IndexData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getIndices()
      .then((res) =>
        setIndices(
          res.data.map((d: any) => ({
            code: d.code,
            name: d.name,
            value: d.value,
            change: d.change,
            changePct: d.change_pct,
            prevClose: d.prev_close,
            updatedAt: res.meta?.updated_at ?? '',
          }))
        )
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { indices, loading, error }
}
