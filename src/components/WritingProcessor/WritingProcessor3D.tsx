import { useState, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Box } from '@react-three/drei'
import * as THREE from 'three'

interface WritingProcessor3DProps {
  content: string
  isActive: boolean
  onFocus: () => void
  cameraDistance: number
  alignCamera: number
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

// Central Text Panel Component
function CentralTextPanel({ 
  content, 
  isActive, 
  onTextClick,
}: {
  content: string
  isActive: boolean
  onTextClick: () => void
}) {
  const panelRef = useRef<THREE.Group>(null)
  const [displayText, setDisplayText] = useState(content || 'Click to start writing...')
  const [selection, setSelection] = useState({ start: -1, end: -1 })
  const isDragging = useRef(false)
  const charPositions = useRef<{ x: number, y: number, char: string }[]>([])

  // Update display text when content changes
  useEffect(() => {
    setDisplayText(content || 'Click to start writing...')
  }, [content])

  // Process text into lines
  const lines = displayText.split('\n')
  const maxCharsPerLine = 60
  const processedLines: { text: string, fontSize: number }[][] = []
  
  const parseHTML = (html: string) => {
    const segments: { text: string, fontSize: number }[] = []
    const regex = /<span style="font-size: (.*?)em;">(.*?)<\/span>|(.*?)>/g
    let match
    while ((match = regex.exec(html)) !== null) {
      if (match[1] && match[2]) {
        segments.push({ text: match[2], fontSize: parseFloat(match[1]) * 0.2 })
      } else if (match[3]) {
        segments.push({ text: match[3], fontSize: 0.2 })
      }
    }
    if (segments.length === 0) {
      segments.push({ text: html, fontSize: 0.2 })
    }
    return segments
  }

  lines.forEach(line => {
    const lineSegments = parseHTML(line)
    let currentLine: { text: string, fontSize: number }[] = []
    let currentLineLength = 0
    lineSegments.forEach(segment => {
      const words = segment.text.split(' ')
      words.forEach(word => {
        if (currentLineLength + word.length <= maxCharsPerLine) {
          currentLine.push({ text: (currentLineLength > 0 ? ' ' : '') + word, fontSize: segment.fontSize })
          currentLineLength += (currentLineLength > 0 ? 1 : 0) + word.length
        } else {
          if (currentLine.length > 0) processedLines.push(currentLine)
          currentLine = [{ text: word, fontSize: segment.fontSize }]
          currentLineLength = word.length
        }
      })
    })
    if (currentLine.length > 0) processedLines.push(currentLine)
  })

  const cursorX = useMemo(() => {
    if (processedLines.length === 0) return 0
    const lastLine = processedLines[processedLines.length - 1]
    if (!lastLine) return 0
    let xOffset = 0
    lastLine.forEach(segment => {
      const charWidth = (segment.fontSize / 0.2) * 0.12
      xOffset += segment.text.length * charWidth
    })
    return xOffset
  }, [processedLines])

  useEffect(() => {
    charPositions.current.length = 0
    let charIndex = 0
    let xOffset = 0
    processedLines.forEach((line, lineIndex) => {
      xOffset = 0
      line.forEach(segment => {
        for (const char of segment.text) {
          const charWidth = (segment.fontSize / 0.2) * 0.12
          charPositions.current.push({ x: xOffset, y: -lineIndex * 0.35, char })
          xOffset += charWidth
          charIndex++
        }
      })
      charIndex++
    })
  }, [processedLines])

  const getCharIndexFromPosition = (position: THREE.Vector3) => {
    let closestIndex = -1
    let minDistance = Infinity
    charPositions.current.forEach((charPos, index) => {
      const distance = Math.sqrt(Math.pow(position.x - charPos.x, 2) + Math.pow(position.y - charPos.y, 2))
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = index
      }
    })
    return closestIndex
  }

  const handlePointerDown = (e: any) => {
    isDragging.current = true
    const charIndex = getCharIndexFromPosition(e.point)
    setSelection({ start: charIndex, end: charIndex })
  }

  const handlePointerMove = (e: any) => {
    if (!isDragging.current) return
    const charIndex = getCharIndexFromPosition(e.point)
    setSelection(prev => ({ ...prev, end: charIndex }))
  }

  const handlePointerUp = () => {
    isDragging.current = false
  }

  return (
    <group 
      ref={panelRef} 
      position={[0, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
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
          opacity={0.05} 
          transparent 
          side={THREE.DoubleSide}
        />
      </Box>



      {/* Text content */}
      <group position={[-7.5, 5.5, 0]}>
        {processedLines.map((line, lineIndex) => {
          let xOffset = 0
          return (
            <group key={lineIndex} position={[0, -lineIndex * 0.35, 0.1]}>
              {line.map((segment, segmentIndex) => {
                const currentX = xOffset
                const charWidth = (segment.fontSize / 0.2) * 0.12
                const segmentWidth = segment.text.length * charWidth
                xOffset += segmentWidth

                return (
                  <Text
                    key={segmentIndex}
                    position={[currentX, 0, 0]}
                    fontSize={segment.fontSize}
                    color="#87CEEB"
                    anchorX="left"
                    anchorY="top"
                    font="/fonts/Courier.ttf"
                  >
                    {segment.text}
                  </Text>
                )
              })}
            </group>
          )
        })}
        
        {selection.start !== -1 && selection.end !== -1 && charPositions.current.length > selection.start && (
          <Text
            position={[charPositions.current[selection.start].x, charPositions.current[selection.start].y, 0.11]}
            fontSize={0.2}
            color="yellow"
            anchorX="left"
            anchorY="top"
            font="/fonts/Courier.ttf"
            maxWidth={15}
          >
            {displayText.substring(selection.start, selection.end + 1)}
          </Text>
        )}
        
                  {/* Animated cursor when active */}
          {isActive && (
            <Text
              position={[
                cursorX,
                -(processedLines.length - 1) * 0.35,
                0.1
              ]}
              fontSize={0.2}
              color="#87CEEB"
              anchorX="left"
              anchorY="top"
              font="/fonts/Courier.ttf"
            >
              |
            </Text>
          )}
      </group>


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
  alignCamera,
}: Omit<WritingProcessor3DProps, 'cameraDistance'> & { alignCamera: number }) {
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
    <>
      {/* Central Text Panel - clean and minimal */}
      <CentralTextPanel 
        content={content}
        isActive={isActive}
        onTextClick={handleTextClick}
      />
      
      {/* Clean, minimal lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.0} />
      <pointLight position={[-10, -10, -10]} intensity={0.6} />
      <pointLight position={[0, 10, 0]} intensity={0.8} />
      
      <OrbitControls
        ref={controlsRef}
        target={[0, 0, 0]}
        enablePan={true}
        enableZoom={false} // Manual zoom is disabled
        enableRotate={true}
        autoRotate={false}
        maxPolarAngle={Math.PI * 0.9}
        minPolarAngle={Math.PI * 0.1}
      />
    </>
  )
}

// Main 3D Writing Processor Component
export function WritingProcessor3D({
  content,
  isActive,
  onFocus,
  cameraDistance,
  alignCamera,
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
        <WritingScene3D content={content} isActive={isActive} onFocus={onFocus} alignCamera={alignCamera} />
        <CameraManager distance={cameraDistance} />
      </Canvas>
    </div>
  )
}
