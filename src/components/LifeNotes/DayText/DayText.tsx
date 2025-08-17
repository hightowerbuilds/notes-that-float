import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Mesh } from 'three'
import type { Note } from '../utils/types'
import './DayText.css'

interface DayTextProps {
  day: string
  position: [number, number, number]
  notes: Note[]
  onDayClick: (day: string) => void
  selectedDay: string
  areNotesVisible: boolean
  areDatesVisible: boolean
  isHighlightMode?: boolean
  highlightedDay?: string | null
}

export function DayText({
  day,
  position,
  notes,
  onDayClick,
  selectedDay,
  areNotesVisible,
  areDatesVisible,
  isHighlightMode,
  highlightedDay
}: DayTextProps) {
  const textRef = useRef<Mesh>(null)
  const notesRefs = useRef<(Mesh | null)[]>([])
  const noteHeights = useRef<number[]>([])
  const { camera } = useThree()
  const dayNotes = notes.filter(note => note.day === day)
  const isSelected = day === selectedDay

  useFrame(() => {
    if (textRef.current) {
      textRef.current.lookAt(camera.position)
    }
    // Make all notes text face the camera
    notesRefs.current.forEach(ref => {
      if (ref) {
        ref.lookAt(camera.position)
      }
    })
  })

  return (
    <group position={position}>
      {/* Date text - conditionally rendered */}
      {areDatesVisible && (
        <Text
          ref={textRef}
          position={[0, 0, 0]}
          fontSize={0.12}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Courier.ttf"
          onClick={() => onDayClick(day)}
        >
          {day}
        </Text>
      )}
      
      {/* Display notes for this day */}
      {areNotesVisible && dayNotes.map((note, index) => {
        // In highlight mode, only show notes for the highlighted day
        if (isHighlightMode && highlightedDay && day !== highlightedDay) {
          return null
        }

        // Determine if this note should be highlighted
        const isHighlighted = isHighlightMode && highlightedDay === day

        // Calculate position based on previous note heights
        let yPosition = -0.4
        const spacing = isHighlighted ? 0.2 : 0.1 // More space when highlighted
        for (let i = 0; i < index; i++) {
          yPosition -= (noteHeights.current[i] || 0.4) + spacing
        }
        
        return (
          <group key={note.id} position={[0, yPosition, 0]}>
            <Text
              ref={(el: any) => notesRefs.current[index] = el}
              position={[-0.85, 0, 0]}
              fontSize={0.05} // Keep same font size
              color={isHighlighted ? "#ffffff" : "#87CEEB"}
              anchorX="left"
              anchorY="middle"
              maxWidth={isHighlighted ? 2.5 : 1.7} // Wider box when highlighted
              font="/fonts/Courier.ttf"
              onSync={(text) => {
                // Calculate text height for positioning
                if (text && isSelected) {
                  const textHeight = text.geometry.boundingBox?.max.y - text.geometry.boundingBox?.min.y || 0.4
                  noteHeights.current[index] = textHeight
                }
              }}
            >
              {note.content}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
