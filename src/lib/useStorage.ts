import { useState, useCallback } from 'react'
import type { ImageObject } from './storage'
import { STORAGE_BUCKETS, listImages, getImage } from './storage'

export function useStorage() {
  const [images, setImages] = useState<ImageObject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Function to load images from a bucket
  const loadImages = useCallback(async (bucket: string, folder?: string) => {
    setLoading(true)
    setError(null)
    try {
      const imageList = await listImages(bucket, folder)
      setImages(imageList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images')
    } finally {
      setLoading(false)
    }
  }, []) // Empty dependency array since this function doesn't depend on any props or state

  // Function to get a single image
  const getImageFromStorage = useCallback((bucket: string, path: string): ImageObject => {
    return getImage(bucket, path)
  }, []) // Empty dependency array since this function doesn't depend on any props or state

  return {
    images,
    loading,
    error,
    loadImages,
    getImageFromStorage,
    STORAGE_BUCKETS
  }
} 