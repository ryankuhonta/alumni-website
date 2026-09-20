'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, UserStatus, UserRole } from '@/types/database'
import { logActivity } from '@/lib/activity-log'

interface UserTableProps {
  users: User[]
}

export default function UserTable({ users: initialUsers }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmRole, setConfirmRole] = useState<{ userId: string; newRole: UserRole; userName: string } | null>(null)

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
      const user = users.find(u => u.id === userId)
      if (user) {
        await logActivity({
          action: `user.${status}`,
          targetType: 'user',
          targetId: userId,
          targetName: user.email,
          details: {
            before: { status: user.status },
            after: { status }
          }
        })
      }
    }

    setLoading(null)
  }

  const updateRole = async (userId: string, newRole: UserRole) => {
    setLoading(userId)
    setConfirmRole(null)

    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert('Failed to update role: ' + (data.error || 'Unknown error'))
      } else {
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        )
      }
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update role')
    }

    setLoading(null)
  }

  const handleRoleChange = (userId: string, newRole: UserRole, userName: string) => {
    setConfirmRole({ userId, newRole, userName })
  }

  const statusColors: Record<UserStatus, string> = {
    approved: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    banned: 'bg-gray-100 text-gray-800',
  }

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-purple-100 text-purple-800',
    moderator: 'bg-green-100 text-green-800',
    alumni: 'bg-blue-100 text-blue-800',
    teacher: 'bg-orange-100 text-orange-800',
  }

  return (
    <div className="overflow-x-auto">
      {/* Confirmation Modal */}
      {confirmRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Confirm Role Change</h3>
            <p className="mb-4">
              Are you sure you want to change <strong>{confirmRole.userName}</strong> to{' '}
              <span className={`px-2 py-1 rounded text-sm ${roleColors[confirmRole.newRole]}`}>
                {confirmRole.newRole}
              </span>?
            </p>
            {confirmRole.newRole === 'alumni' && (
              <p className="text-sm text-gray-500 mb-4">
                This will remove their admin/moderator privileges.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmRole(null)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateRole(confirmRole.userId, confirmRole.newRole)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Batch</th>
            <th className="text-left p-3">Role</th>
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
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole, `${user.first_name} ${user.last_name}`)}
                  disabled={loading === user.id}
                  className={`px-2 py-1 rounded text-sm border cursor-pointer ${
                    roleColors[user.role]
                  }`}
                >
                  <option value="alumni">Alumni</option>
                  <option value="teacher">Teacher</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
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
