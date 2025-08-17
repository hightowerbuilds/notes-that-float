import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Navbar } from '../../components/Navbar/Navbar'
import { WritingProcessor3D } from '../../components/WritingProcessor/WritingProcessor3D'
import { useAuth } from '../../lib/useAuth'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { 
  getUserDocuments, 
  saveDocument, 
  loadDocument, 
  deleteDocument,
  toggleFavorite,
  generateTitleFromContent,
  formatDocumentDate 
} from '../../lib/writingDocuments'
import type { Database } from '../../lib/database.types'
import './writing.css'
import '../../components/WritingProcessor/WritingProcessor3D.css'

type WritingDocument = Database['public']['Tables']['writing_documents']['Row']

export const Route = createFileRoute('/writing/')({
  component: Writing,
})

function Writing() {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [isEditorActive, setIsEditorActive] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(15) // Default distance
  const [alignCamera, setAlignCamera] = useState(0)
  const [selectAll, setSelectAll] = useState(0)
  const [fontSize, setFontSize] = useState(18) // Font size in pixels
  
  // Document management state
  const [documents, setDocuments] = useState<WritingDocument[]>([])
  const [currentDocument, setCurrentDocument] = useState<WritingDocument | null>(null)
  const [documentTitle, setDocumentTitle] = useState('Untitled Document')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved')

  const [isLoading, setIsLoading] = useState(false)
  
  // Auto-save timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load user documents when component mounts or user changes
  useEffect(() => {
    if (user && !user.is_guest) {
      loadUserDocuments()
    }
  }, [user])

  // Auto-save functionality
  useEffect(() => {
    if (user && !user.is_guest && content !== (currentDocument?.content || '')) {
      setSaveStatus('unsaved')
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave()
      }, 2000) // Auto-save after 2 seconds of inactivity
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, currentDocument, user])

  const loadUserDocuments = async () => {
    if (!user || user.is_guest) return
    
    try {
      setIsLoading(true)
      const userDocs = await getUserDocuments(user.id)
      setDocuments(userDocs)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutoSave = async () => {
    if (!user || user.is_guest || isSaving) return
    
    try {
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
        // If this was a new document, load it as current
        const newDoc = await loadDocument(documentId, user.id)
        if (newDoc) {
          setCurrentDocument(newDoc)
          setDocumentTitle(newDoc.title)
        }
      } else {
        // Update the current document
        setCurrentDocument({
          ...currentDocument,
          title,
          content,
          word_count: content.trim().split(/\s+/).filter(w => w.length > 0).length,
          character_count: content.length,
          updated_at: new Date().toISOString()
        })
      }
      
      setSaveStatus('saved')
      await loadUserDocuments() // Refresh the document list
    } catch (error) {
      console.error('Auto-save error:', error)
      setSaveStatus('error')
    }
  }

  // Handle content changes from the 3D editor
  const handleContentChange = (newContent: string) => {
    setContent(newContent)
  }

  // Handle keyboard shortcuts when editor is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditorActive) return
      
      // Handle keyboard shortcuts
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
        if (e.key === 'c') {
          // Copy is handled automatically by browser with textarea selection
          return
        }
        if (e.key === 'v') {
          // Paste is handled automatically by browser with textarea
          return
        }
        if (e.key === 'x') {
          // Cut is handled automatically by browser with textarea
          return
        }
        return
      }
      
      // Delete/Backspace is now handled natively by contentEditable
      
      // Handle escape to exit editor
      if (e.key === 'Escape') {
        setIsEditorActive(false)
        // Blur will be handled by the contentEditable div
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
        // If this was a new document, load it as current
        const newDoc = await loadDocument(documentId, user.id)
        if (newDoc) {
          setCurrentDocument(newDoc)
          setDocumentTitle(newDoc.title)
        }
      } else {
        // Update the current document
        setCurrentDocument({
          ...currentDocument,
          title,
          content,
          word_count: content.trim().split(/\s+/).filter(w => w.length > 0).length,
          character_count: content.length,
          updated_at: new Date().toISOString()
        })
      }
      
      setSaveStatus('saved')
      await loadUserDocuments() // Refresh the document list
    } catch (error) {
      console.error('Save error:', error)
      setSaveStatus('error')
      alert(`Failed to save document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNewDocument = () => {
    setCurrentDocument(null)
    setContent('')
    setDocumentTitle('Untitled Document')
    setSaveStatus('saved')
  }

  const handleLoadDocument = async (doc: WritingDocument) => {
    try {
      setIsLoading(true)
      const fullDoc = await loadDocument(doc.id, user!.id)
      if (fullDoc) {
        setCurrentDocument(fullDoc)
        setContent(fullDoc.content)
        setDocumentTitle(fullDoc.title)
        setSaveStatus('saved')
      }
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
        
        // If we deleted the current document, reset to new document
        if (currentDocument?.id === docId) {
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

  const handleToggleFavorite = async (docId: string) => {
    if (!user || user.is_guest) return
    
    try {
      await toggleFavorite(docId, user.id)
      await loadUserDocuments()
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleClear = () => {
    if (content.length > 0 && window.confirm('Are you sure you want to clear all content?')) {
      setContent('')
    }
  }

  const handleExport = () => {
    // Create and download text file
    const element = document.createElement('a')
    const file = new Blob([content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `document-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleZoomIn = () => {
    setCameraDistance(prev => Math.max(prev - 2, 8)) // Zoom in, but not too close
  }

  const handleZoomOut = () => {
    setCameraDistance(prev => Math.min(prev + 2, 30)) // Zoom out, but not too far
  }

  const handleAlign = () => {
    setAlignCamera(c => c + 1)
  }

  const handleFontSizeChange = (direction: 'increase' | 'decrease') => {
    setFontSize(prevSize => {
      if (direction === 'increase') {
        return Math.min(prevSize + 2, 36) // Max font size of 36px
      } else {
        return Math.max(prevSize - 2, 12) // Min font size of 12px
      }
    })
  }

  return (
    <div className={`page-container ${!user ? 'no-navbar' : ''}`}>
      {user && <Navbar />}
      
      {/* Background Stars */}
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

      {/* Hidden textarea removed - using native contentEditable in 3D component */}

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
          <div className="writing-sidebar">
            <div className="sidebar-header">
              <h3>Writing Tools</h3>
            </div>
            <div className="sidebar-content">
              <div className="sidebar-section">
                <h4 className="section-title">Document</h4>
                <div className="document-stats-section">
                  {currentDocument && (
                    <div className="current-document-title">
                      📄 {documentTitle}
                    </div>
                  )}
                  <div className="document-stats">
                    {content.split(' ').filter(w => w.length > 0).length} words | {content.length} chars
                    {user.is_guest && ' | Guest Mode'}
                  </div>
                </div>
                <div className="control-buttons">
              <button 
                onClick={handleSave}
                    className={`writing-toolbar-btn primary ${isSaving ? 'saving' : ''}`}
                title="Save Document (Ctrl+S)"
                    disabled={isSaving || user.is_guest}
                  >
                    {isSaving ? 'SAVING...' : 'SAVE'}
                  </button>
                  {saveStatus !== 'saved' && !user.is_guest && (
                    <div className={`save-status ${saveStatus}`}>
                      {saveStatus === 'saving' && '○ Saving...'}
                      {saveStatus === 'unsaved' && '● Unsaved changes'}
                      {saveStatus === 'error' && '✕ Save failed'}
                    </div>
                  )}
                  <button 
                    onClick={handleNewDocument}
                    className="writing-toolbar-btn"
                    title="New Document"
                    disabled={user.is_guest}
                  >
                    NEW
              </button>
              <button 
                onClick={handleClear}
                className="writing-toolbar-btn danger"
                title="Clear All Content"
              >
                CLEAR
              </button>
              <button 
                onClick={handleExport}
                className="writing-toolbar-btn"
                title="Export as Text File"
              >
                EXPORT
              </button>
                </div>
              </div>
              <div className="sidebar-section">
                <h4 className="section-title">View</h4>
                <div className="control-buttons">
              <button
                onClick={handleAlign}
                className="writing-toolbar-btn"
                title="Align Camera"
              >
                ALIGN
              </button>
                  <div className="control-group">
                    <span className="control-label">ZOOM</span>
                    <div className="control-buttons-inline">
                <button 
                  onClick={handleZoomOut}
                        className="writing-toolbar-btn small"
                  title="Zoom Out"
                >
                  -
                </button>
                <button 
                  onClick={handleZoomIn}
                        className="writing-toolbar-btn small"
                  title="Zoom In"
                >
                  +
                </button>
              </div>
                  </div>
                  <div className="control-group">
                    <span className="control-label">FONT SIZE</span>
                    <div className="control-buttons-inline">
                <button
                  onClick={() => handleFontSizeChange('decrease')}
                        className="writing-toolbar-btn small"
                  title="Decrease Font Size"
                >
                  A-
                </button>
                <button
                  onClick={() => handleFontSizeChange('increase')}
                        className="writing-toolbar-btn small"
                  title="Increase Font Size"
                >
                  A+
                </button>
              </div>
            </div>
          </div>
              </div>
              {!user.is_guest && (
                <div className="sidebar-section">
                  <h4 className="section-title">Saved Documents</h4>
                  <button 
                    onClick={handleNewDocument}
                    className="new-document-btn"
                    title="Create New Document"
                  >
                    + NEW DOCUMENT
                  </button>
                  {isLoading ? (
                    <div className="loading">Loading documents...</div>
                  ) : (
                    <div className="documents-list">
                      {documents.length === 0 ? (
                        <div className="no-documents">No documents yet</div>
                      ) : (
                        documents.map((doc) => (
                          <div 
                            key={doc.id} 
                            className={`document-item ${currentDocument?.id === doc.id ? 'active' : ''}`}
                          >
                            <div 
                              className="document-content"
                              onClick={() => handleLoadDocument(doc)}
                            >
                              <div className="document-title">{doc.title}</div>
                              <div className="document-meta">
                                {formatDocumentDate(doc.updated_at)} | {doc.word_count} words
                              </div>
                            </div>
                            <div className="document-actions">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleFavorite(doc.id)
                                }}
                                className={`favorite-btn ${doc.is_favorite ? 'active' : ''}`}
                                title={doc.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                ★
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteDocument(doc.id)
                                }}
                                className="delete-btn"
                                title="Delete document"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="writing-3d-container">
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