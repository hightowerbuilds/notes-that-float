import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '../../components/Navbar/Navbar'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { useState, useEffect } from 'react'
import { useImageCache } from '../../lib/useImageCache'
import './zine-one.css'

export const Route = createFileRoute('/zine-one/')({
  component: ZineOnePage,
})

function ZineOnePage() {
  const [isCarouselOpen, setIsCarouselOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Use the image caching hook
  const { 
    isLoading, 
    hasErrors, 
    getLoadingProgress, 
    isImageLoaded 
  } = useImageCache(images)

  useEffect(() => {
    loadZineImages()
  }, [])

  const loadZineImages = async () => {
    try {
      setError(null)
      
      const baseUrl = 'https://gbnizxzurmbzeelacztr.supabase.co/storage/v1/object/public/images/brontosaurus-publications/zine-one'
      
      // Load the 14 known zine pages
      const zinePages = []
      for (let i = 1; i <= 14; i++) {
        zinePages.push(`${baseUrl}/page-${i}.jpg`)
      }
      
      setImages(zinePages)
      
    } catch (err) {
      console.error('Error loading zine images:', err)
      setError('Failed to load zine images')
    }
  }

  const next = () => setCurrentIndex(i => (i + 1) % images.length)
  const prev = () => setCurrentIndex(i => (i - 1 + images.length) % images.length)

  const handleOpenCarousel = () => {
    setIsCarouselOpen(true)
    setIsFullscreen(false)
  }

  const handleCloseCarousel = () => {
    setIsCarouselOpen(false)
    setIsFullscreen(false)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className="page-container">
      <Navbar />
      <Canvas style={{position: 'fixed', zIndex:0, top: 0, left: 0, width: '100%', height: '100vh'}}>
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      </Canvas>
      
      <main className="main-content">
        <div className="zine-one-content">
          <h1 className="page-title">Bronto Zine One</h1>
          <div className="zine-cover">
            <img 
              src="https://gbnizxzurmbzeelacztr.supabase.co/storage/v1/object/public/images/brontosaurus-publications/BrontoZineOneCover.jpg" 
              alt="Bronto Zine One Cover" 
              onError={() => setError('Failed to load cover image')}
            />
          </div>
          <div className="zine-description">
         <p>2013 common era</p>
            {isLoading && (
              <div className="loading-message">
                <span className="loading"></span>
                Loading zine pages... {Math.round(getLoadingProgress())}%
              </div>
            )}
            
            {error && (
              <div className="error-message">
                {error}
                <button onClick={loadZineImages} className="retry-button">
                  Try Again
                </button>
              </div>
            )}
            
            {hasErrors && (
              <div className="warning-message">
                Some images failed to load, but you can still view the zine.
              </div>
            )}
            
            {!isLoading && !error && images.length > 0 && (
              <button 
                className="view-zine-button" 
                onClick={handleOpenCarousel}
              >
                View Full Zine ({images.length} pages)
              </button>
            )}
            
            {!isLoading && !error && images.length === 0 && (
              <div className="no-images-message">
                No zine pages found. Please check the storage configuration.
              </div>
            )}
          </div>
        </div>
      </main>

      {isCarouselOpen && images.length > 0 && (
        <div className={`zine-carousel-overlay ${isFullscreen ? 'fullscreen' : ''}`} onClick={handleCloseCarousel}>
          <div className={`zine-carousel-content ${isFullscreen ? 'fullscreen' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="zine-carousel-header">
              <button className="zine-carousel-close" onClick={handleCloseCarousel}>×</button>
              <button className="zine-carousel-fullscreen" onClick={toggleFullscreen}>
                {isFullscreen ? '⤓' : '⤢'}
              </button>
            </div>
            
            <div className="zine-carousel-image-container">
              {!isImageLoaded(images[currentIndex]) && (
                <div className="image-loading-overlay">
                  <span className="loading"></span>
                  Loading page {currentIndex + 1}...
                </div>
              )}
              <img 
                src={images[currentIndex]} 
                alt={`Page ${currentIndex + 1}`} 
                className={`zine-carousel-image ${isFullscreen ? 'fullscreen' : ''}`}
                style={{ opacity: isImageLoaded(images[currentIndex]) ? 1 : 0.3 }}
              />
            </div>
            
            <div className="zine-carousel-controls">
              <button onClick={prev} disabled={images.length <= 1}>←</button>
              <span>{currentIndex + 1} / {images.length}</span>
              <button onClick={next} disabled={images.length <= 1}>→</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 