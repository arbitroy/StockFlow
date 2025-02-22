// src/services/api/transfers.ts
import { apiService } from './client'
import ENDPOINTS from './endpoints'
import { TransferRequest, StockTransfer } from './types'

export const transfersService = {
  /**
   * Transfer stock between locations
   */
  transferStock: (transfer: TransferRequest): Promise<StockTransfer> =>
    apiService.post<StockTransfer>(
      ENDPOINTS.TRANSFERS.BASE,
      transfer as unknown as Record<string, unknown>
    ),

  /**
   * Get transfer history
   */
  getTransferHistory: (startDate: string, endDate: string): Promise<StockTransfer[]> =>
    apiService.get<StockTransfer[]>(`${ENDPOINTS.TRANSFERS.BASE}/history`, {
      params: { startDate, endDate }
    }),

  /**
   * Get pending transfers
   */
  getPendingTransfers: (): Promise<StockTransfer[]> =>
    apiService.get<StockTransfer[]>(`${ENDPOINTS.TRANSFERS.BASE}/pending`)
}
