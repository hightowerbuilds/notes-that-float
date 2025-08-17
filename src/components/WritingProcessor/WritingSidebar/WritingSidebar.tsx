import { DocumentsList } from '../DocumentsList/DocumentsList'
import { DocumentStats } from '../DocumentStats/DocumentStats'
import { ControlButtons } from '../ControlButtons/ControlButtons'
import type { Database } from '../../../lib/database.types'
import type { User } from '../../../lib/auth'
import './WritingSidebar.css'

type WritingDocument = Database['public']['Tables']['writing_documents']['Row']

interface WritingSidebarProps {
  // User & auth
  user: User
  
  // Sidebar state
  sidebarWidth: number
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  
  // Documents
  documents: WritingDocument[]
  currentDocument: WritingDocument | null
  documentTitle: string
  isLoading: boolean
  content: string
  
  // Document actions
  onLoadDocument: (doc: WritingDocument) => void
  onDeleteDocument: (docId: string) => void
  
  // Save functionality
  onSave: () => void
  isSaving: boolean
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error'
  
  // Control actions
  onNewDocument: () => void
  onClear: () => void
  onExport: () => void
  onAlign: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFontSizeChange: (direction: 'increase' | 'decrease') => void
}

export function WritingSidebar({
  user,
  sidebarWidth,
  isDragging,
  onMouseDown,
  documents,
  currentDocument,
  documentTitle,
  isLoading,
  content,
  onLoadDocument,
  onDeleteDocument,
  onSave,
  isSaving,
  saveStatus,
  onNewDocument,
  onClear,
  onExport,
  onAlign,
  onZoomIn,
  onZoomOut,
  onFontSizeChange
}: WritingSidebarProps) {
  return (
    <div className="writing-sidebar" style={{ width: `${sidebarWidth}px` }}>
      <div className="sidebar-content">
        {/* Documents list - only for authenticated users */}
        {!user.is_guest && (
          <DocumentsList
            documents={documents}
            currentDocument={currentDocument}
            isLoading={isLoading}
            onLoadDocument={onLoadDocument}
            onDeleteDocument={onDeleteDocument}
          />
        )}

        <div className="sidebar-section">
          <DocumentStats
            currentDocument={currentDocument}
            documentTitle={documentTitle}
            content={content}
            isGuest={user.is_guest ?? false}
          />
          
          <ControlButtons
            onSave={onSave}
            isSaving={isSaving}
            saveStatus={saveStatus}
            isGuest={user.is_guest ?? false}
            onNewDocument={onNewDocument}
            onClear={onClear}
            onExport={onExport}
            onAlign={onAlign}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onFontSizeChange={onFontSizeChange}
          />
        </div>
      </div>
      
      {/* Resize handle */}
      <div 
        className="sidebar-resize-handle" 
        onMouseDown={onMouseDown}
        style={{ cursor: isDragging ? 'col-resize' : 'col-resize' }}
      />
    </div>
  )
}
