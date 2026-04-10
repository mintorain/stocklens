const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: res.statusText } }))
    throw new Error(error?.error?.message ?? res.statusText)
  }
  return res.json()
}

export const api = {
  getIndices: () => request<{ data: any[]; meta: any }>('/api/v1/indices'),

  searchStocks: (q: string, market = 'ALL') =>
    request<{ data: any[]; meta: any }>(`/api/v1/stocks/search?q=${encodeURIComponent(q)}&market=${market}`),

  getStock: (ticker: string, market = 'KR') =>
    request<{ data: any }>(`/api/v1/stocks/${ticker}?market=${market}`),

  getPriceHistory: (ticker: string, market = 'KR', period = '1m') =>
    request<{ data: any }>(`/api/v1/stocks/${ticker}/price?market=${market}&period=${period}`),

  getNewsAnalysis: (ticker: string, market = 'KR') =>
    request<{ data: any }>(`/api/v1/stocks/${ticker}/news?market=${market}`),

  getPortfolio: () => request<{ data: any[]; meta: any }>('/api/v1/portfolio'),

  addToPortfolio: (body: { ticker: string; exchange: string; market: string; group_name?: string }) =>
    request<{ data: any }>('/api/v1/portfolio', { method: 'POST', body: JSON.stringify(body) }),

  removeFromPortfolio: (ticker: string) =>
    request<void>(`/api/v1/portfolio/${ticker}`, { method: 'DELETE' }),

  updateGroup: (ticker: string, groupName: string) =>
    request<{ data: any }>(`/api/v1/portfolio/${ticker}`, {
      method: 'PATCH',
      body: JSON.stringify({ group_name: groupName }),
    }),

  getMarketSummary: () =>
    request<{ summary: string; date: string }>('/api/v1/market/summary'),
}
