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
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editBatchYear, setEditBatchYear] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

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

  const openEdit = (user: User) => {
    setEditUser(user)
    setEditFirstName(user.first_name)
    setEditLastName(user.last_name)
    setEditBatchYear(String(user.batch_year))
    setEditError(null)
  }

  const closeEdit = () => {
    setEditUser(null)
    setEditError(null)
  }

  const saveEdit = async () => {
    if (!editUser) return

    setLoading(editUser.id)
    setEditError(null)

    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editFirstName,
          lastName: editLastName,
          batchYear: Number(editBatchYear),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setEditError(data.error || 'Failed to update user')
        return
      }

      setUsers(users.map((u) => (u.id === editUser.id ? { ...u, ...data.user } : u)))
      setEditUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
      setEditError('Failed to update user')
    } finally {
      setLoading(null)
    }
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
      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Edit User</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">First name</label>
                <input
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Last name</label>
                <input
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Batch year</label>
                <input
                  type="number"
                  value={editBatchYear}
                  onChange={(e) => setEditBatchYear(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use 0 for teachers. Changing this moves the user to that batch group automatically.
                </p>
              </div>
            </div>

            {editError && <p className="text-sm text-red-600 mt-3">{editError}</p>}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeEdit}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={loading === editUser.id}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading === editUser.id ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <button
                  onClick={() => openEdit(user)}
                  disabled={loading === user.id}
                  className="text-gray-700 hover:underline"
                >
                  Edit
                </button>
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
