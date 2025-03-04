import apiClient, { useMockData, useConnectionStore, offlineStorage } from './config'
import { SaleDTO, SaleStatus } from '../../shared/types'
import notifyService from '../notification'
import syncService from '../syncService'

// Helper for mock delays
const mockDelay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

// Mock sales data
const mockSales: SaleDTO[] = [
  {
    id: '1',
    customerName: 'John Smith',
    customerPhone: '555-123-4567',
    locationId: '1',
    locationName: 'Main Warehouse',
    items: [
      {
        id: '1-1',
        stockItemId: '1',
        quantity: 2,
        price: 24.99,
        total: 49.98
      }
    ],
    total: 49.98,
    reference: 'SALE-12345',
    status: 'COMPLETED',
    createdAt: '2025-02-20T14:22:35Z'
  },
  {
    id: '2',
    customerName: 'Jane Doe',
    customerPhone: '555-987-6543',
    locationId: '2',
    locationName: 'Downtown Store',
    items: [
      {
        id: '2-1',
        stockItemId: '2',
        quantity: 1,
        price: 12.99,
        total: 12.99
      },
      {
        id: '2-2',
        stockItemId: '3',
        quantity: 1,
        price: 49.99,
        total: 49.99
      }
    ],
    total: 62.98,
    reference: 'SALE-23456',
    status: 'PENDING',
    createdAt: '2025-02-22T09:15:42Z'
  },
  {
    id: '3',
    customerName: 'Bob Johnson',
    customerPhone: '555-456-7890',
    locationId: '4',
    locationName: 'North Retail',
    items: [
      {
        id: '3-1',
        stockItemId: '4',
        quantity: 1,
        price: 79.99,
        total: 79.99
      }
    ],
    total: 79.99,
    reference: 'SALE-34567',
    status: 'COMPLETED',
    createdAt: '2025-02-23T16:30:12Z'
  }
]

/**
 * Service for sale-related operations
 */
const saleService = {
  /**
   * Get all sales
   */
  getAllSales: async (): Promise<SaleDTO[]> => {
    if (useMockData) {
      await mockDelay(800)
      return [...mockSales]
    }

    try {
      const response = await apiClient.get('/sales')
      return response.data
    } catch (error) {
      console.error('Error fetching sales:', error)

      // Check for offline data
      const offlineSales = offlineStorage.loadData<SaleDTO[]>('sales')
      if (offlineSales) {
        notifyService.info('Using cached sales data')
        return offlineSales
      }

      throw error
    }
  },

  /**
   * Get sales by date range
   */
  getSalesByDateRange: async (startDate: string, endDate: string): Promise<SaleDTO[]> => {
    if (useMockData) {
      await mockDelay(600)
      const start = new Date(startDate)
      const end = new Date(endDate)

      return mockSales.filter((sale) => {
        const saleDate = new Date(sale.createdAt!)
        return saleDate >= start && saleDate <= end
      })
    }

    try {
      const response = await apiClient.get('/sales', {
        params: { startDate, endDate }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching sales by date range:', error)

      // Use cached data as fallback
      const offlineSales = offlineStorage.loadData<SaleDTO[]>('sales')
      if (offlineSales) {
        const start = new Date(startDate)
        const end = new Date(endDate)

        const filteredSales = offlineSales.filter((sale) => {
          const saleDate = new Date(sale.createdAt!)
          return saleDate >= start && saleDate <= end
        })

        notifyService.info('Using cached sales data')
        return filteredSales
      }

      throw error
    }
  },

  /**
   * Create a new sale
   */
  createSale: async (sale: {
    customerName?: string
    customerPhone?: string
    locationId: string
    items: { stockItemId: string; quantity: number }[]
  }): Promise<SaleDTO> => {
    if (useMockData) {
      await mockDelay(1000)

      // Generate a new mock sale
      const newSale: SaleDTO = {
        id: `mock-${Date.now()}`,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        locationId: sale.locationId,
        locationName: 'Mock Location', // In a real app, this would come from backend
        items: sale.items.map((item, index) => ({
          id: `item-${Date.now()}-${index}`,
          stockItemId: item.stockItemId,
          quantity: item.quantity,
          // In a real app, price would be fetched from the backend
          price: 19.99,
          total: 19.99 * item.quantity
        })),
        total: sale.items.reduce((sum, item) => sum + 19.99 * item.quantity, 0),
        reference: `SALE-${Date.now().toString().slice(-5)}`,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }

      // Update mock data
      mockSales.unshift(newSale)

      return newSale
    }

    // Check if online
    if (!useConnectionStore.getState().isConnected) {
      // Prepare offline sale data
      const offlineSale = {
        ...sale,
        offlineCreated: true,
        timestamp: Date.now()
      }

      // Add to offline queue
      syncService.addToQueue({
        type: 'CREATE',
        entity: 'SALE',
        data: offlineSale as unknown as Record<string, unknown>
      })

      // Create a temporary sale object for UI
      const tempSale: SaleDTO = {
        id: `offline-${Date.now()}`,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        locationId: sale.locationId,
        locationName: 'Pending Sync', // Will be updated when synced
        items: sale.items.map((item, index) => ({
          id: `offline-item-${Date.now()}-${index}`,
          stockItemId: item.stockItemId,
          quantity: item.quantity,
          price: 0, // Will be calculated on server
          total: 0 // Will be calculated on server
        })),
        total: 0, // Will be calculated on server
        reference: `OFFLINE-${Date.now().toString().slice(-5)}`,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }

      // Update offline cache
      const offlineSales = offlineStorage.loadData<SaleDTO[]>('sales') || []
      offlineStorage.saveData('sales', [tempSale, ...offlineSales])

      notifyService.info('Sale saved locally and will sync when online')
      return tempSale
    }

    const response = await apiClient.post('/sales', sale)
    return response.data
  },

  /**
   * Update a sale's status
   */
  updateSaleStatus: async (saleId: string, status: SaleStatus): Promise<SaleDTO> => {
    if (useMockData) {
      await mockDelay(800)

      // Find and update the sale in mock data
      const saleIndex = mockSales.findIndex((s) => s.id === saleId)
      if (saleIndex === -1) {
        throw new Error('Sale not found')
      }

      const updatedSale = {
        ...mockSales[saleIndex],
        status,
        updatedAt: new Date().toISOString()
      }

      mockSales[saleIndex] = updatedSale
      return updatedSale
    }

    // Check if online
    if (!useConnectionStore.getState().isConnected) {
      // Add to offline queue
      syncService.addToQueue({
        type: 'UPDATE',
        entity: 'SALE',
        data: { id: saleId, status } as unknown as Record<string, unknown>
      })

      // Update local cache
      const offlineSales = offlineStorage.loadData<SaleDTO[]>('sales') || []
      const updatedSales = offlineSales.map((sale) => {
        if (sale.id === saleId) {
          return { ...sale, status, updatedAt: new Date().toISOString() }
        }
        return sale
      })
      offlineStorage.saveData('sales', updatedSales)

      // Find the updated sale for return
      const updatedSale = updatedSales.find((sale) => sale.id === saleId)
      if (!updatedSale) {
        throw new Error('Sale not found in local cache')
      }

      notifyService.info('Status update saved locally and will sync when online')
      return updatedSale
    }

    const response = await apiClient.patch(`/sales/${saleId}/status`, { status })
    return response.data
  },

  /**
   * Get a sale by ID
   */
  getSale: async (id: string): Promise<SaleDTO> => {
    if (useMockData) {
      await mockDelay(300)
      const sale = mockSales.find((s) => s.id === id)
      if (!sale) {
        throw new Error('Sale not found')
      }
      return { ...sale }
    }

    try {
      const response = await apiClient.get(`/sales/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching sale:', error)

      // Check for offline data
      const offlineSales = offlineStorage.loadData<SaleDTO[]>('sales') || []
      const offlineSale = offlineSales.find((s) => s.id === id)

      if (offlineSale) {
        notifyService.info('Using cached sale data')
        return offlineSale
      }

      throw error
    }
  }
}

export default saleService
