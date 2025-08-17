import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Navbar } from '../../components/Navbar/Navbar'
import { WritingProcessor3D } from '../../components/WritingProcessor/WritingProcessor3D'
import { useAuth } from '../../lib/useAuth'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import './writing.css'
import '../../components/WritingProcessor/WritingProcessor3D.css'

export const Route = createFileRoute('/writing/')({
  component: Writing,
})

function Writing() {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [isEditorActive, setIsEditorActive] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(15) // Default distance
  const [alignCamera, setAlignCamera] = useState(0)
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null)

    // Handle keyboard shortcuts when editor is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditorActive) return
      
      // Handle keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault()
          handleSave()
          return
        }
        return
      }
      
      // Handle escape to exit editor
      if (e.key === 'Escape') {
        setIsEditorActive(false)
        if (hiddenInputRef.current) {
          hiddenInputRef.current.blur()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEditorActive])

  const handleEditorFocus = () => {
    setIsEditorActive(true)
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus()
    }
  }

  const handleSave = async () => {
    console.log('Saving document:', content)
    // Here you would implement actual save logic
  }

  const handleClear = () => {
    if (content.length > 0 && window.confirm('Are you sure you want to clear all content?')) {
      setContent('')
    }
  }

  const handleExport = () => {
    // Create and download text file
    const element = document.createElement('a')
    const file = new Blob([content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `document-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleZoomIn = () => {
    setCameraDistance(prev => Math.max(prev - 2, 8)) // Zoom in, but not too close
  }

  const handleZoomOut = () => {
    setCameraDistance(prev => Math.min(prev + 2, 30)) // Zoom out, but not too far
  }

  const handleAlign = () => {
    setAlignCamera(c => c + 1)
  }

  const handleFontSizeChange = (direction: 'increase' | 'decrease') => {
    console.log(`Font size change: ${direction}`)
    // Logic to be implemented later
  }

  return (
    <div className={`page-container ${!user ? 'no-navbar' : ''}`}>
      {user && <Navbar />}
      
      {/* Background Stars */}
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

      {/* Hidden textarea for mobile keyboard support */}
      <textarea
        ref={hiddenInputRef}
        className="writing-input-hidden"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => setIsEditorActive(true)}
        onBlur={() => setIsEditorActive(false)}
      />

      {!user && (
        <main className="main-content">
          <div className="writing-content unauthenticated">
            <h1 className="page-title">Writing</h1>
            <p className="page-description">Please log in to access the 3D writing processor</p>
          </div>
        </main>
      )}

      {user && (
        <>
          {/* Compact Tool Buttons */}
          <div className={`writing-status-indicator ${isEditorActive ? 'active' : ''}`}>
            <div className="tool-buttons">
              <button 
                onClick={handleSave}
                className="writing-toolbar-btn primary"
                title="Save Document (Ctrl+S)"
              >
                SAVE
              </button>
              <button 
                onClick={handleClear}
                className="writing-toolbar-btn danger"
                title="Clear All Content"
              >
                CLEAR
              </button>
              <button 
                onClick={handleExport}
                className="writing-toolbar-btn"
                title="Export as Text File"
              >
                EXPORT
              </button>
              <button
                onClick={handleAlign}
                className="writing-toolbar-btn"
                title="Align Camera"
              >
                ALIGN
              </button>
              
              {/* Zoom Controls */}
              <div className="zoom-controls">
                <button 
                  onClick={handleZoomOut}
                  className="writing-toolbar-btn"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="zoom-indicator">ZOOM</span>
                <button 
                  onClick={handleZoomIn}
                  className="writing-toolbar-btn"
                  title="Zoom In"
                >
                  +
                </button>
              </div>

              {/* Font Size Controls */}
              <div className="font-size-controls">
                <button
                  onClick={() => handleFontSizeChange('decrease')}
                  className="writing-toolbar-btn"
                  title="Decrease Font Size"
                >
                  A-
                </button>
                <span className="font-size-indicator">SIZE</span>
                <button
                  onClick={() => handleFontSizeChange('increase')}
                  className="writing-toolbar-btn"
                  title="Increase Font Size"
                >
                  A+
                </button>
              </div>
            </div>
          </div>

          {/* Help panel removed per user request */}

          {/* Document Info - positioned below tool buttons */}
          <div className="writing-document-info">
            {content.split(' ').filter(w => w.length > 0).length} words | {content.length} chars
          </div>

          {/* 3D Writing Processor */}
          <WritingProcessor3D
            content={content}
            isActive={isEditorActive}
            onFocus={handleEditorFocus}
            cameraDistance={cameraDistance}
            alignCamera={alignCamera}
          />
        </>
      )}
    </div>
  )
}