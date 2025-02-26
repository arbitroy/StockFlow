import apiClient, { useMockData, useConnectionStore, offlineStorage } from './config'
import { StockItemDTO, StockMovementRequest } from '../../shared/types'
import notifyService from '../notification'
import syncService from '../syncService'

// Mock data
const mockStockItems: StockItemDTO[] = [
  {
    id: '1',
    name: 'Wireless Mouse',
    sku: 'MS-001',
    price: 24.99,
    quantity: 45,
    status: 'ACTIVE',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-02-20T00:00:00Z'
  }
  // Other mock items...
]

// Mock delay function
const mockDelay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Service for stock-related operations with offline support
 */
const stockService = {
  /**
   * Get all stock items
   */
  getAllStockItems: async function (): Promise<StockItemDTO[]> {
    if (useMockData) {
      await mockDelay(800)
      return mockStockItems
    }

    try {
      const response = await apiClient.get('/stock')
      const items = response.data

      // Cache the results for offline use
      offlineStorage.saveData('stock_items', items)

      return items
    } catch (error) {
      console.error('Error fetching stock items:', error)

      // Check for offline data
      const offlineItems = offlineStorage.loadData<StockItemDTO[]>('stock_items')
      if (offlineItems) {
        notifyService.info('Using cached inventory data')
        return offlineItems
      }

      throw error
    }
  },

  /**
   * Get low stock items
   */
  getLowStockItems: async function (): Promise<StockItemDTO[]> {
    if (useMockData) {
      await mockDelay(500)
      return mockStockItems.filter(
        (item) => item.status === 'LOW_STOCK' || item.status === 'OUT_STOCK'
      )
    }

    try {
      const response = await apiClient.get('/stock/low-stock')
      return response.data
    } catch (error) {
      console.error('Error fetching low stock items:', error)

      // Fallback to filtering cached items
      const offlineItems = offlineStorage.loadData<StockItemDTO[]>('stock_items')
      if (offlineItems) {
        notifyService.info('Using cached low stock data')
        return offlineItems.filter(
          (item) => item.status === 'LOW_STOCK' || item.status === 'OUT_STOCK'
        )
      }

      throw error
    }
  },

  /**
   * Get a stock item by ID
   */
  /**
   * Get a stock item by ID
   */
  getStockItem: async (id: string): Promise<StockItemDTO> => {
    if (useMockData) {
      await mockDelay(300)
      const item = mockStockItems.find((item) => item.id === id)
      if (!item) {
        throw new Error('Stock item not found')
      }
      return item
    }

    try {
      const response = await apiClient.get(`/stock/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching stock item:', error)

      // Try to find in cached data
      const offlineItems = offlineStorage.loadData<StockItemDTO[]>('stock_items')
      if (offlineItems) {
        const item = offlineItems.find((item) => item.id === id)
        if (item) {
          notifyService.info('Using cached item data')
          return item
        }
      }

      throw error
    }
  },

  /**
   * Create a stock item
   */
  async createStockItem(stockItem: StockItemDTO): Promise<StockItemDTO> {
    if (useMockData) {
      await mockDelay(600)
      const newItem = {
        ...stockItem,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      mockStockItems.push(newItem)
      return newItem
    }

    // Check if online
    if (!useConnectionStore.getState().isConnected) {
      // Generate a temporary ID for offline use
      const tempItem = {
        ...stockItem,
        id: `temp_${crypto.randomUUID()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Add to offline queue
      syncService.addToQueue({
        type: 'CREATE',
        entity: 'STOCK',
        data: stockItem as unknown as Record<string, unknown> // Note: we queue the original item without the temp ID
      })

      // Update local cache
      const cachedItems = offlineStorage.loadData<StockItemDTO[]>('stock_items') || []
      offlineStorage.saveData('stock_items', [...cachedItems, tempItem])

      notifyService.info('Item saved locally and will sync when online')
      return tempItem
    }

    const response = await apiClient.post('/stock', stockItem)
    return response.data
  },

  /**
   * Update a stock item
   */
  /**
   * Update a stock item
   */
  updateStockItem: async (id: string, stockItem: StockItemDTO): Promise<StockItemDTO> => {
    if (useMockData) {
      await mockDelay(600)
      const index = mockStockItems.findIndex((item) => item.id === id)
      if (index === -1) {
        throw new Error('Stock item not found')
      }

      const updatedItem = {
        ...stockItem,
        id,
        updatedAt: new Date().toISOString()
      }

      mockStockItems[index] = updatedItem
      return updatedItem
    }

    // Check if online
    if (!useConnectionStore.getState().isConnected) {
      // Add to offline queue
      syncService.addToQueue({
        type: 'UPDATE',
        entity: 'STOCK',
        data: { ...stockItem, id }
      })

      // Update local cache
      const cachedItems = offlineStorage.loadData<StockItemDTO[]>('stock_items') || []
      const updatedItems = cachedItems.map((item) =>
        item.id === id ? { ...stockItem, id, updatedAt: new Date().toISOString() } : item
      )
      offlineStorage.saveData('stock_items', updatedItems)

      notifyService.info('Update saved locally and will sync when online')
      return { ...stockItem, id, updatedAt: new Date().toISOString() }
    }

    const response = await apiClient.put(`/stock/${id}`, stockItem)
    return response.data
  },

  /**
   * Record a stock movement
   */
  recordMovement: async (movement: StockMovementRequest): Promise<void> => {
    if (useMockData) {
      await mockDelay(500)

      // Update mock data
      const index = mockStockItems.findIndex((item) => item.id === movement.stockItemId)
      if (index === -1) {
        throw new Error('Stock item not found')
      }

      const item = mockStockItems[index]
      let newQuantity = item.quantity

      if (movement.type === 'IN') {
        newQuantity += movement.quantity
      } else if (movement.type === 'OUT') {
        if (item.quantity < movement.quantity) {
          throw new Error('Insufficient stock')
        }
        newQuantity -= movement.quantity
      }

      // Update status based on new quantity
      let newStatus = item.status
      if (newQuantity <= 0) {
        newStatus = 'OUT_STOCK'
      } else if (newQuantity <= 10) {
        newStatus = 'LOW_STOCK'
      } else {
        newStatus = 'ACTIVE'
      }

      mockStockItems[index] = {
        ...item,
        quantity: newQuantity,
        status: newStatus,
        updatedAt: new Date().toISOString()
      }

      return
    }

    // Check if online
    if (!useConnectionStore.getState().isConnected) {
      // Add to offline queue
      syncService.addToQueue({
        type: 'CREATE',
        entity: 'MOVEMENT',
        data: movement as unknown as Record<string, unknown>
      })

      // Update local cache to reflect movement
      const cachedItems = offlineStorage.loadData<StockItemDTO[]>('stock_items') || []
      const updatedItems = cachedItems.map((item) => {
        if (item.id === movement.stockItemId) {
          let newQuantity = item.quantity

          if (movement.type === 'IN') {
            newQuantity += movement.quantity
          } else if (movement.type === 'OUT') {
            if (item.quantity < movement.quantity) {
              throw new Error('Insufficient stock')
            }
            newQuantity -= movement.quantity
          } else if (movement.type === 'ADJUST') {
            newQuantity = movement.quantity // Direct adjustment
          }

          // Update status based on new quantity
          let newStatus = item.status
          if (newQuantity <= 0) {
            newStatus = 'OUT_STOCK'
          } else if (newQuantity <= 10) {
            newStatus = 'LOW_STOCK'
          } else {
            newStatus = 'ACTIVE'
          }

          return {
            ...item,
            quantity: newQuantity,
            status: newStatus,
            updatedAt: new Date().toISOString()
          }
        }
        return item
      })

      offlineStorage.saveData('stock_items', updatedItems)
      notifyService.info('Movement saved locally and will sync when online')
      return
    }

    await apiClient.post('/stock/movement', movement)
  },

  /**
   * Delete a stock item (if supported by backend)
   */
  deleteStockItem: async (id: string): Promise<void> => {
    if (useMockData) {
      await mockDelay(500)

      const index = mockStockItems.findIndex((item) => item.id === id)
      if (index === -1) {
        throw new Error('Stock item not found')
      }

      mockStockItems.splice(index, 1)
      return
    }

    // Check if online
    if (!useConnectionStore.getState().isConnected) {
      // Add to offline queue
      syncService.addToQueue({
        type: 'DELETE',
        entity: 'STOCK',
        data: { id }
      })

      // Update local cache
      const cachedItems = offlineStorage.loadData<StockItemDTO[]>('stock_items') || []
      const updatedItems = cachedItems.filter((item) => item.id !== id)
      offlineStorage.saveData('stock_items', updatedItems)

      notifyService.info('Deletion saved locally and will sync when online')
      return
    }

    await apiClient.delete(`/stock/${id}`)
  },

  /**
   * Refresh stock data from the server
   */
  refreshStockData: async (): Promise<StockItemDTO[]> => {
    if (useMockData) {
      await mockDelay(800)
      return mockStockItems
    }

    try {
      // Force a fresh fetch from server
      const response = await apiClient.get('/stock', {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      })

      const items = response.data

      // Update the cache
      offlineStorage.saveData('stock_items', items)

      return items
    } catch (error) {
      console.error('Failed to refresh stock data:', error)

      // Fallback to cache
      const cachedItems = offlineStorage.loadData<StockItemDTO[]>('stock_items')
      if (cachedItems) {
        notifyService.warning('Could not refresh data from server, using cached data')
        return cachedItems
      }

      throw error
    }
  }
}

export default stockService
