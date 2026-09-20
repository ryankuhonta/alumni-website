'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function SearchFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [batch, setBatch] = useState(searchParams.get('batch') || '')
  const activeRole = searchParams.get('role') || 'all'

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (batch && activeRole !== 'teacher') params.set('batch', batch)
    if (activeRole !== 'all') params.set('role', activeRole)
    router.push(`/directory?${params.toString()}`)
  }

  const handleRoleChange = (role: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (batch && role !== 'teacher') params.set('batch', batch)
    if (role !== 'all') params.set('role', role)
    router.push(`/directory?${params.toString()}`)
  }

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'alumni', label: 'Alumni' },
    { key: 'teacher', label: 'Teachers' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleRoleChange(tab.key)}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              activeRole === tab.key
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={activeRole === tab.key ? { backgroundColor: 'var(--primary-color)' } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 border rounded px-4 py-2"
        />
        {activeRole !== 'teacher' && (
          <input
            type="number"
            placeholder="Batch year"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-32 border rounded px-4 py-2"
          />
        )}
        <button
          onClick={handleSearch}
          className="text-white px-6 py-2 rounded hover:opacity-90"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          Search
        </button>
      </div>
    </div>
  )
}
