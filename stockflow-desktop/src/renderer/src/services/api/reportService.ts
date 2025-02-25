import apiClient, { useMockData } from './config'

// Mock data for reports
const mockStockReport = [
  {
    sku: 'MS-001',
    name: 'Wireless Mouse',
    quantity: 45,
    status: 'ACTIVE',
    value: 1124.55,
    movementsCount: 3,
    salesCount: 12
  },
  {
    sku: 'CAB-001',
    name: 'USB-C Cable',
    quantity: 5,
    status: 'LOW_STOCK',
    value: 64.95,
    movementsCount: 8,
    salesCount: 20
  },
  {
    sku: 'KB-003',
    name: 'Wireless Keyboard',
    quantity: 3,
    status: 'LOW_STOCK',
    value: 149.97,
    movementsCount: 2,
    salesCount: 5
  }
]

const mockMovementReport = [
  {
    itemName: 'Wireless Mouse',
    sku: 'MS-001',
    type: 'IN',
    quantity: 50,
    date: '2025-02-25T10:30:00Z',
    reference: 'PO-47219'
  },
  {
    itemName: 'USB-C Cable',
    sku: 'CAB-001',
    type: 'OUT',
    quantity: 3,
    date: '2025-02-25T14:15:00Z',
    reference: 'SALE-36912'
  },
  {
    itemName: 'Keyboard',
    sku: 'KB-003',
    type: 'ADJUST',
    quantity: 2,
    date: '2025-02-24T11:20:00Z',
    reference: 'ADJ-12983'
  }
]

/**
 * Service for report-related operations
 */
const reportService = {
  /**
   * Get stock report
   */
  getStockReport: async (
    startDate: string,
    endDate: string
  ): Promise<
    {
      sku: string
      name: string
      quantity: number
      status: string
      value: number
      movementsCount: number
      salesCount: number
    }[]
  > => {
    if (useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return mockStockReport
    }

    const response = await apiClient.get('/reports/stock', {
      params: { startDate, endDate }
    })
    return response.data
  },

  /**
   * Get movement report
   */
  getMovementReport: async (
    startDate: string,
    endDate: string
  ): Promise<
    {
      itemName: string
      sku: string
      type: string
      quantity: number
      date: string
      reference: string
    }[]
  > => {
    if (useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return mockMovementReport
    }

    const response = await apiClient.get('/reports/movements', {
      params: { startDate, endDate }
    })
    return response.data
  },

  /**
   * Get sales report (if implemented in backend)
   */
  getSalesReport: async (
    startDate: string,
    endDate: string
  ): Promise<
    {
      date: string
      totalSales: number
      totalAmount: number
    }[]
  > => {
    if (useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      // Mock sales report
      return [
        {
          date: '2025-02-25',
          totalSales: 8,
          totalAmount: 345.67
        },
        {
          date: '2025-02-24',
          totalSales: 12,
          totalAmount: 523.45
        },
        {
          date: '2025-02-23',
          totalSales: 6,
          totalAmount: 289.99
        }
      ]
    }

    const response = await apiClient.get('/reports/sales', {
      params: { startDate, endDate }
    })
    return response.data
  }
}

export default reportService
