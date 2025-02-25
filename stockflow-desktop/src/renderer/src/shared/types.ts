/**
 * Shared type definitions used across both main and renderer processes
 */

// Enum Types
export type StockStatus = 'ACTIVE' | 'LOW_STOCK' | 'OUT_STOCK' | 'INACTIVE'
export type MovementType = 'IN' | 'OUT' | 'ADJUST'
export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'
export type LocationType = 'WAREHOUSE' | 'STORE'

// DTOs - Data Transfer Objects
export interface StockItemDTO {
  id?: string
  name: string
  sku: string
  price: number
  quantity: number
  status: StockStatus
  createdAt?: string
  updatedAt?: string
}

export interface LocationDTO {
  id?: string
  name: string
  type: LocationType
  createdAt?: string
  updatedAt?: string
}

export interface StockLocationDTO {
  id?: string
  stockItemId: string
  locationId: string
  quantity: number
  openingQuantity?: number
  createdAt?: string
  updatedAt?: string
}

export interface StockMovementDTO {
  id?: string
  stockItemId: string
  quantity: number
  type: MovementType
  reference?: string
  notes?: string
  locationId?: string
  createdAt?: string
  updatedAt?: string
}

export interface SaleItemDTO {
  id?: string
  stockItemId: string
  quantity: number
  price?: number
  total?: number
}

export interface SaleDTO {
  id?: string
  customerName?: string
  customerPhone?: string
  items: SaleItemDTO[]
  total?: number
  reference?: string
  status?: SaleStatus
  createdAt?: string
  updatedAt?: string
}

// Request Types
export interface StockMovementRequest {
  stockItemId: string
  quantity: number
  type: MovementType
  reference?: string
  notes?: string
  locationId?: string
}

export interface CreateSaleRequest {
  customerName?: string
  customerPhone?: string
  items: SaleItemRequest[]
}

export interface SaleItemRequest {
  stockItemId: string
  quantity: number
}

export interface TransferRequest {
  stockItemId: string
  sourceLocationId: string
  targetLocationId: string
  quantity: number
  reference?: string
  notes?: string
}

// Report Types
export interface StockReport {
  sku: string
  name: string
  quantity: number
  status: StockStatus
  value: number
  movementsCount: number
  salesCount: number
}

export interface StockMovementReport {
  itemName: string
  sku: string
  type: MovementType
  quantity: number
  date: string
  reference?: string
}

export interface DailySalesSummary {
  date: string
  totalSales: number
  totalAmount: number
}

export interface StockSummary {
  openingStock: number
  incoming: number
  outgoing: number
  remainder: number
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T
  message?: string
  timestamp?: string
}

// API Error
export interface ApiError {
  status: number
  message: string
  details?: string
}

// IPC Message Types (for Electron)
export interface IpcMessage {
  channel: string
  payload?: unknown
}

// App Settings
export interface AppSettings {
  apiUrl: string
  defaultLocation: string
  theme: 'light' | 'dark' | 'system'
  lowStockThreshold: number
  notifications: boolean
}
