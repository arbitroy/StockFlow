import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/navigation/Sidebar'
import Header from '../components/navigation/Header'
import ConnectionStatus from '../components/ui/ConnectionStatus'
import { useConnectionStore, offlineStorage } from '../services/api/config'
import syncService from '../services/syncService'
import settingsService from '../services/settingsService'

const MainLayout = (): JSX.Element => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Get connection state from our store
  const { isConnected, checkConnection } = useConnectionStore()

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

  // Effect to initialize connection checks and offline sync
  useEffect(() => {
    // Load settings
    const settings = settingsService.getSettings()
    let connectionInterval: NodeJS.Timeout | undefined

    // Use offline mode if configured
    if (settings.offlineMode) {
      useConnectionStore.setState({ isConnected: false })
    } else {
      // Initial connection check
      checkConnection()

      // Check connection status based on the configured sync interval
      connectionInterval = setInterval(
        () => {
          checkConnection()
        },
        Math.max(5000, settings.syncInterval / 2)
      ) // At least every 5 seconds or half the sync interval
    }

    // Start background sync service with configured interval
    const stopSync = syncService.startBackgroundSync(
      settings.autoSync ? settings.syncInterval : undefined
    )

    // Initialize offline storage
    if (offlineStorage.hasOfflineData('stock_items') === false) {
      offlineStorage.saveData('stock_items', [])
    }

    // Clean up intervals on unmount
    return (): void => {
      if (!settings.offlineMode && connectionInterval) {
        clearInterval(connectionInterval)
      }
      stopSync()
    }
  }, [checkConnection])

  // Effect to handle reconnection
  useEffect(() => {
    if (isConnected && syncService.offlineQueue.length > 0) {
      // When connection is restored and we have offline actions, process them
      syncService.processQueue()
    }
  }, [isConnected])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-x-hidden">
        {/* Connection status bar */}
        <ConnectionStatus
          isConnected={isConnected}
          offlineCount={syncService.offlineQueue.length}
        />

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
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
