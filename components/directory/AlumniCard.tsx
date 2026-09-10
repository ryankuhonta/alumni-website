import Link from 'next/link'
import { User } from '@/types/database'

interface AlumniCardProps {
  user: User
}

export default function AlumniCard({ user }: AlumniCardProps) {
  return (
    <Link
      href={`/directory/${user.id}`}
      className="block border rounded-lg p-4 hover:shadow-lg transition"
    >
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={`${user.first_name} ${user.last_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
              {user.first_name[0]}{user.last_name[0]}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-bold">
            {user.first_name} {user.last_name}
          </h3>
          <p className="text-sm" style={{ color: 'var(--primary-color)' }}>Batch {user.batch_year}</p>
          {user.course && (
            <p className="text-gray-500 text-sm">{user.course}</p>
          )}
          {user.job_title && (
            <p className="text-gray-500 text-sm">{user.job_title}</p>
          )}
          {!user.privacy_company && user.current_company && (
            <p className="text-gray-500 text-sm">{user.current_company}</p>
          )}
          {!user.privacy_location && user.location && (
            <p className="text-gray-400 text-xs">📍 {user.location}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
