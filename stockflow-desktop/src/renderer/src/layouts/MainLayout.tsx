import { useState, useEffect, ReactNode } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../components/navigation/Sidebar'
import Header from '../components/navigation/Header'
import ConnectionStatus from '../components/ui/ConnectionStatus'

interface MainLayoutProps {
  children: ReactNode
}

const MainLayout = ({ children }: MainLayoutProps): JSX.Element => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isConnected, setIsConnected] = useState(true)

  // Effect to handle sidebar state based on screen size
  useEffect(() => {
    const handleResize = (): void => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return (): void => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Effect to simulate connection checks (in a real app, this would check the API)
  useEffect(() => {
    const checkConnection = (): void => {
      // Simulate connection status (90% chance of being connected)
      setIsConnected(Math.random() > 0.1)
    }

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    return (): void => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-x-hidden">
        {/* Connection status bar */}
        <ConnectionStatus isConnected={isConnected} />

        {/* Header */}
        <Header
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Main content area with scroll */}
        <main className="flex-1 overflow-y-auto p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="container mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
