import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '../../components/Navbar/Navbar'
import { AuthForm } from '../../components/AuthForm/AuthForm'
import { useAuth } from '../../lib/useAuth'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import './home.css'

export const Route = createFileRoute('/home/')({
  component: Home,
})

function Home() {
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
        <div className={`home-content ${!user ? 'unauthenticated' : ''}`}>
          {!user && (
            <>
              <h1 className="site-heading">hightowerbuilds.com</h1>
              <AuthForm />
         
            </>
          )}
          
          {user && (
            <>
              <h1 className="welcome-title-3d">Welcome to hightowerbuilds</h1>
              <p className="quote-text-3d">This project's intentions are of wide berth and are currently sprawling as such. Its inspirations go deep and are free to roam through all modalities. Please look around and interact.</p>
             
            </>
          )}
        </div>
      </main>
    </div>
  )
} 