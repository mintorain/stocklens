/** 간단한 인메모리 캐시 (Vercel Serverless 함수 내 warm 상태에서 유지) */
const cache = new Map<string, { data: any; expiresAt: number }>()

export function cacheGet(key: string): any | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data
}

export function cacheSet(key: string, data: any, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}
