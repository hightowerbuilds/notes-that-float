import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Box, Html } from '@react-three/drei'
import * as THREE from 'three'

interface WritingProcessor3DProps {
  content: string
  isActive: boolean
  onFocus: () => void
  onContentChange: (newContent: string) => void
  cameraDistance: number
  alignCamera: number
  selectAll: number
  fontSize: number
}

// This component will manage the camera's zoom distance
function CameraManager({ distance }: { distance: number }) {
  const { camera } = useThree()
  useFrame(() => {
    // Smoothly animate the camera's z position to the target distance
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, distance, 0.1)
  })
  return null
}

// Removed WritingCore component as requested

// Central Text Panel Component - Using HTML overlay for native text editing
function CentralTextPanel({ 
  content, 
  onTextClick,
  onContentChange,
  selectAll,
  fontSize,
}: {
  content: string
  onTextClick: () => void
  onContentChange: (newContent: string) => void
  selectAll: number
  fontSize: number
}) {
  const panelRef = useRef<THREE.Group>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(!content)
  const lastContentRef = useRef<string>(content)

  // Initialize content on mount and when content prop changes (but only if not actively editing)
  useEffect(() => {
    if (editorRef.current && !isEditing) {
      console.log('3D Editor: Initializing content with', content.length, 'characters')
      if (content) {
        editorRef.current.textContent = content
        setShowPlaceholder(false)
      } else {
        editorRef.current.textContent = 'begin here...'
        setShowPlaceholder(true)
      }
      lastContentRef.current = content
    }
  }, [content, isEditing])

  // Handle select all
  useEffect(() => {
    if (selectAll > 0 && editorRef.current) {
      const range = document.createRange()
      range.selectNodeContents(editorRef.current)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, [selectAll])

  // Update content when it changes externally (not from user input)
  useEffect(() => {
    if (editorRef.current && !isEditing) {
      // Only update if content actually changed externally (not from our own input)
      if (lastContentRef.current !== content && editorRef.current.textContent !== content) {
        // Save cursor position
        const selection = window.getSelection()
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null
        const cursorOffset = range ? range.startOffset : 0
        
        // Update content and placeholder state
        if (content) {
          editorRef.current.textContent = content
          setShowPlaceholder(false)
        } else {
          editorRef.current.textContent = 'begin here...'
          setShowPlaceholder(true)
        }
        
        // Restore cursor position if content isn't empty
        if (content && selection && editorRef.current.firstChild) {
          try {
            const newRange = document.createRange()
            const textNode = editorRef.current.firstChild
            const maxOffset = Math.min(cursorOffset, textNode.textContent?.length || 0)
            newRange.setStart(textNode, maxOffset)
            newRange.setEnd(textNode, maxOffset)
            selection.removeAllRanges()
            selection.addRange(newRange)
          } catch (e) {
            // Fallback: place cursor at end
            const newRange = document.createRange()
            newRange.selectNodeContents(editorRef.current)
            newRange.collapse(false)
            selection.removeAllRanges()
            selection.addRange(newRange)
          }
        }
      }
    }
    lastContentRef.current = content
  }, [content, isEditing])

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || ''
    console.log('3D Editor: Input event - content length:', newContent.length, 'is placeholder?', newContent === 'begin here...')
    
    // Don't save placeholder text as actual content
    if (newContent === 'begin here...') {
      console.log('3D Editor: Ignoring placeholder text')
      return
    }
    
    // Hide placeholder when user starts typing real content
    if (newContent && showPlaceholder) {
      setShowPlaceholder(false)
    }
    // Show placeholder when content becomes empty
    if (!newContent && !showPlaceholder) {
      setShowPlaceholder(true)
    }
    
    lastContentRef.current = newContent // Update our ref immediately
    console.log('3D Editor: Calling onContentChange with:', newContent.length, 'characters')
    onContentChange(newContent)
    if (!isEditing) {
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    // Small delay to ensure any pending input changes are processed
    setTimeout(() => {
      setIsEditing(false)
      
      // If content is empty after user is done editing, show placeholder
      if (editorRef.current && !editorRef.current.textContent?.trim()) {
        editorRef.current.textContent = 'begin here...'
        setShowPlaceholder(true)
        // Only send empty content change if the current content prop is also empty
        // This prevents sending empty content when a document was just loaded
        if (!content || content.trim() === '') {
          console.log('3D Editor: Sending empty content on blur')
          onContentChange('') // Ensure parent knows content is empty
        } else {
          console.log('3D Editor: Not sending empty content - document content exists')
        }
      }
    }, 100)
  }

  const handleFocus = () => {
    setIsEditing(true)
    onTextClick()
    
    // Clear placeholder when user focuses to type
    if (showPlaceholder && editorRef.current) {
      editorRef.current.textContent = ''
      setShowPlaceholder(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle Ctrl+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      // Save is handled by parent component
    }
  }

  return (
    <group ref={panelRef} position={[0, 0, 0]}>
      {/* Transparent background panel - minimal visibility */}
      <Box 
        args={[16, 12, 0.1]} 
        position={[0, 0, -0.05]}
        onClick={onTextClick}
        onPointerOver={(e) => {
          document.body.style.cursor = 'text'
          e.object.scale.setScalar(1.01)
        }}
        onPointerOut={(e) => {
          document.body.style.cursor = 'default'
          e.object.scale.setScalar(1)
        }}
      >
        <meshStandardMaterial 
          color="#001122" 
          opacity={0} 
          transparent 
          side={THREE.DoubleSide}
        />
      </Box>

      {/* HTML overlay for native text editing */}
      <Html
        transform
        distanceFactor={10}
        position={[0, 0, 0.1]}
        style={{
          width: '800px',
          height: '600px',
        }}
      >
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            height: '100%',
            padding: '20px',
            fontSize: `${fontSize}px`,
            fontFamily: 'Courier New, monospace',
            color: showPlaceholder ? 'rgba(135, 206, 235, 0.5)' : '#87CEEB',
            backgroundColor: 'transparent',
            border: '1px solid #87CEEB',
            borderRadius: '4px',
            outline: 'none',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            cursor: 'text',
            caretColor: '#87CEEB',
            fontStyle: showPlaceholder ? 'italic' : 'normal',
          }}
        >
        </div>
      </Html>
    </group>
  )
}

// Removed StaticReferenceRings component as requested

// Removed RotationControls component as requested

// Main 3D Scene Component
function WritingScene3D({
  content,
  isActive,
  onFocus,
  onContentChange,
  alignCamera,
  selectAll,
  fontSize,
}: {
  content: string
  isActive: boolean
  onFocus: () => void
  onContentChange: (newContent: string) => void
  alignCamera: number
  selectAll: number
  fontSize: number
}) {
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    if (alignCamera > 0 && controlsRef.current) {
      controlsRef.current.reset()
    }
  }, [alignCamera])
  
  const handleTextClick = () => {
    if (!isActive) {
      onFocus()
    }
  }

  return (
    <group>
      <CentralTextPanel 
        content={content}
        onTextClick={handleTextClick}
        onContentChange={onContentChange}
        selectAll={selectAll}
        fontSize={fontSize}
      />
      
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.0} />
      <pointLight position={[-10, -10, -10]} intensity={0.6} />
      <pointLight position={[0, 10, 0]} intensity={0.8} />
      
      <OrbitControls
        ref={controlsRef}
        target={[0, 0, 0]}
        enablePan={true}
        enableZoom={false}
        enableRotate={true}
        autoRotate={false}
        maxPolarAngle={Math.PI * 0.9}
        minPolarAngle={Math.PI * 0.1}
      />
    </group>
  )
}

// Main 3D Writing Processor Component
export function WritingProcessor3D({
  content,
  isActive,
  onFocus,
  onContentChange,
  cameraDistance,
  alignCamera,
  selectAll,
  fontSize,
}: WritingProcessor3DProps) {
  return (
    <div style={{ width: '100%', height: '100%', background: 'transparent' }}>
      <Canvas
        // Set the initial camera position, but updates are now handled by CameraManager
        camera={{ position: [0, 0, cameraDistance], fov: 60 }}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent'
        }}
      >
        <WritingScene3D 
          content={content} 
          isActive={isActive} 
          onFocus={onFocus} 
          onContentChange={onContentChange}
          alignCamera={alignCamera} 
          selectAll={selectAll}
          fontSize={fontSize}
        />
        <CameraManager distance={cameraDistance} />
      </Canvas>
    </div>
  )
}
