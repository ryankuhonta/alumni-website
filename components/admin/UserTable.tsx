'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, UserStatus } from '@/types/database'

interface UserTableProps {
  users: User[]
}

export default function UserTable({ users: initialUsers }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)

  const updateStatus = async (userId: string, status: UserStatus) => {
    setLoading(userId)
    const supabase = createClient()

    const { error } = await supabase.rpc('admin_update_user_status', {
      target_user_id: userId,
      new_status: status,
    })

    if (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status: ' + error.message)
    } else {
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, status } : u))
      )
    }

    setLoading(null)
  }

  const statusColors = {
    approved: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    banned: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Batch</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b hover:bg-gray-50">
              <td className="p-3">
                {user.first_name} {user.last_name}
              </td>
              <td className="p-3">{user.email}</td>
              <td className="p-3">{user.batch_year}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    statusColors[user.status]
                  }`}
                >
                  {user.status}
                </span>
              </td>
              <td className="p-3 space-x-2">
                {user.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(user.id, 'approved')}
                    disabled={loading === user.id}
                    className="text-blue-600 hover:underline"
                  >
                    Approve
                  </button>
                )}
                {user.status !== 'rejected' && (
                  <button
                    onClick={() => updateStatus(user.id, 'rejected')}
                    disabled={loading === user.id}
                    className="text-red-600 hover:underline"
                  >
                    Reject
                  </button>
                )}
                {user.status !== 'banned' && (
                  <button
                    onClick={() => updateStatus(user.id, 'banned')}
                    disabled={loading === user.id}
                    className="text-gray-600 hover:underline"
                  >
                    Ban
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
