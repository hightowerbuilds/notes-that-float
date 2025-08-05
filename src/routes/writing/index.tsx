import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '../../components/Navbar/Navbar'
import { useAuth } from '../../lib/useAuth'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import './writing.css'

export const Route = createFileRoute('/writing/')({
  component: Writing,
})

function Writing() {
  const { user } = useAuth()

  return (
    <div className={`page-container ${!user ? 'no-navbar' : ''}`}>
      {user && <Navbar />}
      <Canvas style={{position: 'fixed', zIndex:0, top: 0, left: 0, width: '100%', height: '100vh'}}>
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
      <main className="main-content">
        <div className={`writing-content ${!user ? 'unauthenticated' : ''}`}>
          <h1 className="page-title">Writing</h1>
          <p className="page-description">Your writing space awaits...</p>
        </div>
      </main>
    </div>
  )
}