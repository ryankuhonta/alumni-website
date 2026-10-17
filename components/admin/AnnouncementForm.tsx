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
    images?: string[] | null
    expires_at?: string | null
  }
  maxImages?: number
  onSave?: () => void
}

const defaultExpiry = () => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

type ImageEntry = { file?: File; preview: string; url?: string }

export default function AnnouncementForm({
  initialData,
  maxImages = 1,
  onSave,
}: AnnouncementFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [isPinned, setIsPinned] = useState(initialData?.is_pinned || false)
  const [expiresAt, setExpiresAt] = useState(
    initialData ? (initialData.expires_at ? initialData.expires_at.split('T')[0] : '') : defaultExpiry()
  )
  const [images, setImages] = useState<ImageEntry[]>(() => {
    const existing = initialData?.images?.length
      ? initialData.images
      : initialData?.cover_image
      ? [initialData.cover_image]
      : []
    return existing.map((url) => ({ preview: url, url }))
  })
  const [compressing, setCompressing] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remaining = maxImages - images.length
      if (remaining <= 0) {
        alert(`Max ${maxImages} image${maxImages > 1 ? 's' : ''} allowed.`)
        return
      }
      const files = acceptedFiles.slice(0, remaining)

      setCompressing(true)
      try {
        const compressed = await Promise.all(
          files.map(async (file) => {
            if (file.size > 5 * 1024 * 1024) {
              throw new Error(`${file.name}: max 5 MB`)
            }
            return imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1200,
              useWebWorker: true,
            })
          })
        )
        setImages((prev) => [
          ...prev,
          ...compressed.map((f) => ({ file: f, preview: URL.createObjectURL(f) })),
        ])
      } catch (err) {
        console.error('Compression failed:', err)
        alert(err instanceof Error ? err.message : 'Failed to compress image.')
      }
      setCompressing(false)
    },
    [maxImages, images.length]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    maxFiles: maxImages,
    multiple: true,
    disabled: images.length >= maxImages,
  })

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Upload new files, keep existing URLs
    const urls: string[] = []
    for (const entry of images) {
      if (entry.url) {
        urls.push(entry.url)
      } else if (entry.file) {
        const fileExt = entry.file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`
        const filePath = `announcements/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('announcements')
          .upload(filePath, entry.file, { upsert: true })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          alert('Failed to upload image: ' + uploadError.message)
          setLoading(false)
          return
        }

        const { data } = supabase.storage.from('announcements').getPublicUrl(filePath)
        urls.push(data.publicUrl)
      }
    }

    const data = {
      title,
      content,
      is_pinned: isPinned,
      cover_image: urls[0] || null,
      images: urls.length > 0 ? urls : null,
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
      const { data: insertData, error: insertError } = await supabase
        .from('announcements')
        .insert(data)
        .select('id')
        .single()
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
            after: { title, is_pinned: isPinned },
          },
        })
      } else {
        await logActivity({
          action: 'announcement.create',
          targetType: 'announcement',
          targetId: insertedId,
          targetName: title,
          details: { after: { title, is_pinned: isPinned } },
        })
      }
    }

    setLoading(false)
    if (initialData?.id) {
      router.refresh()
      onSave?.()
    } else {
      setTitle('')
      setContent('')
      setIsPinned(false)
      setExpiresAt('')
      setImages([])
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Content *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={6}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Images {maxImages > 1 && <span className="text-gray-400 font-normal">(up to {maxImages})</span>}
        </label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
            images.length >= maxImages
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : isDragActive
              ? 'border-blue-500 bg-blue-50 cursor-pointer'
              : 'border-gray-300 hover:border-gray-400 cursor-pointer'
          }`}
        >
          <input {...getInputProps()} />
          {compressing ? (
            <p className="text-gray-500">Compressing image...</p>
          ) : images.length >= maxImages ? (
            <p className="text-gray-500">Max {maxImages} image{maxImages > 1 ? 's' : ''} reached. Remove one to add more.</p>
          ) : (
            <div className="text-gray-500">
              <p className="text-lg mb-1">📷 Drop images here</p>
              <p className="text-sm">— or —</p>
              <p className="text-sm mt-1">Click to browse ({maxImages - images.length} remaining)</p>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {images.map((entry, i) => (
              <div key={i} className="relative group">
                <img
                  src={entry.preview}
                  alt={`Image ${i + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Defaults to 30 days from now. Clear for no expiry. Announcement will be hidden on this date.
        </p>
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
