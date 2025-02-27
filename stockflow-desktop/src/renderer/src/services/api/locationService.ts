import apiClient, { useMockData, offlineStorage } from './config'
import { LocationDTO, StockItemDTO } from '../../shared/types'
import notifyService from '../notification'

// Mock data for locations
const mockLocations: LocationDTO[] = [
  {
    id: '1',
    name: 'Main Warehouse',
    type: 'WAREHOUSE',
    createdAt: '2025-01-10T00:00:00Z'
  },
  {
    id: '2',
    name: 'Downtown Store',
    type: 'STORE',
    createdAt: '2025-01-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'East Distribution Center',
    type: 'WAREHOUSE',
    createdAt: '2025-01-20T00:00:00Z'
  },
  {
    id: '4',
    name: 'North Retail',
    type: 'STORE',
    createdAt: '2025-02-01T00:00:00Z'
  }
]

// Mock data for location inventory
const mockInventoryData = {
  '1': [
    {
      stockItem: {
        id: '1',
        name: 'Wireless Mouse',
        sku: 'MS-001',
        price: 24.99,
        quantity: 50,
        status: 'ACTIVE',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-02-20T00:00:00Z'
      },
      quantity: 30,
      locationId: '1'
    },
    {
      stockItem: {
        id: '2',
        name: 'USB-C Cable',
        sku: 'CAB-001',
        price: 12.99,
        quantity: 100,
        status: 'ACTIVE',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-02-15T00:00:00Z'
      },
      quantity: 75,
      locationId: '1'
    }
  ],
  '2': [
    {
      stockItem: {
        id: '1',
        name: 'Wireless Mouse',
        sku: 'MS-001',
        price: 24.99,
        quantity: 50,
        status: 'ACTIVE',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-02-20T00:00:00Z'
      },
      quantity: 20,
      locationId: '2'
    },
    {
      stockItem: {
        id: '3',
        name: 'Wireless Keyboard',
        sku: 'KB-003',
        price: 49.99,
        quantity: 25,
        status: 'ACTIVE',
        createdAt: '2025-01-12T00:00:00Z',
        updatedAt: '2025-02-18T00:00:00Z'
      },
      quantity: 10,
      locationId: '2'
    }
  ],
  '3': [
    {
      stockItem: {
        id: '2',
        name: 'USB-C Cable',
        sku: 'CAB-001',
        price: 12.99,
        quantity: 100,
        status: 'ACTIVE',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-02-15T00:00:00Z'
      },
      quantity: 25,
      locationId: '3'
    },
    {
      stockItem: {
        id: '4',
        name: 'Bluetooth Speaker',
        sku: 'SPKR-001',
        price: 79.99,
        quantity: 15,
        status: 'ACTIVE',
        createdAt: '2025-01-20T00:00:00Z',
        updatedAt: '2025-02-10T00:00:00Z'
      },
      quantity: 15,
      locationId: '3'
    }
  ],
  '4': [
    {
      stockItem: {
        id: '3',
        name: 'Wireless Keyboard',
        sku: 'KB-003',
        price: 49.99,
        quantity: 25,
        status: 'ACTIVE',
        createdAt: '2025-01-12T00:00:00Z',
        updatedAt: '2025-02-18T00:00:00Z'
      },
      quantity: 15,
      locationId: '4'
    }
  ]
}

// All stock items (for reference)
const mockStockItems: StockItemDTO[] = [
  {
    id: '1',
    name: 'Wireless Mouse',
    sku: 'MS-001',
    price: 24.99,
    quantity: 50,
    status: 'ACTIVE',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-02-20T00:00:00Z'
  },
  {
    id: '2',
    name: 'USB-C Cable',
    sku: 'CAB-001',
    price: 12.99,
    quantity: 100,
    status: 'ACTIVE',
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-02-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'Wireless Keyboard',
    sku: 'KB-003',
    price: 49.99,
    quantity: 25,
    status: 'ACTIVE',
    createdAt: '2025-01-12T00:00:00Z',
    updatedAt: '2025-02-18T00:00:00Z'
  },
  {
    id: '4',
    name: 'Bluetooth Speaker',
    sku: 'SPKR-001',
    price: 79.99,
    quantity: 15,
    status: 'ACTIVE',
    createdAt: '2025-01-20T00:00:00Z',
    updatedAt: '2025-02-10T00:00:00Z'
  }
]

// Helper for mock delays
const mockDelay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Service for location-related operations
 */
const locationService = {
  /**
   * Get all locations
   */
  getAllLocations: async function (): Promise<LocationDTO[]> {
    if (useMockData) {
      await mockDelay(800)
      return mockLocations
    }

    try {
      const response = await apiClient.get('/locations')
      return response.data
    } catch (error) {
      console.error('Error fetching locations:', error)

      // Check for offline data
      const offlineLocations = offlineStorage.loadData<LocationDTO[]>('locations')
      if (offlineLocations) {
        notifyService.info('Using cached location data')
        return offlineLocations
      }

      throw error
    }
  },

  /**
   * Get a single location by ID
   */
  getLocation: async function (id: string): Promise<LocationDTO> {
    if (useMockData) {
      await mockDelay(300)
      const location = mockLocations.find((loc) => loc.id === id)
      if (!location) {
        throw new Error('Location not found')
      }
      return location
    }

    try {
      const response = await apiClient.get(`/locations/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching location:', error)

      // Try to find in cached data
      const offlineLocations = offlineStorage.loadData<LocationDTO[]>('locations')
      if (offlineLocations) {
        const location = offlineLocations.find((loc) => loc.id === id)
        if (location) {
          notifyService.info('Using cached location data')
          return location
        }
      }

      throw error
    }
  },

  /**
   * Get inventory for a specific location
   */
  getLocationInventory: async function (locationId: string): Promise<any[]> {
    if (useMockData) {
      await mockDelay(800)
      return mockInventoryData[locationId as keyof typeof mockInventoryData] || []
    }

    try {
      const response = await apiClient.get(`/locations/${locationId}/inventory`)
      return response.data
    } catch (error) {
      console.error('Error fetching location inventory:', error)

      // Check for offline data
      const offlineInventory = offlineStorage.loadData<any[]>(`inventory_${locationId}`)
      if (offlineInventory) {
        notifyService.info('Using cached inventory data')
        return offlineInventory
      }

      throw error
    }
  },

  /**
   * Create a new location
   */
  createLocation: async function (location: Partial<LocationDTO>): Promise<LocationDTO> {
    if (useMockData) {
      await mockDelay(600)
      const newLocation = {
        ...location,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      } as LocationDTO

      return newLocation
    }

    const response = await apiClient.post('/locations', location)
    return response.data
  },

  /**
   * Update a location
   */
  updateLocation: async function (
    id: string,
    location: Partial<LocationDTO>
  ): Promise<LocationDTO> {
    if (useMockData) {
      await mockDelay(600)
      return {
        ...location,
        id,
        updatedAt: new Date().toISOString()
      } as LocationDTO
    }

    const response = await apiClient.put(`/locations/${id}`, location)
    return response.data
  },

  /**
   * Delete a location
   */
  deleteLocation: async function (id: string): Promise<void> {
    if (useMockData) {
      await mockDelay(500)
      return
    }

    await apiClient.delete(`/locations/${id}`)
  },

  /**
   * Get all stock items (helper method)
   */
  getAllStockItems: async function (): Promise<StockItemDTO[]> {
    if (useMockData) {
      await mockDelay(300)
      return mockStockItems
    }

    try {
      const response = await apiClient.get('/stock')
      return response.data
    } catch (error) {
      console.error('Error fetching stock items:', error)

      // Check for offline data
      const offlineItems = offlineStorage.loadData<StockItemDTO[]>('stock_items')
      if (offlineItems) {
        notifyService.info('Using cached stock data')
        return offlineItems
      }

      throw error
    }
  }
}

export default locationService
