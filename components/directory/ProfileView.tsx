'use client'

import { User } from '@/types/database'
import MessageButton from './MessageButton'

interface ProfileViewProps {
  user: User
  currentUserId?: string
}

export default function ProfileView({ user, currentUserId }: ProfileViewProps) {
  const isOwnProfile = currentUserId === user.id

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-8">
        {/* Profile Header */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={`${user.first_name} ${user.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                {user.first_name[0]}{user.last_name[0]}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {user.first_name} {user.last_name}
            </h1>
            <p style={{ color: 'var(--primary-color)' }}>Batch {user.batch_year}</p>
            {user.course && <p className="text-gray-600">{user.course}</p>}
          </div>
          {!isOwnProfile && currentUserId && (
            <MessageButton userId={user.id} />
          )}
        </div>

        {/* Details */}
        <div className="space-y-4 border-t pt-6">
          {!user.privacy_company && user.current_company && (
            <div>
              <label className="text-sm text-gray-500">Company</label>
              <p className="font-medium">{user.current_company}</p>
            </div>
          )}

          {!user.privacy_location && user.location && (
            <div>
              <label className="text-sm text-gray-500">Location</label>
              <p className="font-medium">{user.location}</p>
            </div>
          )}

          {user.job_title && (
            <div>
              <label className="text-sm text-gray-500">Job Title</label>
              <p className="font-medium">{user.job_title}</p>
            </div>
          )}

          {user.mobile_number && (
            <div>
              <label className="text-sm text-gray-500">Mobile Number</label>
              <p className="font-medium">{user.mobile_number}</p>
            </div>
          )}

          {user.facebook_url && (
            <div>
              <label className="text-sm text-gray-500">Facebook</label>
              <p className="font-medium">
                <a href={user.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--primary-color)' }}>
                  View Profile
                </a>
              </p>
            </div>
          )}

          {user.linkedin_url && (
            <div>
              <label className="text-sm text-gray-500">LinkedIn</label>
              <p className="font-medium">
                <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--primary-color)' }}>
                  View Profile
                </a>
              </p>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-500">Member since</label>
            <p className="font-medium">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
