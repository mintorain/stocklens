'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { IndexWidget } from './IndexWidget'

export function IndexGrid() {
  const [indices, setIndices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getIndices()
      .then((res) => setIndices(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const placeholders = Array.from({ length: 8 })

  return (
    <section aria-labelledby="indices-heading">
      <h2 id="indices-heading" className="text-lg font-semibold mb-3">주요 지수</h2>
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
