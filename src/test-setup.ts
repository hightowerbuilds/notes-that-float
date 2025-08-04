import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock Three.js and React Three Fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'canvas' }, children),
  useThree: () => ({
    camera: { position: { x: 0, y: 0, z: 0 } }
  }),
  useFrame: vi.fn()
}))

vi.mock('@react-three/drei', () => ({
  Stars: () => React.createElement('div', { 'data-testid': 'stars' }),
  OrbitControls: () => React.createElement('div', { 'data-testid': 'orbit-controls' }),
  Text: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'text', ...props }, children)
}))

// Mock TanStack Router with all necessary exports
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: any) => React.createElement('a', { 
    href: to, 
    className, 
    'data-testid': `nav-link-${to}` 
  }, children),
  createFileRoute: () => ({}),
  useSearch: () => ({}),
  useNavigate: () => vi.fn(),
  lazyRouteComponent: vi.fn(),
  Outlet: () => React.createElement('div', { 'data-testid': 'outlet' }),
  createRootRoute: () => ({}),
  redirect: vi.fn()
}))

// Mock Supabase with lazy initialization
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      }))
    }))
  }))
}))

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-gemini-key') 