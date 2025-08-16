import { Link, useLocation } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/useAuth'
import './Navbar.css'

export function Navbar() {
  const { user, logout, loading } = useAuth()
  const location = useLocation()
  const [isNavbarOpen, setIsNavbarOpen] = useState(location.pathname === '/home')

  // Effect to open or close the navbar based on the current route
  useEffect(() => {
    setIsNavbarOpen(location.pathname === '/home')
  }, [location.pathname])

  // Close navbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isNavbarOpen && !target.closest('.navbar') && !target.closest('.navbar-toggle-orb')) {
        setIsNavbarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNavbarOpen])

  const toggleNavbar = () => {
    setIsNavbarOpen(!isNavbarOpen)
  }

  const closeNavbar = () => {
    setIsNavbarOpen(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      closeNavbar()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      <button
        className={`navbar-toggle-orb ${isNavbarOpen ? 'open' : ''}`}
        onClick={toggleNavbar}
        aria-label={isNavbarOpen ? 'Close navigation' : 'Open navigation'}
      />
      <nav className={`navbar ${isNavbarOpen ? 'open' : ''}`}>
        <div className="navbar-container">
          <div className={`nav-links ${isNavbarOpen ? 'active' : ''}`}>
            <Link
              to="/home"
              className="nav-link"
              activeProps={{ className: 'nav-link active' }}
              onClick={closeNavbar}
            >
              Home
            </Link>

            <Link
              to="/life-notes"
              className="nav-link"
              activeProps={{ className: 'nav-link active' }}
              onClick={closeNavbar}
            >
              Calendar
            </Link>

            <Link
              to="/writing"
              className="nav-link"
              activeProps={{ className: 'nav-link active' }}
              onClick={closeNavbar}
            >
              Writing
            </Link>
            
            {/* User authentication section */}
            {!loading && (
              <div className="nav-auth-section">
                {user ? (
                  <>
                    <span className="nav-user-info">
                      {user.is_guest ? 'Guest User' : `Welcome, ${user.username}`}
                    </span>
                    <button 
                      onClick={handleLogout}
                      className="nav-logout-btn"
                      disabled={loading}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <span className="nav-guest-info">
                    Not logged in
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
} 