import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Navbar } from './Navbar'

describe('Navbar Component', () => {
  it('renders all navigation links', () => {
    render(<Navbar />)
    
    expect(screen.getByTestId('nav-link-/home')).toBeInTheDocument()
    expect(screen.getByTestId('nav-link-/money-modes')).toBeInTheDocument()
    expect(screen.getByTestId('nav-link-/store')).toBeInTheDocument()
    expect(screen.getByTestId('nav-link-/life-notes')).toBeInTheDocument()
  })

  it('displays correct link text', () => {
    render(<Navbar />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Money Modes')).toBeInTheDocument()
    expect(screen.getByText('Brontosaurus Publications')).toBeInTheDocument()
    expect(screen.getByText('Life Notes')).toBeInTheDocument()
  })

  it('has correct navigation structure', () => {
    render(<Navbar />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    expect(nav).toHaveClass('navbar')
  })

  it('has proper CSS classes', () => {
    render(<Navbar />)
    
    const navLinks = screen.getAllByRole('link')
    navLinks.forEach(link => {
      expect(link).toHaveClass('nav-link')
    })
  })

  it('has correct href attributes', () => {
    render(<Navbar />)
    
    expect(screen.getByTestId('nav-link-/home')).toHaveAttribute('href', '/home')
    expect(screen.getByTestId('nav-link-/money-modes')).toHaveAttribute('href', '/money-modes')
    expect(screen.getByTestId('nav-link-/store')).toHaveAttribute('href', '/store')
    expect(screen.getByTestId('nav-link-/life-notes')).toHaveAttribute('href', '/life-notes')
  })
}) 