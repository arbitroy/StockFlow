import apiClient, { useMockData } from './config'
import { StockItemDTO, StockMovementRequest } from '@shared/types'

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
  },
  {
    id: '2',
    name: 'USB-C Cable',
    sku: 'CAB-001',
    price: 12.99,
    quantity: 5,
    status: 'LOW_STOCK',
    createdAt: '2025-01-18T00:00:00Z',
    updatedAt: '2025-02-23T00:00:00Z'
  },
  {
    id: '3',
    name: 'Wireless Keyboard',
    sku: 'KB-003',
    price: 49.99,
    quantity: 3,
    status: 'LOW_STOCK',
    createdAt: '2025-01-20T00:00:00Z',
    updatedAt: '2025-02-22T00:00:00Z'
  },
  {
    id: '4',
    name: 'Bluetooth Speaker',
    sku: 'SPK-005',
    price: 79.99,
    quantity: 12,
    status: 'ACTIVE',
    createdAt: '2025-01-25T00:00:00Z',
    updatedAt: '2025-02-20T00:00:00Z'
  },
  {
    id: '5',
    name: 'HDMI Adapter',
    sku: 'ADPT-007',
    price: 18.99,
    quantity: 0,
    status: 'OUT_STOCK',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-15T00:00:00Z'
  },
  {
    id: '6',
    name: 'USB Flash Drive 64GB',
    sku: 'FD-006',
    price: 29.99,
    quantity: 2,
    status: 'LOW_STOCK',
    createdAt: '2025-02-05T00:00:00Z',
    updatedAt: '2025-02-20T00:00:00Z'
  },
  {
    id: '7',
    name: 'Monitor 24"',
    sku: 'MON-002',
    price: 249.99,
    quantity: 8,
    status: 'ACTIVE',
    createdAt: '2025-02-10T00:00:00Z',
    updatedAt: '2025-02-18T00:00:00Z'
  },
  {
    id: '8',
    name: 'Webcam HD',
    sku: 'CAM-004',
    price: 59.99,
    quantity: 20,
    status: 'ACTIVE',
    createdAt: '2025-02-12T00:00:00Z',
    updatedAt: '2025-02-20T00:00:00Z'
  }
]

// Mock delay function
const mockDelay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Service for stock-related operations
 */
const stockService = {
  /**
   * Get all stock items
   */
  getAllStockItems: async (): Promise<StockItemDTO[]> => {
    if (useMockData) {
      await mockDelay(800)
      return mockStockItems
    }

    const response = await apiClient.get('/stock')
    return response.data
  },

  /**
   * Get low stock items
   */
  getLowStockItems: async (): Promise<StockItemDTO[]> => {
    if (useMockData) {
      await mockDelay(500)
      return mockStockItems.filter(
        (item) => item.status === 'LOW_STOCK' || item.status === 'OUT_STOCK'
      )
    }

    const response = await apiClient.get('/stock/low-stock')
    return response.data
  },

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

    const response = await apiClient.get(`/stock/${id}`)
    return response.data
  },

  /**
   * Create a stock item
   */
  createStockItem: async (stockItem: StockItemDTO): Promise<StockItemDTO> => {
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

    const response = await apiClient.post('/stock', stockItem)
    return response.data
  },

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

    await apiClient.delete(`/stock/${id}`)
  }
}

export default stockService
