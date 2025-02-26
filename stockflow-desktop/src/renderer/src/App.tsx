import { useEffect } from 'react'
import { RouterProvider, createHashRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Movements from './pages/Movements'
import Locations from './pages/Locations'
import Reports from './pages/Reports'
import Sales from './pages/Sales'
import NotFound from './pages/NotFound'
import notifyService from './services/notification'

// Create router configuration with all routes
// Using HashRouter (createHashRouter) instead of BrowserRouter for Electron compatibility
const router = createHashRouter([
  {
    path: '/',
    element: <MainLayout>{null}</MainLayout>,
    children: [
      {
        path: '/',
        element: <Dashboard />
      },
      {
        path: '/inventory',
        element: <Inventory />
      },
      {
        path: '/movements',
        element: <Movements />
      },
      {
        path: '/locations',
        element: <Locations />
      },
      {
        path: '/reports',
        element: <Reports />
      },
      {
        path: '/sales',
        element: <Sales />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
])

function App(): JSX.Element {
  // Show welcome notification on initial load
  useEffect(() => {
    setTimeout(() => {
      notifyService.info('Welcome to StockFlow Inventory Management')
    }, 500)
  }, [])

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  )
}

export default App
