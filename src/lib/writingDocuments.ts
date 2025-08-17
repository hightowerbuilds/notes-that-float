import { supabase } from './supabase'
import type { Database } from './database.types'

type WritingDocument = Database['public']['Tables']['writing_documents']['Row']

export interface WritingDocumentService {
  getUserDocuments: (userId: string) => Promise<WritingDocument[]>
  saveDocument: (userId: string, documentId?: string, title?: string, content?: string) => Promise<string>
  loadDocument: (documentId: string, userId: string) => Promise<WritingDocument | null>
  deleteDocument: (documentId: string, userId: string) => Promise<boolean>
  updateLastOpened: (documentId: string, userId: string) => Promise<void>
  updateTitle: (documentId: string, userId: string, title: string) => Promise<boolean>
  toggleFavorite: (documentId: string, userId: string) => Promise<boolean>
}

/**
 * Get all writing documents for a user
 */
export async function getUserDocuments(userId: string): Promise<WritingDocument[]> {
  try {
    const { data, error } = await supabase
      .from('writing_documents')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching user documents:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch user documents:', error)
    return []
  }
}

/**
 * Save a writing document (create new or update existing)
 */
export async function saveDocument(
  userId: string, 
  documentId?: string, 
  title?: string, 
  content?: string
): Promise<string> {
  try {
    // Calculate word and character counts
    const wordCount = content ? content.trim().split(/\s+/).filter(word => word.length > 0).length : 0
    const characterCount = content ? content.length : 0
    
    if (documentId) {
      // Update existing document
      const { data, error } = await supabase
        .from('writing_documents')
        .update({
          title: title || 'Untitled Document',
          content: content || '',
          word_count: wordCount,
          character_count: characterCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('user_id', userId)
        .select('id')
        .single()

      if (error) {
        console.error('Error updating document:', error)
        throw error
      }

      return data.id
    } else {
      // Create new document
      const { data, error } = await supabase
        .from('writing_documents')
        .insert({
          user_id: userId,
          title: title || 'Untitled Document',
          content: content || '',
          word_count: wordCount,
          character_count: characterCount
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating document:', error)
        throw error
      }

      return data.id
    }
  } catch (error) {
    console.error('Failed to save document:', error)
    throw error
  }
}

/**
 * Load a specific writing document
 */
export async function loadDocument(documentId: string, userId: string): Promise<WritingDocument | null> {
  try {
    const { data, error } = await supabase
      .from('writing_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error loading document:', error)
      return null
    }

    // Update last opened timestamp
    await updateLastOpened(documentId, userId)

    return data
  } catch (error) {
    console.error('Failed to load document:', error)
    return null
  }
}

/**
 * Delete a writing document
 */
export async function deleteDocument(documentId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('writing_documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting document:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to delete document:', error)
    return false
  }
}

/**
 * Update the last opened timestamp for a document
 */
export async function updateLastOpened(documentId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('writing_documents')
      .update({ last_opened: new Date().toISOString() })
      .eq('id', documentId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating last opened:', error)
    }
  } catch (error) {
    console.error('Failed to update last opened:', error)
  }
}

/**
 * Update document title
 */
export async function updateTitle(documentId: string, userId: string, title: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('writing_documents')
      .update({ 
        title: title.trim() || 'Untitled Document',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating title:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to update title:', error)
    return false
  }
}

/**
 * Toggle favorite status of a document
 */
export async function toggleFavorite(documentId: string, userId: string): Promise<boolean> {
  try {
    // First get the current favorite status
    const { data: currentDoc, error: fetchError } = await supabase
      .from('writing_documents')
      .select('is_favorite')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching document for favorite toggle:', fetchError)
      return false
    }

    // Toggle the favorite status
    const { error } = await supabase
      .from('writing_documents')
      .update({ 
        is_favorite: !currentDoc.is_favorite,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error toggling favorite:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
    return false
  }
}

/**
 * Generate a title from content (first line or first few words)
 */
export function generateTitleFromContent(content: string): string {
  if (!content || content.trim().length === 0) {
    return 'Untitled Document'
  }

  // Get first line or first 50 characters, whichever is shorter
  const firstLine = content.split('\n')[0].trim()
  const title = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine
  
  return title || 'Untitled Document'
}

/**
 * Format date for display
 */
export function formatDocumentDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  } catch (error) {
    return 'Unknown date'
  }
}

// Export all functions as a service object
export const writingDocumentService: WritingDocumentService = {
  getUserDocuments,
  saveDocument,
  loadDocument,
  deleteDocument,
  updateLastOpened,
  updateTitle,
  toggleFavorite
}
