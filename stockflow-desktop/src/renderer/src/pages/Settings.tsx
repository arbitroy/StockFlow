import { useState, useEffect } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import settingsService, { AppSettings } from '../services/settingsService'
import { checkApiConnection, useConnectionStore } from '../services/api/config'
import notifyService from '../services/notification'
import syncService from '../services/syncService'

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(settingsService.getSettings())
  const [isTesting, setIsTesting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const isConnected = useConnectionStore((state) => state.isConnected)

  // Update local state when settings change
  useEffect(() => {
    const currentSettings = settingsService.getSettings()
    setSettings(currentSettings)
  }, [])

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target

    // Handle different input types
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement
      setSettings({
        ...settings,
        [name]: target.checked
      })
    } else if (type === 'number') {
      setSettings({
        ...settings,
        [name]: parseInt(value)
      })
    } else {
      setSettings({
        ...settings,
        [name]: value
      })
    }
  }

  // Save settings
  const handleSave = async (): Promise<void> => {
    setIsSaving(true)

    try {
      // Update the settings store
      settingsService.updateSettings(settings)

      // If API URL changed, test the connection
      if (settings.apiUrl !== settingsService.getSetting('apiUrl')) {
        await checkApiConnection()
      }

      notifyService.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      notifyService.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  // Test connection
  const handleTestConnection = async (): Promise<void> => {
    setIsTesting(true)

    try {
      // Update API URL in settings first
      settingsService.setSetting('apiUrl', settings.apiUrl)

      // Test the connection
      const isConnected = await checkApiConnection()

      if (isConnected) {
        notifyService.success('Connection successful!')
      } else {
        notifyService.error('Connection failed')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      notifyService.error('Connection test failed')
    } finally {
      setIsTesting(false)
    }
  }

  // Reset to defaults
  const handleReset = (): void => {
    setIsResetting(true)

    setTimeout(() => {
      settingsService.resetSettings()
      setSettings(settingsService.getSettings())
      notifyService.success('Settings reset to defaults')
      setIsResetting(false)
    }, 500) // Simulate a short delay for better UX
  }

  // Force sync
  const handleForceSync = async (): Promise<void> => {
    if (!isConnected) {
      notifyService.warning('Cannot sync while offline')
      return
    }

    if (syncService.offlineQueue.length === 0) {
      notifyService.info('No pending changes to synchronize')
      return
    }

    try {
      await syncService.processQueue()
    } catch (error) {
      console.error('Force sync failed:', error)
      notifyService.error('Synchronization failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure application preferences and connection settings"
      />

      <div className="bg-surface rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold text-primary-dark mb-6">API Connection</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="apiUrl" className="form-label">
              API URL
            </label>
            <input
              type="text"
              id="apiUrl"
              name="apiUrl"
              value={settings.apiUrl}
              onChange={handleChange}
              className="form-input"
              placeholder="http://localhost:8080/api"
            />
            <p className="mt-1 text-sm text-gray-500">The URL of the StockFlow API server</p>
          </div>

          <div className="flex items-center justify-start space-x-4 pt-2">
            <button onClick={handleTestConnection} disabled={isTesting} className="btn btn-outline">
              {isTesting ? (
                <>
                  <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  <span>Test Connection</span>
                </>
              )}
            </button>

            <div className="flex items-center">
              <span
                className={`inline-flex h-3 w-3 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm">{isConnected ? 'Connected to API' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold text-primary-dark mb-6">Synchronization</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="syncInterval" className="form-label">
              Sync Interval (milliseconds)
            </label>
            <input
              type="number"
              id="syncInterval"
              name="syncInterval"
              value={settings.syncInterval}
              onChange={handleChange}
              min="5000"
              step="1000"
              className="form-input"
            />
            <p className="mt-1 text-sm text-gray-500">
              How often to automatically check for and sync changes (minimum 5000ms)
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoSync"
              name="autoSync"
              checked={settings.autoSync}
              onChange={handleChange}
              className="form-checkbox"
            />
            <label htmlFor="autoSync" className="ml-2 text-sm text-gray-700">
              Automatically sync changes when connection is restored
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="offlineMode"
              name="offlineMode"
              checked={settings.offlineMode}
              onChange={handleChange}
              className="form-checkbox"
            />
            <label htmlFor="offlineMode" className="ml-2 text-sm text-gray-700">
              Work in offline mode (saves all changes locally)
            </label>
          </div>

          <div className="pt-2">
            <button
              onClick={handleForceSync}
              disabled={!isConnected || syncService.offlineQueue.length === 0}
              className="btn btn-outline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Force Sync Now</span>
            </button>
            <span className="ml-3 text-sm text-gray-500">
              {syncService.offlineQueue.length} pending changes
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold text-primary-dark mb-6">Application Settings</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="lowStockThreshold" className="form-label">
              Low Stock Threshold
            </label>
            <input
              type="number"
              id="lowStockThreshold"
              name="lowStockThreshold"
              value={settings.lowStockThreshold}
              onChange={handleChange}
              min="1"
              className="form-input"
            />
            <p className="mt-1 text-sm text-gray-500">
              Items with quantity below this value will be marked as low stock
            </p>
          </div>

          <div>
            <label htmlFor="defaultLocation" className="form-label">
              Default Location
            </label>
            <input
              type="text"
              id="defaultLocation"
              name="defaultLocation"
              value={settings.defaultLocation}
              onChange={handleChange}
              className="form-input"
              placeholder="Main Warehouse"
            />
          </div>

          <div>
            <label htmlFor="theme" className="form-label">
              Theme
            </label>
            <select
              id="theme"
              name="theme"
              value={settings.theme}
              onChange={handleChange}
              className="form-select"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={handleReset} disabled={isResetting} className="btn btn-outline">
          {isResetting ? (
            <>
              <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>Resetting...</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Reset to Defaults</span>
            </>
          )}
        </button>

        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
          {isSaving ? (
            <>
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default Settings
