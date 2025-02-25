import './assets/main.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Movements from './pages/Movements'
import NotFound from './pages/NotFound'
import Locations from './pages/Locations'
import Reports from './pages/Reports'
import Sales from './pages/Sales'

// Create router configuration with all routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
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
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}

export default App
