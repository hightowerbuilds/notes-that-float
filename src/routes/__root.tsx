import { Outlet, createRootRoute, redirect } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => <Outlet />,
  beforeLoad: () => {
    // Redirect root path to home
    if (window.location.pathname === '/') {
      throw redirect({
        to: '/home',
      })
    }
  },
  notFoundComponent: () => (
    <div className="not-found">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  ),
})
