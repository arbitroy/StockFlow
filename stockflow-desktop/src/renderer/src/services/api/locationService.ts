import apiClient, { useMockData, useConnectionStore, offlineStorage } from './config'
import { LocationDTO, StockItemDTO } from '../../shared/types'
import notifyService from '../notification'

const locationService = {
  /**
   * Fetch all locations with robust error handling
   */
  async getAllLocations(): Promise<LocationDTO[]> {
    if (useMockData) {
      // Return mock data after a small delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      return [
        {
          id: '1',
          name: 'Main Warehouse',
          type: 'WAREHOUSE',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Downtown Store',
          type: 'STORE',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'East Distribution Center',
          type: 'WAREHOUSE',
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          name: 'North Retail',
          type: 'STORE',
          createdAt: new Date().toISOString()
        }
      ]
    }

    try {
      const response = await apiClient.get('/locations')
      const locations = response.data

      // Cache locations for offline use
      offlineStorage.saveData('locations', locations)
      return locations
    } catch (error) {
      console.error('Failed to fetch locations:', error)

      // Fallback to cached locations
      const cachedLocations = offlineStorage.loadData<LocationDTO[]>('locations')

      if (cachedLocations?.length) {
        notifyService.warning('Using cached location data')
        return cachedLocations
      }

      // If we have no cached locations, we should at least try to create some default ones
      // in offline mode to allow the app to function
      if (!useConnectionStore.getState().isConnected) {
        const defaultLocations: LocationDTO[] = [
          {
            id: 'offline-warehouse-1',
            name: 'Main Warehouse (Offline)',
            type: 'WAREHOUSE',
            createdAt: new Date().toISOString()
          },
          {
            id: 'offline-store-1',
            name: 'Main Store (Offline)',
            type: 'STORE',
            createdAt: new Date().toISOString()
          }
        ]

        // Save these for future offline use
        offlineStorage.saveData('locations', defaultLocations)
        notifyService.info('Created temporary offline locations')
        return defaultLocations
      }

      // We're online but couldn't get locations and have no cache - return empty array
      notifyService.error('Failed to fetch locations')
      return []
    }
  },

  /**
   * Get a specific location
   */
  async getLocation(id: string): Promise<LocationDTO> {
    if (useMockData) {
      // Mock data for the requested location
      const mockData: Record<string, LocationDTO> = {
        '1': {
          id: '1',
          name: 'Main Warehouse',
          type: 'WAREHOUSE',
          createdAt: new Date().toISOString()
        },
        '2': {
          id: '2',
          name: 'Downtown Store',
          type: 'STORE',
          createdAt: new Date().toISOString()
        },
        '3': {
          id: '3',
          name: 'East Distribution Center',
          type: 'WAREHOUSE',
          createdAt: new Date().toISOString()
        },
        '4': {
          id: '4',
          name: 'North Retail',
          type: 'STORE',
          createdAt: new Date().toISOString()
        }
      }

      // Return the requested location or throw an error if not found
      const location = mockData[id]
      if (!location) {
        throw new Error(`Location with ID ${id} not found`)
      }

      return location
    }

    try {
      const response = await apiClient.get(`/locations/${id}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch location with ID ${id}:`, error)

      // Try to find in cached locations
      const cachedLocations = offlineStorage.loadData<LocationDTO[]>('locations')
      const cachedLocation = cachedLocations?.find((location) => location.id === id)

      if (cachedLocation) {
        notifyService.warning('Using cached location data')
        return cachedLocation
      }

      notifyService.error(`Location with ID ${id} not found`)
      throw error
    }
  },

  /**
   * Get inventory for a specific location with comprehensive error handling
   */
  async getLocationInventory(locationId: string): Promise<
    {
      stockItem: StockItemDTO
      quantity: number
      locationId: string
    }[]
  > {
    if (useMockData) {
      // Simulated location-specific inventory
      return [
        {
          stockItem: {
            id: '1',
            name: 'Wireless Mouse',
            sku: 'MS-001',
            price: 24.99,
            quantity: 50,
            status: 'ACTIVE'
          },
          quantity: 30,
          locationId: locationId
        },
        {
          stockItem: {
            id: '2',
            name: 'USB-C Cable',
            sku: 'CAB-001',
            price: 12.99,
            quantity: 25,
            status: 'ACTIVE'
          },
          quantity: 15,
          locationId: locationId
        },
        {
          stockItem: {
            id: '3',
            name: 'Wireless Keyboard',
            sku: 'KB-003',
            price: 49.99,
            quantity: 20,
            status: 'ACTIVE'
          },
          quantity: 10,
          locationId: locationId
        }
      ]
    }

    try {
      const response = await apiClient.get(`/locations/${locationId}/inventory`)
      const inventory = response.data

      // Cache location-specific inventory
      offlineStorage.saveData(`inventory_${locationId}`, inventory)
      return inventory
    } catch (error) {
      console.error(`Failed to fetch inventory for location ${locationId}:`, error)

      // Fallback to cached inventory
      const cachedInventory = offlineStorage.loadData<
        {
          stockItem: StockItemDTO
          quantity: number
          locationId: string
        }[]
      >(`inventory_${locationId}`)

      if (cachedInventory) {
        notifyService.warning('Using cached location inventory')
        return cachedInventory
      }

      notifyService.error(`Failed to fetch inventory for this location`)
      return []
    }
  },

  /**
   * Create a new location
   */
  async createLocation(
    location: Omit<LocationDTO, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<LocationDTO> {
    if (useMockData) {
      // Generate a mock response
      await new Promise((resolve) => setTimeout(resolve, 800))
      return {
        id: `mock-${Date.now()}`,
        name: location.name,
        type: location.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    try {
      const response = await apiClient.post('/locations', location)

      // Update locations cache
      const cachedLocations = offlineStorage.loadData<LocationDTO[]>('locations') || []
      offlineStorage.saveData('locations', [...cachedLocations, response.data])

      notifyService.success(`Location "${location.name}" created successfully`)
      return response.data
    } catch (error) {
      console.error('Failed to create location:', error)
      notifyService.error('Failed to create location')
      throw error
    }
  },

  /**
   * Update an existing location
   */
  async updateLocation(
    id: string,
    location: Omit<LocationDTO, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<LocationDTO> {
    if (useMockData) {
      // Generate a mock response
      await new Promise((resolve) => setTimeout(resolve, 800))
      return {
        id,
        name: location.name,
        type: location.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    try {
      const response = await apiClient.put(`/locations/${id}`, location)

      // Update locations cache
      const cachedLocations = offlineStorage.loadData<LocationDTO[]>('locations') || []
      const updatedLocations = cachedLocations.map((loc) => (loc.id === id ? response.data : loc))
      offlineStorage.saveData('locations', updatedLocations)

      notifyService.success(`Location "${location.name}" updated successfully`)
      return response.data
    } catch (error) {
      console.error(`Failed to update location with ID ${id}:`, error)
      notifyService.error('Failed to update location')
      throw error
    }
  },

  /**
   * Delete a location
   */
  async deleteLocation(id: string): Promise<void> {
    if (useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return
    }

    try {
      await apiClient.delete(`/locations/${id}`)

      // Update locations cache
      const cachedLocations = offlineStorage.loadData<LocationDTO[]>('locations') || []
      const updatedLocations = cachedLocations.filter((loc) => loc.id !== id)
      offlineStorage.saveData('locations', updatedLocations)

      notifyService.success('Location deleted successfully')
    } catch (error) {
      console.error(`Failed to delete location with ID ${id}:`, error)

      // Check if it's because there's stock at this location
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to delete location'
      if (errorMessage.includes('stock')) {
        notifyService.error('Cannot delete location with stock items. Transfer stock first.')
      } else {
        notifyService.error('Failed to delete location')
      }

      throw error
    }
  },

  /**
   * Get all stock items available across the system
   */
  async getAllStockItems(): Promise<StockItemDTO[]> {
    if (useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return [
        {
          id: '1',
          name: 'Wireless Mouse',
          sku: 'MS-001',
          price: 24.99,
          quantity: 50,
          status: 'ACTIVE'
        },
        {
          id: '2',
          name: 'USB-C Cable',
          sku: 'CAB-001',
          price: 12.99,
          quantity: 25,
          status: 'ACTIVE'
        },
        {
          id: '3',
          name: 'Wireless Keyboard',
          sku: 'KB-003',
          price: 49.99,
          quantity: 20,
          status: 'ACTIVE'
        }
      ]
    }

    try {
      const response = await apiClient.get('/stock')
      return response.data
    } catch (error) {
      console.error('Failed to fetch stock items:', error)
      notifyService.error('Failed to fetch stock items')
      return []
    }
  }
}

export default locationService
