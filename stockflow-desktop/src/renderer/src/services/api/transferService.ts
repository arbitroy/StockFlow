import apiClient, { useMockData, useConnectionStore } from './config'
import { TransferRequest } from '../../shared/types'
import notifyService from '../notification'
import syncService from '../syncService'

// Helper for mock delays
const mockDelay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Service for stock transfer operations with offline support
 */
const transferService = {
  /**
   * Transfer stock between locations
   */
  transferStock: async (transferRequest: TransferRequest): Promise<any> => {
    if (useMockData) {
      await mockDelay(800)

      // Mock implementation for testing UI
      const mockResponse = {
        outMovement: {
          id: crypto.randomUUID(),
          stockItemId: transferRequest.stockItemId,
          quantity: transferRequest.quantity,
          type: 'OUT',
          locationId: transferRequest.sourceLocationId,
          reference: `TRANSFER-${Date.now()}`
        },
        inMovement: {
          id: crypto.randomUUID(),
          stockItemId: transferRequest.stockItemId,
          quantity: transferRequest.quantity,
          type: 'IN',
          locationId: transferRequest.targetLocationId,
          reference: `TRANSFER-${Date.now()}`
        }
      }

      return mockResponse
    }

    // Check if online
    if (!useConnectionStore.getState().isConnected) {
      // Add to offline queue
      syncService.addToQueue({
        type: 'CREATE',
        entity: 'TRANSFER',
        data: transferRequest as unknown as Record<string, unknown>
      })

      notifyService.info('Transfer saved locally and will be processed when online')

      // Return a temporary response
      return {
        offlineMode: true,
        pendingSync: true,
        timestamp: new Date()
      }
    }

    try {
      const response = await apiClient.post('/transfers', transferRequest)
      return response.data
    } catch (error) {
      console.error('Error transferring stock:', error)
      throw error
    }
  },

  /**
   * Process transfer in the offline queue
   */
  processOfflineTransfer: async (transferRequest: TransferRequest): Promise<void> => {
    try {
      await apiClient.post('/transfers', transferRequest)
    } catch (error) {
      console.error('Failed to process offline transfer:', error)
      throw error
    }
  }
}

export default transferService
