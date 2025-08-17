import type { Database } from '../../../lib/database.types'
import './DocumentStats.css'

type WritingDocument = Database['public']['Tables']['writing_documents']['Row']

interface DocumentStatsProps {
  currentDocument: WritingDocument | null
  documentTitle: string
  content: string
  isGuest: boolean
}

export function DocumentStats({ 
  currentDocument, 
  documentTitle, 
  content, 
  isGuest 
}: DocumentStatsProps) {
  const wordCount = content.split(' ').filter(w => w.length > 0).length
  const charCount = content.length

  return (
    <div className="document-stats-section">
      {currentDocument && (
        <div className="current-document-title">
          📄 {documentTitle}
        </div>
      )}
      <div className="document-stats">
        {wordCount} words | {charCount} chars
        {isGuest && ' | Guest Mode'}
      </div>
    </div>
  )
}
