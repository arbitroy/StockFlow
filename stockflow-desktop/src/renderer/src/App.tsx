import { useEffect } from 'react'
import { RouterProvider, createHashRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Movements from './pages/Movements'
import Locations from './pages/Locations'
import LocationInventory from './pages/LocationInventory'
import Reports from './pages/Reports'
import Sales from './pages/Sales'
import Settings from './pages/Settings'
import Transfers from './pages/Transfers'
import NotFound from './pages/NotFound'
import notifyService from './services/notification'
import { checkApiConnection } from './services/api/config'

// Create router configuration with all routes
// Using HashRouter (createHashRouter) instead of BrowserRouter for Electron compatibility
const router = createHashRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'inventory',
        element: <Inventory />
      },
      {
        path: 'movements',
        element: <Movements />
      },
      {
        path: 'locations',
        element: <Locations />
      },
      {
        path: 'locations/:locationId/inventory',
        element: <LocationInventory />
      },
      {
        path: 'transfers',
        element: <Transfers />
      },
      {
        path: 'reports',
        element: <Reports />
      },
      {
        path: 'sales',
        element: <Sales />
      },
      {
        path: 'settings',
        element: <Settings />
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

    // Check API connection on startup
    checkApiConnection()
      .then((isConnected) => {
        if (isConnected) {
          notifyService.success('Connected to StockFlow API')
        } else {
          notifyService.warning('Could not connect to StockFlow API. Working in offline mode.')
        }
      })
      .catch(() => {
        notifyService.warning('Could not connect to StockFlow API. Working in offline mode.')
      })
  }, [])

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  )
}

export default App
