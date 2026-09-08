'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function SearchFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [batch, setBatch] = useState(searchParams.get('batch') || '')

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (batch) params.set('batch', batch)
    router.push(`/directory?${params.toString()}`)
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 border rounded px-4 py-2"
      />
      <input
        type="number"
        placeholder="Batch year"
        value={batch}
        onChange={(e) => setBatch(e.target.value)}
        className="w-32 border rounded px-4 py-2"
      />
      <button
        onClick={handleSearch}
        className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
      >
        Search
      </button>
    </div>
  )
}
