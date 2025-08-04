
import './ToggleControls.css'

interface ToggleControlsProps {
  areDatesVisible: boolean
  areNotesVisible: boolean
  areRingsVisible: boolean
  isPlanetVisible: boolean
  onToggleDatesVisibility: () => void
  onToggleNotesVisibility: () => void
  onToggleRingsVisibility: () => void
  onTogglePlanetVisibility: () => void
}

export function ToggleControls({
  areDatesVisible,
  areNotesVisible,
  areRingsVisible,
  isPlanetVisible,
  onToggleDatesVisibility,
  onToggleNotesVisibility,
  onToggleRingsVisibility,
  onTogglePlanetVisibility
}: ToggleControlsProps) {
  return (
    <div className="new-box-section">
      <div className="new-box-header">
        <h3 className="new-box-title">TOGGLE</h3>
      </div>
      <div className="new-box-content">
        <div className="planet-controls-grid">
          <button
            onClick={onToggleDatesVisibility}
            className={`planet-control-btn${!areDatesVisible ? ' hide-state' : ''}`}
          >
            {areDatesVisible ? 'Hide Dates' : 'View Dates'}
          </button>
          
          <button
            onClick={onToggleNotesVisibility}
            className={`planet-control-btn${!areNotesVisible ? ' hide-state' : ''}`}
          >
            {areNotesVisible ? 'Hide Notes' : 'View Notes'}
          </button>
          
          <button
            onClick={onToggleRingsVisibility}
            className={`planet-control-btn${!areRingsVisible ? ' hide-state' : ''}`}
          >
            {areRingsVisible ? 'Hide Rings' : 'View Rings'}
          </button>
          
          <button
            onClick={onTogglePlanetVisibility}
            className={`planet-control-btn${!isPlanetVisible ? ' hide-state' : ''}`}
          >
            {isPlanetVisible ? 'Hide Planet' : 'View Planet'}
          </button>
        </div>
      </div>
    </div>
  )
}