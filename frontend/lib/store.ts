import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PortfolioItem, StockSearchResult } from '@/types'

interface AppStore {
  portfolio: PortfolioItem[]
  setPortfolio: (items: PortfolioItem[]) => void
  addToPortfolio: (item: PortfolioItem) => void
  removeFromPortfolio: (ticker: string) => void
  updateGroup: (ticker: string, group: string) => void

  searchQuery: string
  searchResults: StockSearchResult[]
  isSearchOpen: boolean
  setSearchQuery: (q: string) => void
  setSearchResults: (results: StockSearchResult[]) => void
  setSearchOpen: (open: boolean) => void

  selectedTicker: string | null
  setSelectedTicker: (ticker: string | null) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      portfolio: [],
      setPortfolio: (items) => set({ portfolio: items }),
      addToPortfolio: (item) =>
        set((state) => ({
          portfolio: state.portfolio.find((p) => p.ticker === item.ticker)
            ? state.portfolio
            : [...state.portfolio, item],
        })),
      removeFromPortfolio: (ticker) =>
        set((state) => ({ portfolio: state.portfolio.filter((p) => p.ticker !== ticker) })),
      updateGroup: (ticker, group) =>
        set((state) => ({
          portfolio: state.portfolio.map((p) =>
            p.ticker === ticker ? { ...p, groupName: group } : p
          ),
        })),

      searchQuery: '',
      searchResults: [],
      isSearchOpen: false,
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSearchResults: (results) => set({ searchResults: results }),
      setSearchOpen: (open) => set({ isSearchOpen: open }),

      selectedTicker: null,
      setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),
    }),
    { name: 'stocklens-store', partialize: (s) => ({ portfolio: s.portfolio }) }
  )
)
