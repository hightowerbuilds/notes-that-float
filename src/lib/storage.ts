import { supabase } from './supabase'

// Types for our storage
export type ImageObject = {
  name: string
  url: string
  bucket: string
  path: string
}

// Storage bucket names and paths
export const STORAGE_BUCKETS = {
  IMAGES: 'images',
  EAGLE_PHOTOS_PATH: 'eagle-photos'
} as const

// Base URL for public storage
const STORAGE_URL = 'https://gbnizxzurmbzeelacztr.supabase.co/storage/v1/object/public'

// Test function to verify bucket access
export async function testBucketAccess(bucket: string, folder?: string) {
  console.log('Testing bucket access:', { bucket, folder })
  
  // First, try to get bucket info
  const { data: buckets, error: bucketsError } = await supabase
    .storage
    .listBuckets()
  
  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError)
    return { success: false, error: bucketsError }
  }
  
  console.log('Available buckets:', buckets)
  
  // Then try to list the specific bucket/folder
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .list(folder || '')
  
  if (error) {
    console.error('Error accessing bucket/folder:', error)
    return { success: false, error }
  }
  
  console.log('Successfully accessed bucket/folder:', { bucket, folder, data })
  return { success: true, data }
}

// Function to get the public URL for an image
export function getPublicImageUrl(bucket: string, path: string): string {
  const url = `${STORAGE_URL}/${bucket}/${path}`
  console.log('Generated public URL:', url)
  return url
}

// Function to list images from a bucket
export async function listImages(bucket: string, folder?: string): Promise<ImageObject[]> {
  console.log('Attempting to list images:', { bucket, folder })
  
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .list(folder || '')

  if (error) {
    console.error('Error listing images:', error)
    throw error
  }

  // Log the actual files we found
  console.log('Files in folder:', data?.map(file => file.name))

  if (!data || data.length === 0) {
    console.log('No images found in:', { bucket, folder })
    return []
  }

  const imageObjects = data.map(file => {
    const path = `${folder ? folder + '/' : ''}${file.name}`
    const url = getPublicImageUrl(bucket, path)
    return {
      name: file.name,
      url,
      bucket,
      path
    }
  })

  return imageObjects
}

// Function to get a single image
export function getImage(bucket: string, path: string): ImageObject {
  const url = getPublicImageUrl(bucket, path)
  return {
    name: path.split('/').pop() || path,
    url,
    bucket,
    path
  }
} 