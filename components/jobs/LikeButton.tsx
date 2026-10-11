'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LikeButtonProps {
  jobId: string
  initialCount?: number
}

export default function LikeButton({ jobId, initialCount = 0 }: LikeButtonProps) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchState = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const [{ count }, { data: existing }] = await Promise.all([
        supabase
          .from('job_likes')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', jobId),
        supabase
          .from('job_likes')
          .select('id')
          .eq('job_id', jobId)
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      setCount(count || 0)
      setLiked(!!existing)
      setLoading(false)
    }
    fetchState()
  }, [jobId])

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // Optimistic update
    const prevLiked = liked
    const prevCount = count
    setLiked(!prevLiked)
    setCount(prevCount + (prevLiked ? -1 : 1))

    if (prevLiked) {
      const { error } = await supabase
        .from('job_likes')
        .delete()
        .eq('job_id', jobId)
        .eq('user_id', user.id)
      if (error) {
        setLiked(prevLiked)
        setCount(prevCount)
      }
    } else {
      const { error } = await supabase
        .from('job_likes')
        .insert({ job_id: jobId, user_id: user.id })
      if (error) {
        setLiked(prevLiked)
        setCount(prevCount)
      }
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={liked ? 'Unlike this post' : 'Like this post'}
      className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition disabled:opacity-50"
    >
      <span className={liked ? 'text-red-500' : ''}>{liked ? '❤️' : '🤍'}</span>
      <span>{count}</span>
    </button>
  )
}
