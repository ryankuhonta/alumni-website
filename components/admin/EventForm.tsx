'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logActivity } from '@/lib/activity-log'

interface EventFormProps {
  initialData?: {
    id?: string
    title: string
    description: string
    event_date: string
    event_time: string
    venue: string
    map_url: string
    cover_image?: string | null
  }
  onSave?: () => void
}

export default function EventForm({ initialData, onSave }: EventFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(
    initialData?.description || ''
  )
  const [eventDate, setEventDate] = useState(initialData?.event_date || '')
  const [eventTime, setEventTime] = useState(initialData?.event_time || '')
  const [venue, setVenue] = useState(initialData?.venue || '')
  const [mapUrl, setMapUrl] = useState(initialData?.map_url || '')
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
      const filePath = `events/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, imageFile, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Failed to upload image.')
        setLoading(false)
        return
      }

      const { data } = supabase.storage.from('events').getPublicUrl(filePath)
      coverImage = data.publicUrl
    }

    const data = {
      title,
      description,
      event_date: eventDate,
      event_time: eventTime || null,
      venue: venue || null,
      map_url: mapUrl || null,
      cover_image: coverImage,
      created_by: user!.id,
    }

    let error = null
    let insertedId = null

    if (initialData?.id) {
      const { error: updateError } = await supabase.from('events').update(data).eq('id', initialData.id)
      error = updateError
    } else {
      const { data: insertData, error: insertError } = await supabase.from('events').insert(data).select('id').single()
      error = insertError
      insertedId = insertData?.id
    }

    if (error) {
      console.error('Error saving event:', error)
      alert('Failed to save event: ' + error.message)
    } else {
      if (initialData?.id) {
        await logActivity({
          action: 'event.update',
          targetType: 'event',
          targetId: initialData.id,
          targetName: title,
          details: {
            before: { title: initialData.title, event_date: initialData.event_date },
            after: { title, event_date: eventDate }
          }
        })
      } else {
        await logActivity({
          action: 'event.create',
          targetType: 'event',
          targetId: insertedId,
          targetName: title,
          details: { after: { title, event_date: eventDate } }
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
      setDescription('')
      setEventDate('')
      setEventTime('')
      setVenue('')
      setMapUrl('')
      setImageFile(null)
      setImagePreview(null)
      router.refresh()
    }
  }

  const inputClass = 'w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className={inputClass}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date *</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time</label>
          <input
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Venue</label>
        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Map URL</label>
        <input
          type="url"
          value={mapUrl}
          onChange={(e) => setMapUrl(e.target.value)}
          placeholder="https://maps.google.com/..."
          className={inputClass}
        />
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
          ? 'Update Event'
          : 'Create Event'}
      </button>
    </form>
  )
}
