import { Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/useAuth'
import './Navbar.css'

export function Navbar() {
  const { user, logout, loading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.nav-links') && !target.closest('.mobile-menu-toggle')) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      closeMobileMenu()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Mobile menu toggle */}
        <button 
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Mobile menu overlay */}
        <div 
          className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={closeMobileMenu}
        ></div>

        <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <Link
            to="/home"
            className="nav-link"
            activeProps={{ className: 'nav-link active' }}
            onClick={closeMobileMenu}
          >
            Home
          </Link>
          <Link
            to="/money-modes"
            className="nav-link"
            activeProps={{ className: 'nav-link active' }}
            onClick={closeMobileMenu}
          >
            Money Modes
          </Link>
          <Link
            to="/store"
            className="nav-link"
            activeProps={{ className: 'nav-link active' }}
            onClick={closeMobileMenu}
          >
           Brontosaurus Publications
          </Link>
          <Link
            to="/life-notes"
            className="nav-link"
            activeProps={{ className: 'nav-link active' }}
            onClick={closeMobileMenu}
          >
            Notes that Float
          </Link>
          
          {/* User authentication section */}
          {!loading && (
            <div className="nav-auth-section">
              {user ? (
                <>
                  <span className="nav-user-info">
                    Welcome, {user.username}
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
                  Guest User
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
} 