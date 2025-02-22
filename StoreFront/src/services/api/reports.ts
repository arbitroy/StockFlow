import { apiService } from './client'
import ENDPOINTS from './endpoints'
import { StockReport, StockMovementReport } from './types'

export const reportsService = {
  /**
   * Get stock report
   */
  getStockReport: (startDate: string, endDate: string): Promise<StockReport[]> =>
    apiService.get<StockReport[]>(ENDPOINTS.REPORTS.STOCK, { params: { startDate, endDate } }),

  /**
   * Get movement report
   */
  getMovementReport: (startDate: string, endDate: string): Promise<StockMovementReport[]> =>
    apiService.get<StockMovementReport[]>(ENDPOINTS.REPORTS.MOVEMENTS, {
      params: { startDate, endDate }
    })
}
