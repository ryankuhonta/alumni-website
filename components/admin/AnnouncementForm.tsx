'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logActivity } from '@/lib/activity-log'

interface AnnouncementFormProps {
  initialData?: {
    id?: string
    title: string
    content: string
    is_pinned: boolean
    cover_image?: string | null
    expires_at?: string | null
  }
  onSave?: () => void
}

export default function AnnouncementForm({
  initialData,
  onSave,
}: AnnouncementFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [isPinned, setIsPinned] = useState(initialData?.is_pinned || false)
  const [expiresAt, setExpiresAt] = useState(initialData?.expires_at ? initialData.expires_at.split('T')[0] : '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.cover_image || null)
  const [compressing, setCompressing] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5 MB.')
      return
    }

    setCompressing(true)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      })
      setImageFile(compressed)
      setImagePreview(URL.createObjectURL(compressed))
    } catch (err) {
      console.error('Compression failed:', err)
      alert('Failed to compress image. Please try another.')
    }
    setCompressing(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    maxFiles: 1,
    multiple: false,
  })

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    let coverImage = initialData?.cover_image || null

    // Upload image if selected
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `announcements/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(filePath, imageFile, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Failed to upload image.')
        setLoading(false)
        return
      }

      const { data } = supabase.storage.from('announcements').getPublicUrl(filePath)
      coverImage = data.publicUrl
    }

    const data = {
      title,
      content,
      is_pinned: isPinned,
      cover_image: coverImage,
      expires_at: expiresAt ? new Date(expiresAt + 'T00:00:00').toISOString() : null,
      created_by: user!.id,
    }

    let error = null
    let insertedId = null

    if (initialData?.id) {
      const { error: updateError } = await supabase
        .from('announcements')
        .update(data)
        .eq('id', initialData.id)
      error = updateError
    } else {
      const { data: insertData, error: insertError } = await supabase.from('announcements').insert(data).select('id').single()
      error = insertError
      insertedId = insertData?.id
    }

    if (error) {
      console.error('Error saving announcement:', error)
      alert('Failed to save announcement: ' + error.message)
    } else {
      if (initialData?.id) {
        await logActivity({
          action: 'announcement.update',
          targetType: 'announcement',
          targetId: initialData.id,
          targetName: title,
          details: {
            before: { title: initialData.title, is_pinned: initialData.is_pinned },
            after: { title, is_pinned: isPinned }
          }
        })
      } else {
        await logActivity({
          action: 'announcement.create',
          targetType: 'announcement',
          targetId: insertedId,
          targetName: title,
          details: { after: { title, is_pinned: isPinned } }
        })
      }
    }

    setLoading(false)
    if (initialData?.id) {
      router.refresh()
      onSave?.()
    } else {
      // Clear form after successful create to prevent duplicate posts
      setTitle('')
      setContent('')
      setIsPinned(false)
      setExpiresAt('')
      setImageFile(null)
      setImagePreview(null)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Content *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={6}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cover Image</label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          {imagePreview ? (
            <div className="space-y-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-48 mx-auto rounded"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage() }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                ✕ Remove image
              </button>
            </div>
          ) : compressing ? (
            <p className="text-gray-500">Compressing image...</p>
          ) : (
            <div className="text-gray-500">
              <p className="text-lg mb-1">📷 Drop image here</p>
              <p className="text-sm">— or —</p>
              <p className="text-sm mt-1">Click to browse</p>
            </div>
          )}
        </div>
      </div>

      <label className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={isPinned}
          onChange={(e) => setIsPinned(e.target.checked)}
          className="rounded"
        />
        <span>Pin this announcement</span>
      </label>

      <div>
        <label className="block text-sm font-medium mb-1">Expiry Date (optional)</label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full border rounded px-3 py-2"
        />
        <p className="text-xs text-gray-500 mt-1">Leave blank for no expiry. Announcement will be hidden after this date.</p>
      </div>

      <button
        type="submit"
        disabled={loading || compressing}
        className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
      >
        {loading
          ? 'Saving...'
          : compressing
          ? 'Compressing...'
          : initialData?.id
          ? 'Update Announcement'
          : 'Create Announcement'}
      </button>
    </form>
  )
}
