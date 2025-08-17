import type { LifeNote } from '../../../lib/db'

// Local Note interface
export interface Note {
  id: string
  day: string
  content: string
}

// Convert LifeNote from database to local Note format
export const convertLifeNoteToNote = (lifeNote: LifeNote): Note => ({
  id: lifeNote.id,
  day: lifeNote.day_string,
  content: lifeNote.content
})

// Calendar day interface
export interface CalendarDay {
  day: string
  dow: string
}
