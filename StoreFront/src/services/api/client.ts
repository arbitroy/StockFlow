import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// Create API base URL from environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can add logging or other request handling here
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
  (error) => {
    // Handle common errors
    const status = error.response?.status

    if (status === 404) {
      console.error('Resource not found:', error.config.url)
    } else if (status === 500) {
      console.error('Server error:', error.response?.data)
    }

    // Log all API errors
    console.error('API Error:', error.config.url, error.message)

    return Promise.reject(error)
  }
)

// Generic request methods
export const apiService = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.get(url, config)
    return response.data
  },

  async post<T>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.post(url, data, config)
    return response.data
  },

  async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.put(url, data, config)
    return response.data
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.delete(url, config)
    return response.data
  },

  // Method to check if the API is available
  async checkConnection(): Promise<boolean> {
    try {
      // Simple endpoint to check connection - adjust as needed
      await apiClient.get('/api/health', { timeout: 5000 })
      return true
    } catch {
      return false
    }
  }
}

export default apiClient
