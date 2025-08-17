import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Mesh, ShaderMaterial } from 'three'
import { DayText } from '../DayText/DayText'
import { monthColors, rgbToHex } from '../utils/monthColors'
import type { Note, CalendarDay } from '../utils/types'
import './PlanetScene.css'

interface PlanetSceneProps {
  textRotationDirection: number
  notes: Note[]
  onDayClick: (day: string) => void
  isTextPaused: boolean
  selectedDay: string
  calendar: CalendarDay[]
  selectedMonth: number
  areDatesVisible: boolean
  areNotesVisible: boolean
  areRingsVisible: boolean
  isPlanetVisible: boolean
  isHighlightMode: boolean
  highlightedDay: string | null
  targetRotation: number
}

export function PlanetScene({
  textRotationDirection,
  notes,
  onDayClick,
  isTextPaused,
  selectedDay,
  calendar,
  selectedMonth,
  areDatesVisible,
  areNotesVisible,
  areRingsVisible,
  isPlanetVisible,
  isHighlightMode,
  highlightedDay,
  targetRotation
}: PlanetSceneProps) {
  const planetRef = useRef<Mesh>(null)
  const textRef = useRef<Mesh>(null)
  const ringRef = useRef<Mesh>(null)

  useFrame((_state, delta) => {
    if (textRef.current) {
      if (targetRotation !== 0) {
        // Smooth rotation animation to target position
        const currentRotation = textRef.current.rotation.y
        const rotationDiff = targetRotation - currentRotation
        
        // Normalize the difference to the shortest path
        const normalizedDiff = ((rotationDiff + Math.PI) % (2 * Math.PI)) - Math.PI
        
        if (Math.abs(normalizedDiff) > 0.05) {
          // Continue rotating towards target
          textRef.current.rotation.y += normalizedDiff * delta * 3 // Adjust speed here
        } else {
          // Snap to target when close enough
          textRef.current.rotation.y = targetRotation
        }
      } else if (!isTextPaused) {
        // Normal continuous rotation when not paused and not animating to target
        textRef.current.rotation.y += delta * 0.05 * textRotationDirection
      }
    }

    if (!isTextPaused && targetRotation === 0) {
      // Only move when not paused and not in highlight animation
      if (planetRef.current) {
        planetRef.current.rotation.y += delta * 0.02
      }
      if (ringRef.current) {
        ringRef.current.rotation.z += delta * 0.03
      }
    }
    // When paused or animating, do nothing for planet and rings
  })

  // Gradient shader material with dynamic month colors
  const gradientMaterial = new ShaderMaterial({
    uniforms: {
      lightColor: { value: monthColors[selectedMonth].light },
      darkColor: { value: monthColors[selectedMonth].dark }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 lightColor;
      uniform vec3 darkColor;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Create gradient based on Y position (top to bottom)
        float t = (vPosition.y + 1.0) * 0.5; // Normalize to 0-1
        vec3 color = mix(darkColor, lightColor, t);
        
        // Add some variation based on normal for more realistic look
        float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        color = mix(color, lightColor, fresnel * 0.2); // Reduced fresnel intensity
        
        gl_FragColor = vec4(color, 0.7);
      }
    `,
    transparent: true,
    side: 2
  })

  const monthColorHex = rgbToHex(
    monthColors[selectedMonth].light[0],
    monthColors[selectedMonth].light[1], 
    monthColors[selectedMonth].light[2]
  )

  return (
    <>
      {/* Blue Planet with Gradient */}
      {isPlanetVisible && (
        <mesh ref={planetRef} position={[0, 0, 0]}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <primitive object={gradientMaterial} attach="material" />
        </mesh>
      )}
      
      {/* Days of the month - Rotating around planet */}
      <group ref={textRef} position={[0, 0, 0]}>
        {calendar.map((dateObj, index) => {
          const angle = (index / calendar.length) * Math.PI * 2
          const x = Math.cos(angle) * 5
          const z = Math.sin(angle) * 5
          
          return (
            <DayText
              key={dateObj.day}
              day={`${dateObj.day} ${dateObj.dow.toUpperCase()}`}
              position={[x, 0, z]}
              notes={notes}
              onDayClick={onDayClick}
              selectedDay={selectedDay}
              areNotesVisible={areNotesVisible}
              areDatesVisible={areDatesVisible}
              isHighlightMode={isHighlightMode}
              highlightedDay={highlightedDay}
            />
          )
        })}
      </group>
      
      {/* Very Thin Neon Blue Torus - Further out than text */}
      {areRingsVisible && (
        <>
          <mesh ref={ringRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[6, 0.01, 16, 32]} />
            <meshStandardMaterial color={monthColorHex} side={2} transparent opacity={0.3} />
          </mesh>
          
          {/* Inner Thin Light Blue Torus */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[5.8, 0.01, 16, 32]} />
            <meshStandardMaterial color={monthColorHex} side={2} transparent opacity={0.3} />
          </mesh>
        </>
      )}
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.6} />
      
      {/* Orbit Controls */}
      <OrbitControls 
        target={[0, -3, 0]}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={15}
        autoRotate={false}
      />
    </>
  )
}
