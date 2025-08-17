import React, { useState, useRef, useCallback } from 'react'
import './LifeNotesToolbar.css'
import { BottomControls } from '../BottomControls/BottomControls'
import { CalendarGrid } from '../CalendarGrid/CalendarGrid'
import { NotesDirectory } from '../NotesDirectory/NotesDirectory' 


interface Note {
  id: string
  day: string
  content: string
}

interface LifeNotesToolbarProps {
  notes: Note[]
  selectedDay: string
  selectedMonth: number
  selectedYear: number
  onDayClick: (day: string) => void
  onDayDoubleClick?: (day: string) => void
  onMonthChange: (month: number) => void
  showInput: boolean
  newNote: string
  onNewNoteChange: (note: string) => void
  onAddNote: (e: React.FormEvent) => void
  onDone: () => void
  isToolbarMinimized: boolean
  onToolbarMinimize: () => void
  textRotationDirection: number
  onTextRotationToggle: () => void
  isTextPaused: boolean
  onTextPauseToggle: () => void
  isFullscreen: boolean
  onFullscreenToggle: () => void
  onEditNote: (id: string, content: string) => void
  onDeleteNote: (id: string) => void
  areDatesVisible: boolean
  onToggleDatesVisibility: () => void
  areNotesVisible: boolean
  onToggleNotesVisibility: () => void
  areRingsVisible: boolean
  onToggleRingsVisibility: () => void
  isPlanetVisible: boolean
  onTogglePlanetVisibility: () => void
  highlightedDay?: string | null
  isHighlightMode?: boolean
}

export function LifeNotesToolbar({
  notes,
  selectedDay,
  selectedMonth,
  selectedYear,
  onDayClick,
  onDayDoubleClick,
  onMonthChange,
  showInput,
  newNote,
  onNewNoteChange,
  onAddNote,
  onDone,
  isToolbarMinimized,
  onToolbarMinimize,
  textRotationDirection,
  onTextRotationToggle,
  isTextPaused,
  onTextPauseToggle,
  isFullscreen,
  onFullscreenToggle,
  onEditNote,
  onDeleteNote,
  areDatesVisible,
  onToggleDatesVisibility,
  areNotesVisible,
  onToggleNotesVisibility,
  areRingsVisible,
  onToggleRingsVisibility,
  isPlanetVisible,
  onTogglePlanetVisibility,
  highlightedDay,
  isHighlightMode
  }: LifeNotesToolbarProps) {
  // Edit state management
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // Resizable panels state
  const [leftPanelWidth, setLeftPanelWidth] = useState(400) // Default width for calendar panel
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartXRef = useRef(0)
  const dragStartWidthRef = useRef(400)

  // Vertical resizable state for text areas
  const [textDisplayHeight, setTextDisplayHeight] = useState(45) // Percentage of available height
  const [isVerticalDragging, setIsVerticalDragging] = useState(false)
  const dragStartYRef = useRef(0)
  const dragStartHeightRef = useRef(45)

  // Dashboard drag state
  const [dashboardHeight, setDashboardHeight] = useState(95) // Current height in px
  const [isDashboardDragging, setIsDashboardDragging] = useState(false)
  const dashboardDragStartY = useRef(0)
  const dashboardDragStartHeight = useRef(95)





  // Edit/Delete helper functions
  const handleEditStart = (note: Note) => {
    setEditingNoteId(note.id)
    setEditContent(note.content)
  }

  const handleEditSave = (noteId: string) => {
    if (editContent.trim()) {
      onEditNote(noteId, editContent.trim())
    }
    setEditingNoteId(null)
    setEditContent('')
  }

  const handleEditCancel = () => {
    setEditingNoteId(null)
    setEditContent('')
  }

  const handleDelete = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDeleteNote(noteId)
    }
  }

  // Drag handlers for resizable panels
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartXRef.current = e.clientX
    dragStartWidthRef.current = leftPanelWidth
    
    // Create the mouse move handler that doesn't depend on stale closures
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartXRef.current
      const newWidth = Math.max(250, Math.min(800, dragStartWidthRef.current + deltaX))
      setLeftPanelWidth(newWidth)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    // Add global mouse move and up listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [leftPanelWidth])

  // Vertical drag handler for text areas
  const handleVerticalMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsVerticalDragging(true)
    dragStartYRef.current = e.clientY
    dragStartHeightRef.current = textDisplayHeight
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - dragStartYRef.current
      // Convert pixel delta to percentage delta (assuming container height ~600px)
      const percentageDelta = (deltaY / 600) * 100
      const newHeight = Math.max(20, Math.min(80, dragStartHeightRef.current + percentageDelta))
      setTextDisplayHeight(newHeight)
    }
    
    const handleMouseUp = () => {
      setIsVerticalDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    // Add global mouse move and up listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [textDisplayHeight])

  // Dashboard drag handler
  const handleDashboardDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDashboardDragging(true)
    dashboardDragStartY.current = e.clientY
    dashboardDragStartHeight.current = dashboardHeight
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = dashboardDragStartY.current - moveEvent.clientY // Inverted because dragging up should increase height
      const newHeight = Math.max(95, Math.min(window.innerHeight - 80, dashboardDragStartHeight.current + deltaY)) // Min 95px, max to just under navbar (80px from top)
      setDashboardHeight(newHeight)
    }
    
    const handleMouseUp = () => {
      setIsDashboardDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [dashboardHeight])

  return (
    <>
      {/* Control buttons for planet rotation - Floating outside toolbar - Hide in fullscreen */}
      <BottomControls
        isFullscreen={isFullscreen}
        isToolbarMinimized={isToolbarMinimized}
        textRotationDirection={textRotationDirection}
        isTextPaused={isTextPaused}
        onTextRotationToggle={onTextRotationToggle}
        onTextPauseToggle={onTextPauseToggle}
        onToolbarMinimize={onToolbarMinimize}
      />

            {/* Toolbar Container */}
      <div 
        ref={containerRef}
        className={`toolbar-container${isToolbarMinimized ? ' minimized' : ''}${isFullscreen ? ' fullscreen' : ''}${isDashboardDragging ? ' dragging' : ''}${dashboardHeight > 200 ? ' expanded' : ''}`}
        style={!isFullscreen && !isToolbarMinimized ? { height: `${dashboardHeight}px` } : undefined}
      >
        {/* Drag Handle - Only show when not minimized and not fullscreen */}
        {!isToolbarMinimized && !isFullscreen && (
          <div 
            className="dashboard-drag-handle"
            onMouseDown={handleDashboardDragStart}
          >
            <div className="drag-handle-indicator">
              <div className="drag-handle-line"></div>
              <div className="drag-handle-line"></div>
              <div className="drag-handle-line"></div>
            </div>
          </div>
        )}
        <div 
          className="toolbar-content-wrapper"
          style={isFullscreen ? {
            gridTemplateColumns: `${leftPanelWidth}px 8px 1fr`
          } : undefined}
        >

          {/* Dashboard mode: Left column with Calendar + Toggle Controls */}
          {!isFullscreen && (
            <div className="left-column">
              <CalendarGrid
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                selectedDay={selectedDay}
                notes={notes}
                onMonthChange={onMonthChange}
                onDayClick={onDayClick}
                onDayDoubleClick={onDayDoubleClick}
                highlightedDay={highlightedDay}
                isHighlightMode={isHighlightMode}
                isFullscreen={isFullscreen}
              />
            </div>
          )}

          {/* Add Info Section - Only show when a day is clicked */}
          {showInput && (
            <div className="add-info-section">
              <div className="add-info-header">
                <h3 className="add-info-title">NOTE</h3>
                <div className="header-controls">
                  <button
                    onClick={onToggleDatesVisibility}
                    className={`toggle-btn${!areDatesVisible ? ' hide-state' : ''}`}
                    title={areDatesVisible ? 'Hide Dates' : 'View Dates'}
                  >
                    DATES
                  </button>
                  
                  <button
                    onClick={onToggleNotesVisibility}
                    className={`toggle-btn${!areNotesVisible ? ' hide-state' : ''}`}
                    title={areNotesVisible ? 'Hide Notes' : 'View Notes'}
                  >
                    NOTES
                  </button>
                  
                  <button
                    onClick={onToggleRingsVisibility}
                    className={`toggle-btn${!areRingsVisible ? ' hide-state' : ''}`}
                    title={areRingsVisible ? 'Hide Rings' : 'View Rings'}
                  >
                    RINGS
                  </button>
                  
                  <button
                    onClick={onTogglePlanetVisibility}
                    className={`toggle-btn${!isPlanetVisible ? ' hide-state' : ''}`}
                    title={isPlanetVisible ? 'Hide Planet' : 'View Planet'}
                  >
                    PLANET
                  </button>
                  
                  <button
                    type="button"
                    onClick={onFullscreenToggle}
                    className="fullscreen-btn"
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  >
                    {isFullscreen ? "dashboard" : "full-screen"}
                  </button>
                </div>
              </div>
              <form onSubmit={onAddNote} className="add-info-form">
                <div className="input-container">
                  <div className="day-display-container">
                    <div className="day-display">
                      {selectedDay}
                    </div>
                  </div>
                  
                  {/* Show existing notes for this day */}
                  <div 
                    className="existing-notes"
                    style={isFullscreen ? {
                      height: `calc(${textDisplayHeight}vh - 100px)`,
                      flex: 'none',
                      minHeight: 'auto',
                      maxHeight: `calc(${textDisplayHeight}vh - 100px)`
                    } : undefined}
                  >
                    <h4>Existing notes for {selectedDay}:</h4>
                    {notes.filter(note => note.day === selectedDay).length > 0 ? (
                      <div className="notes-content">
                        {notes.filter(note => note.day === selectedDay).map((note) => (
                          <div key={note.id} className="note-item-container">
                            {editingNoteId === note.id ? (
                              // Edit mode
                              <div className="note-edit-container">
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="note-edit-textarea"
                                  autoFocus
                                />
                                <div className="note-edit-buttons">
                                  <button
                                    onClick={() => handleEditSave(note.id)}
                                    className="note-save-btn"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={handleEditCancel}
                                    className="note-cancel-btn"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Display mode
                              <div className="note-display-container">
                                <p className="note-paragraph">
                                  {note.content}
                                </p>
                                <div className="note-actions">
                                  <span
                                    onClick={() => handleEditStart(note)}
                                    className="note-edit-text"
                                    title="Edit note"
                                  >
                                    edit
                                  </span>
                                  <span
                                    onClick={() => handleDelete(note.id)}
                                    className="note-delete-text"
                                    title="Delete note"
                                  >
                                    delete
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-notes">No notes yet for this day</p>
                    )}
                  </div>

                  {/* Vertical Draggable Divider - Only show in fullscreen */}
                  {isFullscreen && (
                    <div 
                      className={`vertical-resize-divider${isVerticalDragging ? ' dragging' : ''}`}
                      onMouseDown={handleVerticalMouseDown}
                    >
                      <div className="vertical-resize-handle">
                        <div className="vertical-resize-handle-line"></div>
                        <div className="vertical-resize-handle-line"></div>
                        <div className="vertical-resize-handle-line"></div>
                      </div>
                    </div>
                  )}
                  
                  <textarea
                    value={newNote}
                    onChange={(e) => onNewNoteChange(e.target.value)}
                    placeholder="Enter information"
                    className="note-input"
                    autoFocus
                    rows={3}
                    style={isFullscreen ? {
                      backgroundColor: 'transparent',
                      border: '1px solid #87CEEB',
                      color: '#87CEEB',
                      fontFamily: 'Courier New, Courier, monospace',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      height: `calc(${100 - textDisplayHeight}vh - 400px)`, // Use vh units and subtract fixed elements
                      resize: 'none', // Disable manual resize in fullscreen
                      flex: 'none',
                      minHeight: 'auto',
                      maxHeight: `calc(${100 - textDisplayHeight}vh - 400px)` // Prevent overflow
                    } : {
                      backgroundColor: 'transparent',
                      border: '1px solid #87CEEB',
                      color: '#87CEEB',
                      fontFamily: 'Courier New, Courier, monospace',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      height: '145px',
                      resize: 'vertical',
                    }}  
                  />
                  
                  <div className="button-group">
                    <button type="submit" className="save-btn">
                      Add Note
                    </button>
                    
                    {!isFullscreen && (
                      <button type="button" onClick={onDone} className="done-btn">
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Fullscreen mode: Left panel with Calendar + Directory + Controls */}
          {isFullscreen && (
            <div className="left-panel">
              <CalendarGrid
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                selectedDay={selectedDay}
                notes={notes}
                onMonthChange={onMonthChange}
                onDayClick={onDayClick}
                onDayDoubleClick={onDayDoubleClick}
                highlightedDay={highlightedDay}
                isHighlightMode={isHighlightMode}
                isFullscreen={isFullscreen}
              >
                <NotesDirectory
                  notes={notes}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  selectedDay={selectedDay}
                  onDayClick={onDayClick}
                />
              </CalendarGrid>
            </div>
          )}

          {/* Fullscreen mode: Draggable Divider */}
          {isFullscreen && (
            <div 
              className={`resize-divider${isDragging ? ' dragging' : ''}`}
              onMouseDown={handleMouseDown}
            >
              <div className="resize-handle">
                <div className="resize-handle-line"></div>
                <div className="resize-handle-line"></div>
                <div className="resize-handle-line"></div>
              </div>
            </div>
          )}
      </div>
      </div>
    </>
  )
} 