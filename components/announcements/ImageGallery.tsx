'use client'

import { useState } from 'react'

interface ImageGalleryProps {
  images: string[]
  alt: string
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (images.length === 0) return null

  if (images.length === 1) {
    return (
      <>
        <img
          src={images[0]}
          alt={alt}
          className="mt-4 rounded max-h-64 object-cover cursor-pointer hover:opacity-90 transition"
          onClick={() => setLightbox(0)}
        />
        {lightbox !== null && (
          <Lightbox images={images} index={lightbox} alt={alt} onClose={() => setLightbox(null)} onNavigate={setLightbox} />
        )}
      </>
    )
  }

  return (
    <>
      <div className="mt-4 space-y-2">
        <img
          src={images[0]}
          alt={alt}
          className="w-full max-h-80 object-cover rounded cursor-pointer hover:opacity-90 transition"
          onClick={() => setLightbox(0)}
        />
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(1).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${alt} - ${i + 2}`}
                className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-90 transition"
                onClick={() => setLightbox(i + 1)}
              />
            ))}
          </div>
        )}
      </div>
      {lightbox !== null && (
        <Lightbox images={images} index={lightbox} alt={alt} onClose={() => setLightbox(null)} onNavigate={setLightbox} />
      )}
    </>
  )
}

function Lightbox({
  images,
  index,
  alt,
  onClose,
  onNavigate,
}: {
  images: string[]
  index: number
  alt: string
  onClose: () => void
  onNavigate: (i: number) => void
}) {
  const prev = () => onNavigate(index === 0 ? images.length - 1 : index - 1)
  const next = () => onNavigate(index === images.length - 1 ? 0 : index + 1)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>

      {images.length > 1 && (
        <button
          className="absolute left-4 text-white text-4xl hover:text-gray-300"
          onClick={(e) => { e.stopPropagation(); prev() }}
          aria-label="Previous image"
        >
          ‹
        </button>
      )}

      <img
        src={images[index]}
        alt={alt}
        className="max-h-[85vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button
          className="absolute right-4 text-white text-4xl hover:text-gray-300"
          onClick={(e) => { e.stopPropagation(); next() }}
          aria-label="Next image"
        >
          ›
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 text-white text-sm">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
