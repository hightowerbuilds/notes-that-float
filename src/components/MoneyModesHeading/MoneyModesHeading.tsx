import { useState, useEffect } from 'react'
import './MoneyModesHeading.css'

// Letter definitions - each letter is made up of squares
const LETTERS = {
  'M': [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1]
  ],
  'O': [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0]
  ],
  'N': [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 1, 1],
    [1, 0, 0, 0, 1]
  ],
  'E': [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1]
  ],
  'Y': [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0]
  ],
  ' ': [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
  ],
  'D': [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0]
  ],
  'S': [
    [0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0]
  ]
}

// Static neon white color
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

export function MoneyModesHeading() {
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null)

  const text = 'MONEY MODES'
  const currentColor = NEON_WHITE

  return (
    <div className="money-modes-heading">
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
  )
} 