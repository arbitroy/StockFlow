const ENDPOINTS = {
  // Stock endpoints
  STOCK: {
    BASE: '/api/stock',
    BY_ID: (id: string): string => `/api/stock/${id}`,
    MOVEMENT: '/api/stock/movement',
    LOW_STOCK: '/api/stock/low-stock'
  },

  // Sales endpoints
  SALES: {
    BASE: '/api/sales',
    BY_ID: (id: string): string => `/api/sales/${id}`,
    COMPLETE: (id: string): string => `/api/sales/${id}/complete`,
    CANCEL: (id: string): string => `/api/sales/${id}/cancel`,
    DAILY_SUMMARY: '/api/sales/daily-summary'
  },

  // Reports endpoints
  REPORTS: {
    STOCK: '/api/reports/stock',
    MOVEMENTS: '/api/reports/movements'
  },

  // Locations endpoints
  LOCATIONS: {
    BASE: '/api/locations',
    BY_ID: (id: string): string => `/api/locations/${id}`
  },

  // Transfers endpoints
  TRANSFERS: {
    BASE: '/api/transfers'
  },

  // Health check endpoint
  HEALTH: '/api/health'
}

export default ENDPOINTS
