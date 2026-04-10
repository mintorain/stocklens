'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'

export function SearchBar() {
  const { searchQuery, setSearchQuery, setSearchResults, setSearchOpen } = useAppStore()
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }
    try {
      const res = await api.searchStocks(q)
      setSearchResults(res.data)
      setSearchOpen(true)
    } catch {
      setSearchResults([])
    }
  }, [setSearchResults, setSearchOpen])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(localQuery), 350)
    return () => clearTimeout(debounceRef.current)
  }, [localQuery, search])

  return (
    <div role="search">
      <label htmlFor="stock-search" className="sr-only">종목 검색</label>
      <input
        id="stock-search"
        type="search"
        value={localQuery}
        onChange={(e) => {
          setLocalQuery(e.target.value)
          setSearchQuery(e.target.value)
        }}
        onFocus={() => localQuery.length >= 2 && setSearchOpen(true)}
        placeholder="종목명 또는 티커 검색 (예: 삼성전자, AAPL)"
        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="종목 검색"
        autoComplete="off"
      />
    </div>
  )
}
