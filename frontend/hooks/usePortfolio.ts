'use client'

import { useEffect } from 'react'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import type { PortfolioItem } from '@/types'

export function usePortfolio() {
  const { portfolio, setPortfolio, removeFromPortfolio, addToPortfolio } = useAppStore()

  useEffect(() => {
    api.getPortfolio()
      .then((res) =>
        setPortfolio(
          res.data.map((d: any): PortfolioItem => ({
            id: d.id,
            ticker: d.ticker,
            name: d.name,
            exchange: d.exchange,
            groupName: d.group_name,
            currentPrice: d.current_price,
            changePct: d.change_pct,
            sentiment: d.sentiment,
            sentimentScore: d.sentiment_score,
            lastAnalysis: d.last_analysis,
          }))
        )
      )
      .catch(console.error)
  }, [setPortfolio])

  const remove = async (ticker: string) => {
    await api.removeFromPortfolio(ticker)
    removeFromPortfolio(ticker)
  }

  return { portfolio, addToPortfolio, remove }
}
