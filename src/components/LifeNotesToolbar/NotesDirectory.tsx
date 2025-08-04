
import './NotesDirectory.css'

interface Note {
  id: string
  day: string
  content: string
}

interface NotesDirectoryProps {
  notes: Note[]
  selectedMonth: number
  selectedYear: number
  selectedDay: string
  onDayClick: (day: string) => void
}

export function NotesDirectory({
  notes,
  selectedMonth,
  selectedYear,
  selectedDay,
  onDayClick
}: NotesDirectoryProps) {
  return (
    <div className="notes-directory">
      <div className="directory-header">
        <h4 className="directory-title">NOTES/</h4>
      </div>
      <div className="directory-content">
        {(() => {
          // Filter notes for current month and group by date
          const monthNotes = notes.filter(note => {
            // Extract day number from note.day (e.g., "15 MON" -> 15)
            const dayNum = parseInt(note.day.split(' ')[0])
            if (isNaN(dayNum)) return false
            
            // Check if this note belongs to current month/year by reconstructing the date
            const noteDate = new Date(selectedYear, selectedMonth, dayNum)
            return noteDate.getMonth() === selectedMonth && noteDate.getFullYear() === selectedYear
          })
          
          // Group notes by day
          const notesByDay = monthNotes.reduce((acc, note) => {
            if (!acc[note.day]) {
              acc[note.day] = []
            }
            acc[note.day].push(note)
            return acc
          }, {} as Record<string, typeof notes>)
          
          // Sort days chronologically
          const sortedDays = Object.keys(notesByDay).sort((a, b) => {
            const dayA = parseInt(a.split(' ')[0])
            const dayB = parseInt(b.split(' ')[0])
            return dayA - dayB
          })
          
          if (sortedDays.length === 0) {
            return (
              <div className="directory-empty">
                └── no notes this month
              </div>
            )
          }
          
          return sortedDays.map((day, dayIndex) => {
            const dayNotes = notesByDay[day]
            const isLastDay = dayIndex === sortedDays.length - 1
            const isSelectedDay = day === selectedDay
            
            // Convert day format from "15 MON" to "Monday: 01/15/25"
            const formatDayDisplay = (dayString: string) => {
              const [dayNum] = dayString.split(' ')
              const dayNumber = parseInt(dayNum)
              
              // Create full date
              const date = new Date(selectedYear, selectedMonth, dayNumber)
              
              // Get full day name
              const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
              const fullDayName = fullDayNames[date.getDay()]
              
              // Format date as mm/dd/yy
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const day = String(date.getDate()).padStart(2, '0')
              const year = String(date.getFullYear()).slice(-2)
              
              return `${fullDayName}: ${month}/${day}/${year}`
            }
            
            const formattedDay = formatDayDisplay(day)
            
            return (
              <div key={day} className="directory-day-group">
                <div 
                  className={`directory-day${isSelectedDay ? ' selected' : ''}`}
                  onClick={() => onDayClick(day)}
                >
                  {isLastDay ? '└──' : '├──'} {formattedDay}/
                </div>
                {dayNotes.map((note, noteIndex) => {
                  const isLastNote = noteIndex === dayNotes.length - 1
                  const prefix = isLastDay 
                    ? (isLastNote ? '    └──' : '    ├──')
                    : (isLastNote ? '│   └──' : '│   ├──')
                  
                  // Truncate note content to first 50 characters
                  const truncatedContent = note.content.length > 50 
                    ? note.content.substring(0, 50) + '...'
                    : note.content
                  
                  return (
                    <div 
                      key={note.id} 
                      className={`directory-note${isSelectedDay ? ' parent-selected' : ''}`}
                      onClick={() => onDayClick(day)}
                      title={note.content} // Show full content on hover
                    >
                      {prefix} {truncatedContent}
                    </div>
                  )
                })}
              </div>
            )
          })
        })()}
      </div>
    </div>
  )
}