import './ControlButtons.css'

interface ControlButtonsProps {
  // Save functionality
  onSave: () => void
  isSaving: boolean
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error'
  isGuest: boolean
  
  // Document actions
  onNewDocument: () => void
  onClear: () => void
  onExport: () => void
  
  // Camera controls
  onAlign: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  
  // Font controls
  onFontSizeChange: (direction: 'increase' | 'decrease') => void
}

export function ControlButtons({
  onSave,
  isSaving,
  saveStatus,
  isGuest,
  onNewDocument,
  onClear,
  onExport,
  onAlign,
  onZoomIn,
  onZoomOut,
  onFontSizeChange
}: ControlButtonsProps) {
  return (
    <div className="control-buttons">
      <button 
        onClick={onSave}
        className={`writing-toolbar-btn primary ${isSaving ? 'saving' : ''}`}
        title="Save Document (Ctrl+S)"
        disabled={isSaving || isGuest}
      >
        {isSaving ? 'SAVING...' : 'SAVE'}
      </button>
      
      {saveStatus !== 'saved' && !isGuest && (
        <div className="save-status-container">
          {saveStatus === 'saving' && <span>Saving...</span>}
          {saveStatus === 'unsaved' && <span>Unsaved changes</span>}
          {saveStatus === 'error' && <span>Save failed</span>}
        </div>
      )}
      
      <button 
        onClick={onNewDocument}
        className="writing-toolbar-btn"
        title="New Document"
        disabled={isGuest}
      >
        NEW
      </button>
      
      <button 
        onClick={onClear}
        className="writing-toolbar-btn danger"
        title="Clear All Content"
      >
        CLEAR
      </button>
      
      <button 
        onClick={onExport}
        className="writing-toolbar-btn"
        title="Export as Text File"
      >
        EXPORT
      </button>
      
      <button
        onClick={onAlign}
        className="writing-toolbar-btn"
        title="Align Camera"
      >
        ALIGN
      </button>
      
      <div className="control-group">
        <span className="control-label">ZOOM</span>
        <div className="control-buttons-inline">
          <button 
            onClick={onZoomOut}
            className="writing-toolbar-btn small"
            title="Zoom Out"
          >
            -
          </button>
          <button 
            onClick={onZoomIn}
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
            onClick={() => onFontSizeChange('decrease')}
            className="writing-toolbar-btn small"
            title="Decrease Font Size"
          >
            A-
          </button>
          <button
            onClick={() => onFontSizeChange('increase')}
            className="writing-toolbar-btn small"
            title="Increase Font Size"
          >
            A+
          </button>
        </div>
      </div>
    </div>
  )
}
