import { formatDocumentDate } from '../../../lib/writingDocuments'
import type { Database } from '../../../lib/database.types'
import './DocumentItem.css'

type WritingDocument = Database['public']['Tables']['writing_documents']['Row']

interface DocumentItemProps {
  document: WritingDocument
  isActive: boolean
  onLoad: (doc: WritingDocument) => void
  onDelete: (docId: string) => void
}

export function DocumentItem({ document, isActive, onLoad, onDelete }: DocumentItemProps) {
  const previewText = document.content
    ? document.content.trim().split(/\s+/).slice(0, 30).join(' ') + 
      (document.content.trim().split(/\s+/).length > 30 ? '...' : '')
    : 'Empty document'

  return (
    <div 
      className={`document-item ${isActive ? 'active' : ''}`}
      onClick={() => onLoad(document)}
    >
      <span className="document-icon">📄</span>
      <div className="document-content">
        <div className="document-title">{document.title}</div>
        <div className="document-preview">{previewText}</div>
        <div className="document-meta">
          <span>{formatDocumentDate(document.updated_at)}</span>
          <span>•</span>
          <span>{document.word_count} words</span>
        </div>
      </div>
      <div className="document-actions">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(document.id)
          }}
          className="delete-btn"
          title="Delete document"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
