import apiClient, { useMockData, useConnectionStore, offlineStorage } from './config'
import { LocationDTO, StockItemDTO, TransferRequest } from '../../shared/types'
import notifyService from '../notification'
import syncService from '../syncService'

interface LocationService {
  getAllLocations(): Promise<LocationDTO[]>
  getLocationInventory(locationId: string): Promise<
    {
      stockItem: StockItemDTO
      quantity: number
      locationId: string
    }[]
  >
}

const locationService: LocationService = {
  /**
   * Fetch all locations with robust error handling
   */
  async getAllLocations(): Promise<LocationDTO[]> {
    if (useMockData) {
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
      // Fallback to cached locations
      const cachedLocations = offlineStorage.loadData<LocationDTO[]>('locations')

      if (cachedLocations) {
        notifyService.warning('Using cached location data')
        return cachedLocations
      }

      // Last resort: return mock data
      notifyService.error('Failed to fetch locations')
      return []
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

      notifyService.error(`Failed to fetch inventory for location ${locationId}`)
      return []
    }
  }
}

export default locationService
