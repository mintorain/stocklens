async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
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
  getIndices: () =>
    request<{ data: any[]; meta: any }>('/api/indices'),

  searchStocks: (q: string, market = 'ALL') =>
    request<{ data: any[]; meta: any }>(`/api/stocks?action=search&q=${encodeURIComponent(q)}&market=${market}`),

  getStock: (ticker: string, market = 'KR') =>
    request<{ data: any }>(`/api/stocks?ticker=${ticker}&market=${market}`),

  getPriceHistory: (ticker: string, market = 'KR', period = '1m') =>
    request<{ data: any }>(`/api/stocks?action=price&ticker=${ticker}&market=${market}&period=${period}`),

  getNewsAnalysis: (ticker: string, market = 'KR', name?: string) =>
    request<{ data: any }>(`/api/news?ticker=${ticker}&market=${market}&name=${encodeURIComponent(name ?? ticker)}`),

  getMarketSummary: () =>
    request<{ summary: string; date: string }>('/api/market'),

  // 포트폴리오는 클라이언트(Zustand persist)에서 관리 — 서버 불필요
  getPortfolio: () => Promise.resolve({ data: [], meta: { total: 0 } }),
  addToPortfolio: (_body: any) => Promise.resolve({ data: {} }),
  removeFromPortfolio: (_ticker: string) => Promise.resolve(undefined as any),
  updateGroup: (_ticker: string, _group: string) => Promise.resolve({ data: {} }),
}
