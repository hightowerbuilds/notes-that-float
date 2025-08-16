import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Box } from '@react-three/drei'
import * as THREE from 'three'

interface WritingProcessor3DProps {
  content: string
  isActive: boolean
  onFocus: () => void
  cameraDistance: number
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
  onTextClick
}: {
  content: string
  isActive: boolean
  onTextClick: () => void
}) {
  const panelRef = useRef<THREE.Group>(null)
  const [displayText, setDisplayText] = useState(content || 'Click to start writing...')

  // Update display text when content changes
  useEffect(() => {
    setDisplayText(content || 'Click to start writing...')
  }, [content])

  // Process text into lines
  const lines = displayText.split('\n')
  const maxCharsPerLine = 60
  const processedLines: string[] = []
  
  lines.forEach(line => {
    if (line.length <= maxCharsPerLine) {
      processedLines.push(line)
    } else {
      const words = line.split(' ')
      let currentLine = ''
      words.forEach(word => {
        if ((currentLine + word).length <= maxCharsPerLine) {
          currentLine += (currentLine ? ' ' : '') + word
        } else {
          if (currentLine) processedLines.push(currentLine)
          currentLine = word
        }
      })
      if (currentLine) processedLines.push(currentLine)
    }
  })

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
          opacity={0.05} 
          transparent 
          side={THREE.DoubleSide}
        />
      </Box>



      {/* Text content */}
      <group position={[-7.5, 5.5, 0]}>
        {processedLines.map((line, index) => (
          <Text
            key={index}
            position={[0, -index * 0.35, 0.1]}
            fontSize={0.2}
            color="#87CEEB"
            anchorX="left"
            anchorY="top"
            font="/fonts/Courier.ttf"
            maxWidth={15}
          >
            {line}
          </Text>
        ))}
        
                  {/* Animated cursor when active */}
          {isActive && (
            <Text
              position={[
                (processedLines[processedLines.length - 1]?.length || 0) * 0.12,
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
}: Omit<WritingProcessor3DProps, 'cameraDistance'>) {
  
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

export function WritingProcessor3D({
  content,
  isActive,
  onFocus,
  cameraDistance,
}: WritingProcessor3DProps) {
  return (
    <div style={{ width: '100%', height: '100vh', background: 'transparent' }}>
      <Canvas
        // Set the initial camera position, but updates are now handled by CameraManager
        camera={{ position: [0, 0, cameraDistance], fov: 60 }}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent'
        }}
      >
        <WritingScene3D content={content} isActive={isActive} onFocus={onFocus} />
        <CameraManager distance={cameraDistance} />
      </Canvas>
    </div>
  )
}
