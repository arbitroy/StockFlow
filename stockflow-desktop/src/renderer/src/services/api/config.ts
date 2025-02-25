import axios, { AxiosInstance, AxiosError } from 'axios'
import notifyService from '../notification'

// Get API URL from environment or use default
const API_URL = import.meta.env.RENDERER_VITE_API_URL || 'http://localhost:8080/api'

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You could add auth token here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    const { response } = error

    if (response) {
      // Handle different status codes
      switch (response.status) {
        case 400:
          notifyService.error('Bad request. Please check your data.')
          break
        case 401:
          notifyService.error('Unauthorized. Please log in again.')
          // Handle auth error (redirect to login, etc.)
          break
        case 403:
          notifyService.error('Forbidden. You do not have permission to access this resource.')
          break
        case 404:
          notifyService.error('Resource not found.')
          break
        case 500:
          notifyService.error('Server error. Please try again later.')
          break
        default:
          notifyService.error(`Error: ${response.statusText}`)
      }
    } else if (error.request) {
      // Network error
      notifyService.error('Network error. Please check your connection.')
      console.error('Network Error:', error.message)
    } else {
      // Other errors
      notifyService.error('An unexpected error occurred.')
      console.error('Error:', error.message)
    }

    return Promise.reject(error)
  }
)

// Helper for local development when backend is not available
export const useMockData =
  process.env.NODE_ENV === 'development' && !import.meta.env.RENDERER_VITE_USE_REAL_API

export default apiClient
