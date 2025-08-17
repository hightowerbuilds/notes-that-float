import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Navbar } from '../../components/Navbar/Navbar'
import { WritingProcessor3D } from '../../components/WritingProcessor/WritingProcessor3D/WritingProcessor3D'
import { WritingSidebar } from '../../components/WritingProcessor/WritingSidebar/WritingSidebar'
import { useAuth } from '../../lib/useAuth'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { 
  getUserDocuments, 
  saveDocument, 
  loadDocument, 
  deleteDocument,
  generateTitleFromContent 
} from '../../lib/writingDocuments'
import type { Database } from '../../lib/database.types'
import './writing.css'

type WritingDocument = Database['public']['Tables']['writing_documents']['Row']

export const Route = createFileRoute('/writing/')({
  component: Writing,
})

function Writing() {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [isEditorActive, setIsEditorActive] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(15)
  const [alignCamera, setAlignCamera] = useState(0)
  const [selectAll, setSelectAll] = useState(0)
  const [fontSize, setFontSize] = useState(18)
  const [sidebarWidth, setSidebarWidth] = useState(180)
  const [isDragging, setIsDragging] = useState(false)
  
  // Document management state
  const [documents, setDocuments] = useState<WritingDocument[]>([])
  const [currentDocument, setCurrentDocument] = useState<WritingDocument | null>(null)
  const [documentTitle, setDocumentTitle] = useState('Untitled Document')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isLoadingDocument, setIsLoadingDocument] = useState(false)
  
  // Auto-save timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load user documents when component mounts or user changes
  useEffect(() => {
    console.log('User effect triggered:', user ? `User ID: ${user.id}, Guest: ${user.is_guest}` : 'No user')
    if (user && !user.is_guest) {
      console.log('Loading user documents...')
      loadUserDocuments()
    }
  }, [user])

  // Auto-save functionality
  useEffect(() => {
    // Don't auto-save if user is guest
    if (!user || user.is_guest) return
    
    // Don't auto-save if content hasn't actually changed
    if (content === (currentDocument?.content || '')) return
    
    // During initial load, only prevent auto-save if we're about to load a document
    if (isInitialLoad && currentDocument === null) {
      console.log('Skipping auto-save during initial load with no current document')
      return
    }
    
    // Don't auto-save empty content over existing non-empty documents
    if (content.trim() === '' && currentDocument?.content && currentDocument.content.trim() !== '') {
      console.log('Prevented overwriting existing content with empty content')
      return
    }
    
    console.log('Setting up auto-save...', { content: content.substring(0, 50) + '...', isInitialLoad, hasCurrentDoc: !!currentDocument })
    
    setSaveStatus('unsaved')
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      console.log('Auto-save triggered')
      handleAutoSave()
    }, 2000)
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, currentDocument, user, isInitialLoad])

  const loadUserDocuments = async () => {
    if (!user || user.is_guest) return
    
    try {
      setIsLoading(true)
      const userDocs = await getUserDocuments(user.id)
      setDocuments(userDocs)
      
      // On initial load, try to restore the last current document
      if (isInitialLoad && userDocs.length > 0) {
        console.log('Initial load: Found', userDocs.length, 'documents')
        
        // Check localStorage for the last current document ID
        const lastCurrentDocId = localStorage.getItem(`currentDocumentId_${user.id}`)
        let documentToLoad = null
        
        console.log('Looking for last current document ID:', lastCurrentDocId)
        
        if (lastCurrentDocId) {
          // Try to find the document by ID
          documentToLoad = userDocs.find(doc => doc.id === lastCurrentDocId)
          console.log('Found document by ID:', !!documentToLoad)
        }
        
        // If not found, load the most recently updated document
        if (!documentToLoad) {
          documentToLoad = userDocs[0] // Already sorted by updated_at desc
          console.log('Loading most recent document:', documentToLoad?.title)
        }
        
        if (documentToLoad) {
          console.log('Loading document:', documentToLoad.title, 'Content length:', documentToLoad.content?.length || 0)
          await loadDocumentSafely(documentToLoad)
          console.log('Document loaded successfully')
        }
        
        // Mark initial load as complete after a small delay to ensure content is set
        setTimeout(() => {
          console.log('Initial load complete')
          setIsInitialLoad(false)
        }, 200)
      } else if (isInitialLoad) {
        // No documents to load, just mark initial load as complete
        console.log('No documents found, completing initial load')
        setTimeout(() => {
          setIsInitialLoad(false)
        }, 100)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      // Still mark initial load as complete even on error
      if (isInitialLoad) {
        setTimeout(() => {
          setIsInitialLoad(false)
        }, 100)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutoSave = async () => {
    if (!user || user.is_guest || isSaving) return
    
    console.log('Starting auto-save...', {
      contentLength: content.length,
      currentDocId: currentDocument?.id,
      title: documentTitle
    })
    
    try {
      setSaveStatus('saving')
      const title = documentTitle === 'Untitled Document' 
        ? generateTitleFromContent(content) 
        : documentTitle
      
      console.log('Saving with title:', title, 'Content length:', content.length)
      
      const documentId = await saveDocument(
        user.id,
        currentDocument?.id,
        title,
        content
      )
      
      console.log('Save successful, document ID:', documentId)
      
      if (!currentDocument) {
        const newDoc = await loadDocument(documentId, user.id)
        if (newDoc) {
          setCurrentDocument(newDoc)
          setDocumentTitle(newDoc.title)
          // Store current document ID in localStorage
          localStorage.setItem(`currentDocumentId_${user.id}`, newDoc.id)
          console.log('New document set as current')
        }
      } else {
        const updatedDoc = {
          ...currentDocument,
          title,
          content,
          word_count: content.trim().split(/\s+/).filter(w => w.length > 0).length,
          character_count: content.length,
          updated_at: new Date().toISOString()
        }
        setCurrentDocument(updatedDoc)
        // Store current document ID in localStorage
        localStorage.setItem(`currentDocumentId_${user.id}`, updatedDoc.id)
        console.log('Existing document updated')
      }
      
      setSaveStatus('saved')
      await loadUserDocuments()
      console.log('Auto-save completed successfully')
    } catch (error) {
      console.error('Auto-save error:', error)
      setSaveStatus('error')
    }
  }

  // Handle content changes from the 3D editor
  const handleContentChange = (newContent: string) => {
    console.log('Content changed from:', content.length, 'to:', newContent.length, 'characters', 'isLoadingDocument:', isLoadingDocument)
    
    // Ignore content changes while we're loading a document to prevent the 3D editor from overriding loaded content
    if (isLoadingDocument) {
      console.log('Ignoring content change during document load')
      return
    }
    
    // Additional protection: don't accept empty content if we currently have content and it's not a deliberate clear
    if (newContent.length === 0 && content.length > 0) {
      console.log('Ignoring empty content change to prevent accidental erasure')
      return
    }
    
    setContent(newContent)
  }

  // Handle keyboard shortcuts when editor is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditorActive) return
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault()
          handleSave()
          return
        }
        if (e.key === 'a') {
          e.preventDefault()
          setSelectAll(c => c + 1)
          return
        }
        return
      }
      
      if (e.key === 'Escape') {
        setIsEditorActive(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEditorActive, content])

  const handleEditorFocus = () => {
    setIsEditorActive(true)
  }

  const handleSave = async () => {
    if (!user || user.is_guest) {
      alert('Please log in to save documents')
      return
    }
    
    try {
      setIsSaving(true)
      setSaveStatus('saving')
      
      const title = documentTitle === 'Untitled Document' 
        ? generateTitleFromContent(content) 
        : documentTitle
      
      const documentId = await saveDocument(
        user.id,
        currentDocument?.id,
        title,
        content
      )
      
      if (!currentDocument) {
        const newDoc = await loadDocument(documentId, user.id)
        if (newDoc) {
          setCurrentDocument(newDoc)
          setDocumentTitle(newDoc.title)
          // Store current document ID in localStorage
          localStorage.setItem(`currentDocumentId_${user.id}`, newDoc.id)
        }
      } else {
        const updatedDoc = {
          ...currentDocument,
          title,
          content,
          word_count: content.trim().split(/\s+/).filter(w => w.length > 0).length,
          character_count: content.length,
          updated_at: new Date().toISOString()
        }
        setCurrentDocument(updatedDoc)
        // Store current document ID in localStorage
        localStorage.setItem(`currentDocumentId_${user.id}`, updatedDoc.id)
      }
      
      setSaveStatus('saved')
      await loadUserDocuments()
    } catch (error) {
      console.error('Save error:', error)
      setSaveStatus('error')
      alert(`Failed to save document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNewDocument = () => {
    console.log('Creating new document - clearing content')
    setIsLoadingDocument(false) // Clear any loading protection
    setCurrentDocument(null)
    setContent('')
    setDocumentTitle('Untitled Document')
    setSaveStatus('saved')
    
    // Clear localStorage entry for current document
    if (user && !user.is_guest) {
      localStorage.removeItem(`currentDocumentId_${user.id}`)
      console.log('Cleared localStorage for current document')
    }
  }

  const loadDocumentSafely = async (doc: WritingDocument) => {
    try {
      console.log('Loading document safely:', doc.id, 'title:', doc.title)
      setIsLoadingDocument(true)
      
      const fullDoc = await loadDocument(doc.id, user!.id)
      if (fullDoc) {
        console.log('Setting document content:', fullDoc.content?.length || 0, 'characters')
        setCurrentDocument(fullDoc)
        setContent(fullDoc.content)
        setDocumentTitle(fullDoc.title)
        setSaveStatus('saved')
        
        // Store current document ID in localStorage
        localStorage.setItem(`currentDocumentId_${user!.id}`, fullDoc.id)
        console.log('Document loaded and content set')
        
        // Keep protection active for a moment to let the 3D editor stabilize
        setTimeout(() => {
          setIsLoadingDocument(false)
          console.log('Document loading protection disabled')
        }, 500)
      } else {
        console.log('No document returned from loadDocument')
        setIsLoadingDocument(false)
      }
    } catch (error) {
      console.error('Error loading document:', error)
      setIsLoadingDocument(false)
      throw error
    }
  }

  const handleLoadDocument = async (doc: WritingDocument) => {
    try {
      setIsLoading(true)
      await loadDocumentSafely(doc)
    } catch (error) {
      console.error('Error loading document:', error)
      alert('Failed to load document')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!user || user.is_guest) return
    
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return
    }
    
    try {
      const success = await deleteDocument(docId, user.id)
      if (success) {
        await loadUserDocuments()
        
        if (currentDocument?.id === docId) {
          // Clear localStorage entry since we're deleting the current document
          localStorage.removeItem(`currentDocumentId_${user.id}`)
          handleNewDocument()
        }
      } else {
        alert('Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    }
  }



  const handleClear = () => {
    if (content.length > 0 && window.confirm('Are you sure you want to clear all content?')) {
      console.log('User manually clearing content')
      setContent('')
    }
  }

  const handleExport = () => {
    const element = document.createElement('a')
    const file = new Blob([content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `document-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleZoomIn = () => {
    setCameraDistance(prev => Math.max(prev - 2, 8))
  }

  const handleZoomOut = () => {
    setCameraDistance(prev => Math.min(prev + 2, 30))
  }

  const handleAlign = () => {
    setAlignCamera(c => c + 1)
  }

  const handleFontSizeChange = (direction: 'increase' | 'decrease') => {
    setFontSize(prevSize => {
      if (direction === 'increase') {
        return Math.min(prevSize + 2, 36)
      } else {
        return Math.max(prevSize - 2, 12)
      }
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(e.clientX, 140), 400)
      setSidebarWidth(newWidth)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className={`page-container ${!user ? 'no-navbar' : ''}`}>
      {user && <Navbar />}
      
      <Canvas style={{position: 'fixed', zIndex: -1, top: 0, left: 0, width: '100%', height: '100vh'}}>
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1}
        />
      </Canvas>

      {!user && (
        <main className="main-content">
          <div className="writing-content unauthenticated">
            <h1 className="page-title">Writing</h1>
            <p className="page-description">Please log in to access the 3D writing processor</p>
          </div>
        </main>
      )}

      {user && (
        <div>
          <WritingSidebar
            user={user}
            sidebarWidth={sidebarWidth}
            isDragging={isDragging}
            onMouseDown={handleMouseDown}
            documents={documents}
            currentDocument={currentDocument}
            documentTitle={documentTitle}
            isLoading={isLoading}
            content={content}
            onLoadDocument={handleLoadDocument}
            onDeleteDocument={handleDeleteDocument}
            onSave={handleSave}
            isSaving={isSaving}
            saveStatus={saveStatus}
            onNewDocument={handleNewDocument}
            onClear={handleClear}
            onExport={handleExport}
            onAlign={handleAlign}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFontSizeChange={handleFontSizeChange}
          />

          <div className="writing-3d-container" style={{ left: `${sidebarWidth}px`, width: `calc(100vw - ${sidebarWidth}px)` }}>
            <WritingProcessor3D
              content={content}
              isActive={isEditorActive}
              onFocus={handleEditorFocus}
              onContentChange={handleContentChange}
              cameraDistance={cameraDistance}
              alignCamera={alignCamera}
              selectAll={selectAll}
              fontSize={fontSize}
            />
          </div>
        </div>
      )}
    </div>
  )
}