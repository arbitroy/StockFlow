import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Define the settings interface
export interface AppSettings {
  apiUrl: string
  defaultLocation: string
  syncInterval: number // in milliseconds
  offlineMode: boolean
  theme: 'light' | 'dark' | 'system'
  autoSync: boolean
  lowStockThreshold: number
}

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  apiUrl: 'http://localhost:8080/api',
  defaultLocation: '',
  syncInterval: 60000, // 1 minute
  offlineMode: false,
  theme: 'system',
  autoSync: true,
  lowStockThreshold: 10
}

// Create settings store with persistence
export const useSettingsStore = create(
  persist<AppSettings & { updateSettings: (settings: Partial<AppSettings>) => void }>(
    (set) => ({
      ...DEFAULT_SETTINGS,
      updateSettings: (newSettings): void => set((state) => ({ ...state, ...newSettings }))
    }),
    {
      name: 'stockflow-settings'
    }
  )
)

// Settings service for managing application settings
const settingsService = {
  // Get all settings
  getSettings: (): AppSettings => {
    const state = useSettingsStore.getState()
    const { ...settings } = state
    return settings
  },

  // Update one or more settings
  updateSettings: (settings: Partial<AppSettings>): void => {
    useSettingsStore.getState().updateSettings(settings)
  },

  // Reset settings to defaults
  resetSettings: (): void => {
    useSettingsStore.getState().updateSettings(DEFAULT_SETTINGS)
  },

  // Get a specific setting
  getSetting: <K extends keyof AppSettings>(key: K): AppSettings[K] => {
    return useSettingsStore.getState()[key]
  },

  // Set a specific setting
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]): void => {
    useSettingsStore.getState().updateSettings({ [key]: value } as Partial<AppSettings>)
  }
}

export default settingsService
