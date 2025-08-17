import { DocumentItem } from '../DocumentItem/DocumentItem'
import type { Database } from '../../../lib/database.types'
import './DocumentsList.css'

type WritingDocument = Database['public']['Tables']['writing_documents']['Row']

interface DocumentsListProps {
  documents: WritingDocument[]
  currentDocument: WritingDocument | null
  isLoading: boolean
  onLoadDocument: (doc: WritingDocument) => void
  onDeleteDocument: (docId: string) => void
}

export function DocumentsList({
  documents,
  currentDocument,
  isLoading,
  onLoadDocument,
  onDeleteDocument
}: DocumentsListProps) {
  if (isLoading) {
    return <div className="loading">Loading documents...</div>
  }

  return (
    <div className="documents-directory">
      <div className="documents-directory-header">
        <span className="directory-icon">📁</span>
        <span>Documents ({documents.length})</span>
      </div>
      
      <div className="documents-list">
        {documents.length === 0 ? (
          <div className="no-documents">No documents yet</div>
        ) : (
          documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              document={doc}
              isActive={currentDocument?.id === doc.id}
              onLoad={onLoadDocument}
              onDelete={onDeleteDocument}
            />
          ))
        )}
      </div>
    </div>
  )
}
