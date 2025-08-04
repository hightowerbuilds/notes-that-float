import { useState, useEffect, useCallback } from 'react'

interface CachedImage {
  src: string
  loaded: boolean
  error: boolean
  element: HTMLImageElement | null
}

export function useImageCache(imageUrls: string[]) {
  const [cachedImages, setCachedImages] = useState<Map<string, CachedImage>>(new Map())
  const [loadingCount, setLoadingCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)

  const preloadImage = useCallback((url: string): Promise<CachedImage> => {
    return new Promise((resolve) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          src: url,
          loaded: true,
          error: false,
          element: img
        })
      }
      
      img.onerror = () => {
        resolve({
          src: url,
          loaded: false,
          error: true,
          element: null
        })
      }
      
      img.src = url
    })
  }, [])

  const preloadImages = useCallback(async (urls: string[]) => {
    setLoadingCount(urls.length)
    setErrorCount(0)
    
    const newCache = new Map<string, CachedImage>()
    
    // Preload all images concurrently
    const preloadPromises = urls.map(async (url) => {
      const cached = await preloadImage(url)
      newCache.set(url, cached)
      
      if (cached.loaded) {
        setLoadingCount(prev => prev - 1)
      } else if (cached.error) {
        setLoadingCount(prev => prev - 1)
        setErrorCount(prev => prev + 1)
      }
      
      return cached
    })
    
    await Promise.all(preloadPromises)
    setCachedImages(newCache)
  }, [preloadImage])

  useEffect(() => {
    if (imageUrls.length > 0) {
      preloadImages(imageUrls)
    }
  }, [imageUrls, preloadImages])

  const getImage = useCallback((url: string): CachedImage | undefined => {
    return cachedImages.get(url)
  }, [cachedImages])

  const isImageLoaded = useCallback((url: string): boolean => {
    const cached = cachedImages.get(url)
    return cached?.loaded || false
  }, [cachedImages])

  const getLoadingProgress = useCallback((): number => {
    if (imageUrls.length === 0) return 0
    return ((imageUrls.length - loadingCount - errorCount) / imageUrls.length) * 100
  }, [imageUrls.length, loadingCount, errorCount])

  return {
    cachedImages,
    loadingCount,
    errorCount,
    getImage,
    isImageLoaded,
    getLoadingProgress,
    isLoading: loadingCount > 0,
    hasErrors: errorCount > 0
  }
} 