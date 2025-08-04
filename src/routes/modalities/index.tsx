import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '../../components/Navbar/Navbar'
import './modalities.css'

export const Route = createFileRoute('/modalities/')({
  component: ModalitiesPage,
})

function ModalitiesPage() {
  return (
    <div className="page-container">
      <Navbar />
      <main className="main-content">
        <div className="modalities-content">
          <header>
            <h1 className="page-title">Modalities</h1>
          </header>
          <div className="modalities-description">
            <p>Modalities content will go here...</p>
          </div>
        </div>
      </main>
    </div>
  )
}