import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'
import notifyService from '../notification'
import { create } from 'zustand'

// Default API URL from environment or use backend URL
const API_URL = import.meta.env.RENDERER_VITE_API_URL || 'http://localhost:8080/api'

// Interface for API connection state
interface ConnectionState {
  isConnected: boolean
  lastChecked: Date | null
  setConnected: (isConnected: boolean) => void
  checkConnection: () => Promise<boolean>
}

// Create a connection state store with Zustand
export const useConnectionStore = create<ConnectionState>((set) => ({
  isConnected: false,
  lastChecked: null,
  setConnected: (isConnected: boolean): void => set({ isConnected, lastChecked: new Date() }),
  checkConnection: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/health', { timeout: 3000 })
      const isConnected = response.status === 200
      set({ isConnected, lastChecked: new Date() })
      return isConnected
    } catch {
      set({ isConnected: false, lastChecked: new Date() })
      return false
    }
  }
}))

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased timeout for large data loads
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add timestamp to prevent caching issues
    if (config.method?.toLowerCase() === 'get') {
      config.params = config.params || {}
      config.params['_t'] = new Date().getTime()
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Update connection status on successful response
    useConnectionStore.getState().setConnected(true)
    return response
  },
  (error: AxiosError) => {
    // Update connection status on network error
    if (error.code === 'ECONNABORTED' || !error.response) {
      useConnectionStore.getState().setConnected(false)
    }

    const { response } = error

    if (response) {
      // Handle different status codes
      switch (response.status) {
        case 400: {
          const data = response.data as { message?: string }
          const errorMessage = data?.message || 'Bad request. Please check your data.'
          notifyService.error(errorMessage)
          break
        }
        case 401:
          notifyService.error('Unauthorized. Please log in again.')
          // Handle auth error (redirect to login, etc.)
          localStorage.removeItem('token')
          break
        case 403:
          notifyService.error('Forbidden. You do not have permission to access this resource.')
          break
        case 404:
          notifyService.error('Resource not found.')
          break
        case 409:
          notifyService.error(
            (response.data as { message?: string })?.message || 'Conflict with existing data.'
          )
          break
        case 500:
          notifyService.error('Server error. Please try again later.')
          break
        default:
          notifyService.error(`Error: ${response.statusText}`)
      }
    } else if (error.request) {
      // Network error
      notifyService.warning('Cannot connect to server. Some features may be limited.')
      useConnectionStore.getState().setConnected(false)
      console.error('Network Error:', error.message)
    } else {
      // Other errors
      notifyService.error('An unexpected error occurred.')
      console.error('Error:', error.message)
    }

    return Promise.reject(error)
  }
)

// Add a method to check API health/connection
export const checkApiConnection = async (): Promise<boolean> => {
  return useConnectionStore.getState().checkConnection()
}

// Helper for local development when backend is not available
export const useMockData =
  import.meta.env.RENDERER_VITE_USE_MOCK_DATA === 'true' ||
  (process.env.NODE_ENV === 'development' && !import.meta.env.RENDERER_VITE_USE_REAL_API)

// Offline storage helper
export const offlineStorage = {
  saveData: (key: string, data: unknown): void => {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  },

  loadData: <T>(key: string): T | null => {
    try {
      const data = localStorage.getItem(`offline_${key}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to load offline data:', error)
      return null
    }
  },

  hasOfflineData: (key: string): boolean => {
    return localStorage.getItem(`offline_${key}`) !== null
  },

  clearOfflineData: (key: string): void => {
    localStorage.removeItem(`offline_${key}`)
  }
}

export default apiClient
