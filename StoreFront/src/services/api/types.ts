export enum StockStatus {
  ACTIVE = 'ACTIVE',
  LOW_STOCK = 'LOW_STOCK',
  OUT_STOCK = 'OUT_STOCK',
  INACTIVE = 'INACTIVE'
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST'
}

export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum LocationType {
  WAREHOUSE = 'WAREHOUSE',
  STORE = 'STORE'
}

// Stock Item DTO
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

// Stock Movement Request
export interface StockMovementRequest {
  stockItemId: string
  quantity: number
  type: MovementType
  reference?: string
  notes?: string
}

// Sale Item Request
export interface SaleItemRequest {
  stockItemId: string
  quantity: number
}

// Create Sale Request
export interface CreateSaleRequest {
  customerName?: string
  customerPhone?: string
  items: SaleItemRequest[]
}

// Sale Response
export interface SaleResponse {
  id: string
  reference: string
  customerName?: string
  customerPhone?: string
  total: number
  status: SaleStatus
  items: SaleItemResponse[]
  createdAt: string
  updatedAt: string
}

// Sale Item Response
export interface SaleItemResponse {
  id: string
  stockItem: StockItemDTO
  quantity: number
  price: number
  total: number
}

// Daily Sales Summary
export interface DailySalesSummary {
  date: string
  totalSales: number
  totalAmount: number
}

// Reports
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

// Location
export interface Location {
  id: string
  name: string
  type: LocationType
  createdAt: string
  updatedAt: string
}

// Stock Location
export interface StockLocation {
  id: string
  stockItemId: string
  locationId: string
  quantity: number
  openingQuantity?: number
  createdAt?: string
  updatedAt?: string
}

// Transfer Request
export interface TransferRequest {
  stockItemId: string
  sourceLocationId: string
  targetLocationId: string
  quantity: number
  reference?: string
  notes?: string
}

// Stock Transfer
export interface StockTransfer {
  outMovement: StockMovement
  inMovement: StockMovement
}

// Stock Movement
export interface StockMovement {
  id: string
  stockItemId: string
  quantity: number
  type: MovementType
  reference?: string
  notes?: string
  locationId?: string
  createdAt: string
  updatedAt: string
}
