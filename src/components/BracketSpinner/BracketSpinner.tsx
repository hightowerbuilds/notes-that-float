import { useState, useEffect } from 'react'
import './BracketSpinner.css'

interface BracketSpinnerProps {
  type: 'saving' | 'unsaved' | 'error'
  text: string
}

export function BracketSpinner({ type, text }: BracketSpinnerProps) {
  const [currentBracket, setCurrentBracket] = useState(0)
  
  const brackets = ['()', '{}', '<>']
  
  useEffect(() => {
    console.log('BracketSpinner mounted with type:', type)
    if (type === 'saving') {
      const interval = setInterval(() => {
        setCurrentBracket(prev => {
          const newIndex = (prev + 1) % brackets.length
          console.log('BracketSpinner cycling to:', brackets[newIndex])
          return newIndex
        })
      }, 500)
      
      return () => clearInterval(interval)
    }
  }, [type, brackets.length])

  const getDisplayChar = () => {
    if (type === 'error') return '✕'
    if (type === 'unsaved') return '●'
    
    // For saving state, cycle through brackets
    const bracket = brackets[currentBracket]
    return bracket[0] // Just show the opening bracket for smaller size
  }

  return (
    <span className={`bracket-spinner ${type}`}>
      <span className="bracket-char">{getDisplayChar()}</span>
      <span className="spinner-text">{text}</span>
    </span>
  )
}