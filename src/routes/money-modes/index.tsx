import { createFileRoute, Link } from '@tanstack/react-router'
import { Navbar } from '../../components/Navbar/Navbar'
import { BankStatements } from '../../components/BankStatements/BankStatements'
import { MoneyModesHeading } from '../../components/MoneyModesHeading/MoneyModesHeading'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import './money-modes.css'

export const Route = createFileRoute('/money-modes/')({
  component: MoneyModesPage,
})

function MoneyModesPage() {

  return (
    <div className="page-container">
      <Navbar />
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
        <div className="money-modes-content">
          <MoneyModesHeading />

          <div className="money-modes-grid">
            <section className="process-statement-section">
              <div className="process-statement-header">
                <h2>Process New Statement</h2>
                <Link 
                  to="/pdf-extractor" 
                  className="toggle-button"
                >
                  Open
                </Link>
              </div>
            </section>

            <section className="statements-section">
              <BankStatements />
            </section>

            <section className="modalities-section">
              <div className="modalities-header">
                <h2>Modalities</h2>
                <Link 
                  to="/modalities" 
                  className="toggle-button"
                >
                  Open
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
} 