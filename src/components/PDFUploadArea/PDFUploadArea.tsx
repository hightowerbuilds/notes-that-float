import { useState, useEffect } from 'react'
import './PDFUploadArea.css'

// Letter definitions - each letter is made up of squares
const LETTERS = {
  'D': [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0]
  ],
  'O': [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0]
  ],
  'P': [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0]
  ],
  ' ': [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
  ],
  'F': [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0]
  ],
  'I': [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1]
  ],
  'L': [
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1]
  ],
  'E': [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1]
  ],
  'H': [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1]
  ],
  'R': [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1]
  ],
  'A': [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1]
  ],
  'V': [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0]
  ],
  'T': [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0]
  ],
  'U': [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0]
  ],
  'S': [
    [0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0]
  ]
}

// Neon white color
const NEON_WHITE = '#ffffff'

interface SquareProps {
  isActive: boolean
  color: string
  delay: number
  letterIndex: number
  columnIndex: number
  isColumnHovered: boolean
  onColumnHover: (letterIndex: number, columnIndex: number | null) => void
}

function Square({ isActive, color, delay, letterIndex, columnIndex, isColumnHovered, onColumnHover }: SquareProps) {
  const [isBlinking, setIsBlinking] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(prev => !prev)
    }, 500 + delay * 50) // Different timing for each square

    return () => clearInterval(interval)
  }, [delay])

  const handleMouseEnter = () => {
    onColumnHover(letterIndex, columnIndex)
  }

  const handleMouseLeave = () => {
    onColumnHover(letterIndex, null)
  }

  return (
    <div 
      className={`square ${isActive ? 'active' : ''} ${isBlinking ? 'blinking' : ''} ${isColumnHovered ? 'column-hovered' : ''}`}
      style={{
        backgroundColor: isColumnHovered ? '#1e90ff' : (isActive ? color : 'transparent'),
        borderColor: isColumnHovered ? '#1e90ff' : color,
        animationDelay: `${delay * 0.1}s`
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  )
}

interface PDFUploadAreaProps {
  isDragging: boolean
  onClick: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  uploadStatus: { message: string; type: string }
}

export function PDFUploadArea({ 
  isDragging, 
  onClick, 
  onDragOver, 
  onDragLeave, 
  onDrop, 
  uploadStatus 
}: PDFUploadAreaProps) {
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null)

  const text = 'DROP PDF FILE HERE'
  const currentColor = NEON_WHITE

  return (
    <div className="pdf-upload-area">
      <div 
        className={`upload-container ${isDragging ? 'dragover' : ''}`}
        onClick={onClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="upload-heading">
          <div className="heading-container">
            {text.split('').map((letter, letterIndex) => (
              <div key={letterIndex} className="letter-container">
                {LETTERS[letter as keyof typeof LETTERS]?.map((row, rowIndex) => (
                  <div key={rowIndex} className="letter-row">
                    {row.map((square, squareIndex) => (
                      <Square
                        key={squareIndex}
                        isActive={square === 1}
                        color={currentColor}
                        delay={letterIndex * 5 + rowIndex * 5 + squareIndex}
                        letterIndex={letterIndex}
                        columnIndex={squareIndex}
                        isColumnHovered={hoveredColumn === `${letterIndex}-${squareIndex}`}
                        onColumnHover={(letterIdx, colIdx) => setHoveredColumn(colIdx !== null ? `${letterIdx}-${colIdx}` : null)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        <div className="upload-subtitle">
          
          <p>Supports PDF files up to 10MB</p>
        </div>
        
        {uploadStatus.message && (
          <div className={`upload-status ${uploadStatus.type}`}>
            {uploadStatus.type === 'processing' && <span className="loading"></span>}
            {uploadStatus.message}
          </div>
        )}
      </div>
    </div>
  )
} 