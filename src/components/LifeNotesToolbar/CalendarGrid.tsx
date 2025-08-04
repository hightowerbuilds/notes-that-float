
import React from 'react'
import './CalendarGrid.css'

interface Note {
  id: string
  day: string
  content: string
}

interface CalendarGridProps {
  selectedMonth: number
  selectedYear: number
  selectedDay: string
  notes: Note[]
  onMonthChange: (month: number) => void
  onDayClick: (day: string) => void
  onDayDoubleClick?: (day: string) => void
  highlightedDay?: string | null
  isHighlightMode?: boolean
  isFullscreen?: boolean
  children?: React.ReactNode
}

export function CalendarGrid({
  selectedMonth,
  selectedYear,
  selectedDay,
  notes,
  onMonthChange,
  onDayClick,
  onDayDoubleClick,
  highlightedDay,
  isHighlightMode,
  isFullscreen,
  children
}: CalendarGridProps) {
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Get the day of week for each day
  const getDayOfWeek = (year: number, month: number, day: number) => {
    return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][
      new Date(year, month, day).getDay()
    ]
  }

  return (
    <div className="notes-toolbar">
      <div className="toolbar-header">
        <span className="toolbar-month-label">{monthNames[selectedMonth]} {selectedYear}</span>
        <div className="toolbar-buttons">
          <button
            className="toolbar-month-btn"
            onClick={() => onMonthChange(selectedMonth === 0 ? 11 : selectedMonth - 1)}
            aria-label="Previous Month"
          >
            &lt;
          </button>
          <button
            className="toolbar-month-btn"
            onClick={() => onMonthChange(selectedMonth === 11 ? 0 : selectedMonth + 1)}
            aria-label="Next Month"
          >
            &gt;
          </button>
        </div>
      </div>
      
      <div className="toolbar-calendar">
        <div className="toolbar-weekdays">
          <span className="weekday-header">SUN</span>
          <span className="weekday-header">MON</span>
          <span className="weekday-header">TUE</span>
          <span className="weekday-header">WED</span>
          <span className="weekday-header">THU</span>
          <span className="weekday-header">FRI</span>
          <span className="weekday-header">SAT</span>
        </div>
        
        <div className="toolbar-days-grid">
          {(() => {
            // Get the first day of the month to determine padding
            const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay()
            const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
            
            // Create array with empty slots for padding
            const daysArray = []
            
            // Add empty slots for days before the first day of the month
            for (let i = 0; i < firstDayOfMonth; i++) {
              daysArray.push({ day: '', dow: '', isEmpty: true })
            }
            
            // Add all days of the month
            for (let i = 1; i <= daysInMonth; i++) {
              const dow = getDayOfWeek(selectedYear, selectedMonth, i)
              daysArray.push({ day: i.toString(), dow, isEmpty: false })
            }
            
            return daysArray.map((dateObj, index) => {
              const dayString = `${dateObj.day} ${dateObj.dow.toUpperCase()}`
              const hasNotes = notes.some(note => note.day === dayString)
              const isHighlighted = isHighlightMode && highlightedDay === dayString
              
              return (
                <div key={index} className={`toolbar-day-cell${dateObj.isEmpty ? ' empty' : ''}`}>
                  {!dateObj.isEmpty && (
                    <button
                      className={`toolbar-day-btn${selectedDay === dayString ? ' selected' : ''}${hasNotes ? ' has-notes' : ''}${isHighlighted ? ' highlighted' : ''}`}
                      onClick={() => onDayClick(dayString)}
                      onDoubleClick={() => onDayDoubleClick && onDayDoubleClick(dayString)}
                    >
                      {dateObj.day}
                    </button>
                  )}
                </div>
              )
            })
          })()}
        </div>
      </div>
      
      {/* Additional content for fullscreen mode */}
      {isFullscreen && children}
    </div>
  )
}