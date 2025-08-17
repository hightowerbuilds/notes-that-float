import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '../../components/Navbar/Navbar'
import { LifeNotesToolbar } from '../../components/LifeNotesToolbar/LifeNotesToolbar/LifeNotesToolbar'
import { PlanetScene } from '../../components/LifeNotes/PlanetScene/PlanetScene'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../../lib/useAuth'
import { db } from '../../lib/db'
import { getDayOfWeek, monthNames } from '../../components/LifeNotes/utils/monthColors'
import { convertLifeNoteToNote, type Note } from '../../components/LifeNotes/utils/types'
import './life-notes.css'

export const Route = createFileRoute('/life-notes/')({
  component: LifeNotesPage,
})





export function LifeNotesPage() {
  const { user } = useAuth()
  const [textRotationDirection, setTextRotationDirection] = useState(1)

  // Set initial state lazily so it's only calculated once
  const [initialDateValues] = useState(() => {
    const today = new Date();
    const todayString = `${today.getDate()} ${getDayOfWeek(today.getFullYear(), today.getMonth(), today.getDate()).toUpperCase()}`
    return {
      today,
      todayString,
      month: today.getMonth(),
      year: today.getFullYear(),
    };
  });

  const [isTextPaused, setIsTextPaused] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [selectedDay, setSelectedDay] = useState(initialDateValues.todayString)
  const [showInput, setShowInput] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(initialDateValues.month);
  const [selectedYear] = useState(initialDateValues.year);
  const [isToolbarMinimized, setIsToolbarMinimized] = useState(true)
  const [isHeadingHidden, setIsHeadingHidden] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [areDatesVisible, setAreDatesVisible] = useState(true)
  const [areNotesVisible, setAreNotesVisible] = useState(true)
  const [areRingsVisible, setAreRingsVisible] = useState(true)
  const [isPlanetVisible, setIsPlanetVisible] = useState(true)
  
  // Highlight mode states
  const [isHighlightMode, setIsHighlightMode] = useState(false)
  const [highlightedDay, setHighlightedDay] = useState<string | null>(null)
  const [targetRotation, setTargetRotation] = useState(0)



  // Format today's date for the heading
  const todayHeading = `${monthNames[initialDateValues.month]} ${initialDateValues.today.getDate()}, ${initialDateValues.year}`;

  // Generate days for the selected month/year
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate()
  }, [selectedMonth, selectedYear])

  const calendar = useMemo(() => (
    Array.from({ length: daysInMonth }, (_, i) => {
      const day = (i + 1).toString()
      const dow = getDayOfWeek(selectedYear, selectedMonth, i + 1)
      return { day, dow }
    })
  ), [daysInMonth, selectedMonth, selectedYear])

  // Load notes when component mounts or month/year changes
  useEffect(() => {
    if (user) {
      loadNotesForMonth()
    }
  }, [user, selectedMonth, selectedYear])

  const loadNotesForMonth = async () => {
    if (!user) return
    
    try {
      setError(null)
      const lifeNotes = await db.getLifeNotesForMonth(selectedMonth, selectedYear, user.id)
      const convertedNotes = lifeNotes.map(convertLifeNoteToNote)
      setNotes(convertedNotes)
    } catch (err) {
      console.error('Error loading notes:', err)
      setError('Failed to load notes')
    }
  }

  const toggleTextRotation = () => {
    console.log('Button clicked! Current text direction:', textRotationDirection)
    setTextRotationDirection(prev => {
      const newDirection = prev === 1 ? -1 : 1
      console.log('New text direction:', newDirection)
      return newDirection
    })
  }

  const toggleTextPause = () => {
    console.log('Pause button clicked! Current pause state:', isTextPaused)
    setIsTextPaused(prev => !prev)
  }

  const handleDayClick = (day: string) => {
    console.log('Day clicked:', day)
    setSelectedDay(day)
    setIsTextPaused(true) // Automatically pause rotation
    setNewNote('')
    setShowInput(true)
    
    // Open the toolbar if it's minimized
    if (isToolbarMinimized) {
      setIsToolbarMinimized(false)
    }
    
    console.log('Toolbar opened and planet stopped')
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !newNote.trim()) return
    
    try {
      setError(null)
      
      // Parse the selected day to get the day number
      const dayNumber = parseInt(selectedDay.split(' ')[0])
      const noteDate = new Date(selectedYear, selectedMonth, dayNumber)
      
      const noteData = {
        day_string: selectedDay,
        content: newNote.trim(),
        note_date: noteDate.toISOString().split('T')[0], // YYYY-MM-DD format
        month: selectedMonth,
        year: selectedYear,
        user_id: user.id
      }
      
      const savedNote = await db.addLifeNote(noteData)
      const convertedNote = convertLifeNoteToNote(savedNote)
      
      setNotes(prev => [...prev, convertedNote])
      setNewNote('') // Clear the input but keep form open
      // Don't close the form - allow multiple entries
    } catch (err) {
      console.error('Error saving note:', err)
      setError('Failed to save note')
    }
  }

  const handleDone = () => {
    setShowInput(false)
    setNewNote('')
    setIsToolbarMinimized(true)
  }

  const toggleToolbarMinimize = () => {
    setIsToolbarMinimized(prev => {
      const newState = !prev
      if (!newState) {
        // When opening, also show the text input
        setShowInput(true)
      }
      return newState
    })
  }

  const toggleFullscreen = () => {
    setIsFullscreen(prev => {
      const newFullscreenState = !prev
      // When entering fullscreen, hide the heading
      if (newFullscreenState) {
        setIsHeadingHidden(true)
      }
      return newFullscreenState
    })
  }

  const toggleDatesVisibility = () => {
    setAreDatesVisible(prev => !prev)
  }

  const toggleNotesVisibility = () => {
    setAreNotesVisible(prev => !prev)
  }

  const toggleRingsVisibility = () => {
    setAreRingsVisible(prev => !prev)
  }

  const togglePlanetVisibility = () => {
    setIsPlanetVisible(prev => !prev)
  }

  const handleEditNote = async (id: string, content: string) => {
    if (!user) return
    
    try {
      setError(null)
      await db.updateLifeNote(id, content, user.id)
      
      // Update local state
      setNotes(prev => prev.map(note => 
        note.id === id ? { ...note, content } : note
      ))
    } catch (err) {
      console.error('Error updating note:', err)
      setError('Failed to update note')
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!user) return
    
    try {
      setError(null)
      await db.deleteLifeNote(id, user.id)
      
      // Update local state
      setNotes(prev => prev.filter(note => note.id !== id))
    } catch (err) {
      console.error('Error deleting note:', err)
      setError('Failed to delete note')
    }
  }

  // Highlight mode handlers
  const handleDayDoubleClick = (day: string) => {
    console.log('Day double-clicked:', day)
    
    // Check if this day has notes
    const dayNotes = notes.filter(note => note.day === day)
    if (dayNotes.length === 0) {
      return // Don't highlight if no notes exist
    }
    
    // If already highlighting this day, exit highlight mode
    if (isHighlightMode && highlightedDay === day) {
      exitHighlightMode()
      return
    }
    

    
    // Directly enable highlight mode
    setHighlightedDay(day)
    setIsHighlightMode(true)
    setIsTextPaused(true) // Pause rotation during highlight mode
  }

  const exitHighlightMode = () => {
    setIsHighlightMode(false)
    setHighlightedDay(null)
    setTargetRotation(0)
  }

  console.log('Current text rotation direction:', textRotationDirection)

  return (
    <div className="page-container">
      <Navbar />
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
      <main className="main-content">
        <div className="life-notes-content">
          {!user && (
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              color: 'white', 
              textAlign: 'center',
              fontFamily: 'Courier New, monospace'
            }}>
              <h2>Please log in to access Notes that Float</h2>
            </div>
          )}
          
          {/* User-specific UI elements */}
          {user && (
            <>
              <button 
                className={`heading-toggle-btn${isHeadingHidden ? ' hidden-state' : ''}`}
                onClick={() => setIsHeadingHidden(!isHeadingHidden)}
                aria-label={isHeadingHidden ? "Show heading" : "Hide heading"}
              />
              {!isHeadingHidden && (
                <>
                  <h1 className="notes-title-3d">{todayHeading}</h1>
                </>
              )}
              
              {error && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 0, 0, 0.1)',
                  border: '1px solid #ff4444',
                  color: '#ff4444',
                  padding: '1rem',
                  borderRadius: '4px',
                  fontFamily: 'Courier New, monospace',
                  fontSize: '0.9rem',
                  zIndex: 1000
                }}>
                  {error}
                  <button 
                    onClick={() => setError(null)}
                    style={{
                      marginLeft: '1rem',
                      background: 'none',
                      border: 'none',
                      color: '#ff4444',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* LifeNotesToolbar Component */}
              <LifeNotesToolbar
                notes={notes}
                selectedDay={selectedDay}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onDayClick={handleDayClick}
                onDayDoubleClick={handleDayDoubleClick}
                onMonthChange={setSelectedMonth}
                showInput={showInput}
                newNote={newNote}
                onNewNoteChange={setNewNote}
                onAddNote={handleAddNote}
                onDone={handleDone}
                isToolbarMinimized={isToolbarMinimized}
                onToolbarMinimize={toggleToolbarMinimize}
                textRotationDirection={textRotationDirection}
                onTextRotationToggle={toggleTextRotation}
                isTextPaused={isTextPaused}
                onTextPauseToggle={toggleTextPause}
                isFullscreen={isFullscreen}
                onFullscreenToggle={toggleFullscreen}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
                areDatesVisible={areDatesVisible}
                onToggleDatesVisibility={toggleDatesVisibility}
                areNotesVisible={areNotesVisible}
                onToggleNotesVisibility={toggleNotesVisibility}
                areRingsVisible={areRingsVisible}
                onToggleRingsVisibility={toggleRingsVisibility}
                isPlanetVisible={isPlanetVisible}
                onTogglePlanetVisibility={togglePlanetVisibility}
                highlightedDay={highlightedDay}
                isHighlightMode={isHighlightMode}
              />
            </>
          )}
          
          {/* Planet Scene Canvas - Always rendered */}
          <div className={`planet-scene-container${isFullscreen ? ' hidden' : ''}`}>
            <Canvas camera={{ position: [0, -5, 15], fov: 60 }}>
              <PlanetScene 
                textRotationDirection={textRotationDirection} 
                notes={user ? notes : []} 
                onDayClick={user ? handleDayClick : () => {}}
                isTextPaused={isTextPaused}
                selectedDay={selectedDay}
                calendar={calendar}
                selectedMonth={selectedMonth}
                areDatesVisible={areDatesVisible}
                areNotesVisible={areNotesVisible && user !== null}
                areRingsVisible={areRingsVisible}
                isPlanetVisible={isPlanetVisible}
                isHighlightMode={isHighlightMode}
                highlightedDay={highlightedDay}
                targetRotation={targetRotation}
              />
            </Canvas>
          </div>


        </div>
      </main>
    </div>
  )
} 