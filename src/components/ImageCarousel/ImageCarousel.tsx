import { useState, useEffect } from 'react'
import './ImageCarousel.css'

interface ImageCarouselProps {
  isOpen: boolean
  onClose: () => void
  bucket: string
  folder: string
}

const EAGLE_IMAGES = [
  'distant-eagle.JPG',
  'eagle-closeup-2.JPG',
  'eagle-closeup-3.JPG',
  'eagle-closeup.JPG',
  'eagle.jpg',
  'eagleStalk.jpg',
  'eagle-stick-2.JPG',
  'eagle-stick.jpg'
]

export function ImageCarousel({ isOpen, onClose, bucket, folder }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const BASE_URL = 'https://gbnizxzurmbzeelacztr.supabase.co/storage/v1/object/public'

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
      setIsLoading(true)
    }
  }, [isOpen])

  // Auto-advance the carousel every 5 seconds
  useEffect(() => {
    if (!isOpen) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % EAGLE_IMAGES.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [isOpen])

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % EAGLE_IMAGES.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + EAGLE_IMAGES.length) % EAGLE_IMAGES.length)
  }

  if (!isOpen) return null

  const imageUrl = `${BASE_URL}/${bucket}/${folder}/${EAGLE_IMAGES[currentIndex]}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="carousel-container">
          <div className="image-container">
            <img 
              src={imageUrl}
              alt={EAGLE_IMAGES[currentIndex].replace('.JPG', '').replace('.jpg', '')}
              className="carousel-image"
              onLoad={() => setIsLoading(false)}
              onError={(e) => console.error('Error loading image:', e)}
            />
            {isLoading && <div className="loading-indicator">Loading...</div>}
          </div>
          
          <div className="carousel-controls">
            <button 
              onClick={goToPrevious}
              className="carousel-button"
              aria-label="Previous image"
            >
              ←
            </button>
            <div className="image-counter">
              {currentIndex + 1} / {EAGLE_IMAGES.length}
            </div>
            <button 
              onClick={goToNext}
              className="carousel-button"
              aria-label="Next image"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 