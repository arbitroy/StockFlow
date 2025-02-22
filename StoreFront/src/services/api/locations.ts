import { apiService } from './client'
import ENDPOINTS from './endpoints'
import { Location, StockLocation } from './types'

export const locationsService = {
  /**
   * Get all locations
   */
  getAllLocations: (): Promise<Location[]> => apiService.get<Location[]>(ENDPOINTS.LOCATIONS.BASE),

  /**
   * Get a location by ID
   */
  getLocation: (id: string): Promise<Location> =>
    apiService.get<Location>(ENDPOINTS.LOCATIONS.BY_ID(id)),

  /**
   * Create a new location
   */
  createLocation: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> =>
    apiService.post<Location>(ENDPOINTS.LOCATIONS.BASE, location),

  /**
   * Update an existing location
   */
  updateLocation: (id: string, location: Partial<Location>): Promise<Location> =>
    apiService.put<Location>(ENDPOINTS.LOCATIONS.BY_ID(id), location),

  /**
   * Get stock items at a specific location
   */
  getStockAtLocation: (locationId: string): Promise<StockLocation[]> =>
    apiService.get<StockLocation[]>(`${ENDPOINTS.LOCATIONS.BY_ID(locationId)}/stock`)
}
