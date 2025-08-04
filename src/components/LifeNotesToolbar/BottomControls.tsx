
import './BottomControls.css'

interface BottomControlsProps {
  isFullscreen: boolean
  isToolbarMinimized: boolean
  textRotationDirection: number
  isTextPaused: boolean
  onTextRotationToggle: () => void
  onTextPauseToggle: () => void
  onToolbarMinimize: () => void
}

export function BottomControls({
  isFullscreen,
  isToolbarMinimized,
  textRotationDirection,
  isTextPaused,
  onTextRotationToggle,
  onTextPauseToggle,
  onToolbarMinimize
}: BottomControlsProps) {
  // Don't render in fullscreen mode
  if (isFullscreen) return null

  return (
    <div className={`bottom-controls${isToolbarMinimized ? ' floating' : ''}`}>
      <div className="controls-buttons">
        <button 
          onClick={onTextRotationToggle}
          className="rotation-toggle-btn"
        >
          {textRotationDirection === 1 ? '>>>' : '<<<'}
        </button>

        <button 
          onClick={onTextPauseToggle}
          className="rotation-stop-btn"
        >
          {isTextPaused ? 'go' : 'stop'}
        </button>

        <button
          className="toolbar-minimize-btn"
          onClick={onToolbarMinimize}
          aria-label={isToolbarMinimized ? "Expand Toolbars" : "Minimize Toolbars"}
        >
          {isToolbarMinimized ? 'open' : 'close'}
        </button>
      </div>
    </div>
  )
}