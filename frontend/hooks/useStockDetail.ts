'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { StockDetail } from '@/types'

export function useStockDetail(ticker: string, market: string) {
  const [data, setData] = useState<StockDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    api.getStock(ticker, market)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [ticker, market])

  return { data, loading, error }
}
