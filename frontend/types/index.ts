export interface IndexData {
  code: string
  name: string
  value: number
  change: number
  changePct: number
  prevClose: number
  updatedAt: string
}

export interface StockDetail {
  ticker: string
  name: string
  exchange: string
  market: 'KR' | 'US'
  currentPrice: number
  open: number
  high: number
  low: number
  volume: number
  marketCap: number | null
  per: number | null
  pbr: number | null
  eps: number | null
  week52High: number | null
  week52Low: number | null
  change: number
  changePct: number
  updatedAt: string
}

export interface CandleData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface NewsSource {
  title: string
  url: string
  source: string
  publishedAt: string
  summary?: string
}

export interface NewsAnalysis {
  ticker: string
  analysisDate: string
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  summary: [string, string, string]
  reasoning: string
  newsSources: NewsSource[]
  newsCount: number
  updatedAt: string
}

export interface PortfolioItem {
  id: string
  ticker: string
  name: string
  exchange: string
  groupName: string
  currentPrice: number | null
  changePct: number | null
  sentiment: 'positive' | 'neutral' | 'negative' | null
  sentimentScore: number | null
  lastAnalysis: string | null
}

export interface StockSearchResult {
  ticker: string
  name: string
  exchange: string
  market: string
  currentPrice: number | null
  changePct: number | null
  inPortfolio: boolean
}
