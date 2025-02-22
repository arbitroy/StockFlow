import { apiService } from './client'
import ENDPOINTS from './endpoints'
import { CreateSaleRequest, SaleResponse, DailySalesSummary } from './types'

export const salesService = {
  /**
   * Create a new sale
   */
  createSale: (saleRequest: CreateSaleRequest): Promise<SaleResponse> =>
    apiService.post<SaleResponse>(
      ENDPOINTS.SALES.BASE,
      saleRequest as unknown as Record<string, unknown>
    ),

  /**
   * Get a sale by ID
   */
  getSale: (id: string): Promise<SaleResponse> =>
    apiService.get<SaleResponse>(ENDPOINTS.SALES.BY_ID(id)),

  /**
   * Complete a sale
   */
  completeSale: (id: string): Promise<SaleResponse> =>
    apiService.post<SaleResponse>(ENDPOINTS.SALES.COMPLETE(id), {}),

  /**
   * Cancel a sale
   */
  cancelSale: (id: string): Promise<SaleResponse> =>
    apiService.post<SaleResponse>(ENDPOINTS.SALES.CANCEL(id), {}),

  /**
   * Get daily sales summary
   */
  getDailySalesSummary: (startDate: string, endDate: string): Promise<DailySalesSummary[]> =>
    apiService.get<DailySalesSummary[]>(ENDPOINTS.SALES.DAILY_SUMMARY, {
      params: { startDate, endDate }
    })
}
