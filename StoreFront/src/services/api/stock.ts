import { apiService } from './client'
import ENDPOINTS from './endpoints'
import { StockItemDTO, StockMovementRequest } from './types'

export const stockService = {
  /**
   * Get all stock items
   */
  getAllStockItems: (): Promise<StockItemDTO[]> =>
    apiService.get<StockItemDTO[]>(ENDPOINTS.STOCK.BASE),

  /**
   * Get a stock item by ID
   */
  getStockItem: (id: string): Promise<StockItemDTO> =>
    apiService.get<StockItemDTO>(ENDPOINTS.STOCK.BY_ID(id)),

  /**
   * Create a new stock item
   */
  createStockItem: (stockItem: StockItemDTO): Promise<StockItemDTO> =>
    apiService.post<StockItemDTO>(
      ENDPOINTS.STOCK.BASE,
      stockItem as unknown as Record<string, unknown>
    ),

  /**
   * Update an existing stock item
   */
  updateStockItem: (id: string, stockItem: StockItemDTO): Promise<StockItemDTO> =>
    apiService.put<StockItemDTO>(ENDPOINTS.STOCK.BY_ID(id), stockItem),

  /**
   * Record a stock movement (in, out, adjust)
   */
  recordMovement: (movement: StockMovementRequest): Promise<void> =>
    apiService.post<void>(ENDPOINTS.STOCK.MOVEMENT, movement as unknown as Record<string, unknown>),

  /**
   * Get low stock items
   */
  getLowStockItems: (): Promise<StockItemDTO[]> =>
    apiService.get<StockItemDTO[]>(ENDPOINTS.STOCK.LOW_STOCK)
}
