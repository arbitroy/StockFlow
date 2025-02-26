import { useConnectionStore, offlineStorage } from './api/config'
import notifyService from './notification'
import stockService from './api/stockService'
import { MovementType, StockItemDTO } from '@renderer/shared/types'

// Types for offline actions
export type OfflineAction = {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: 'STOCK' | 'SALE' | 'LOCATION' | 'MOVEMENT'
  data: Record<string, unknown>
  timestamp: number
}

export const syncService = {
  // Queue for offline actions
  offlineQueue: [] as OfflineAction[],

  // Load offline queue from storage
  loadOfflineQueue(): void {
    const storedQueue = offlineStorage.loadData<OfflineAction[]>('action_queue')
    if (storedQueue) {
      this.offlineQueue = storedQueue
    }
  },

  // Save offline queue to storage
  saveOfflineQueue(): void {
    offlineStorage.saveData('action_queue', this.offlineQueue)
  },

  // Add action to offline queue
  addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp'>): void {
    const newAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }

    this.offlineQueue.push(newAction)
    this.saveOfflineQueue()

    notifyService.info(`Action saved for synchronization when connection is restored`)
  },

  // Process the offline queue
  async processQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return
    }

    if (!useConnectionStore.getState().isConnected) {
      return
    }

    const queueSize = this.offlineQueue.length
    const notification = notifyService.loading(`Syncing ${queueSize} offline changes...`)

    let successCount = 0
    const failedActions: OfflineAction[] = []

    for (const action of [...this.offlineQueue]) {
      try {
        switch (action.entity) {
          case 'STOCK':
            await this.processStockAction(action)
            break
          case 'SALE':
            await this.processSaleAction(action)
            break
          case 'LOCATION':
            await this.processLocationAction(action)
            break
          case 'MOVEMENT':
            await this.processMovementAction(action)
            break
        }

        // Remove successful action from queue
        this.offlineQueue = this.offlineQueue.filter((a) => a.id !== action.id)
        successCount++
      } catch (error) {
        console.error(`Failed to process offline action:`, action, error)
        failedActions.push(action)
      }
    }

    // Update queue with failed actions
    this.saveOfflineQueue()

    // Update notification
    if (failedActions.length === 0) {
      notification.success(`Successfully synchronized ${successCount} offline changes`)
    } else {
      notification.error(`Synchronized ${successCount} changes, ${failedActions.length} failed`)
    }
  },

  // Process stock-related actions
  async processStockAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'CREATE':
        await stockService.createStockItem(action.data as unknown as StockItemDTO)
        break
      case 'UPDATE':
        {
          const stockItem = action.data as unknown as StockItemDTO
          if (stockItem.id) {
            await stockService.updateStockItem(stockItem.id, stockItem)
          } else {
            throw new Error('Stock item ID is undefined')
          }
        }
        break
      case 'DELETE':
        await stockService.deleteStockItem(action.data.id as string)
        break
    }
  },

  // Process sale-related actions (implementation would be similar to stock)
  async processSaleAction(action: OfflineAction): Promise<void> {
    // Implement sale synchronization logic similar to stock
    console.log('Processing sale action', action)
    // This would use the appropriate service methods
  },

  // Process location-related actions
  async processLocationAction(action: OfflineAction): Promise<void> {
    // Implement location synchronization logic
    console.log('Processing location action', action)
    // This would use the appropriate service methods
  },

  // Process movement-related actions
  async processMovementAction(action: OfflineAction): Promise<void> {
    if (action.type === 'CREATE') {
      const movementData = action.data as unknown as {
        stockItemId: string
        quantity: number
        type: MovementType
      }
      await stockService.recordMovement(movementData)
    }
    // Other movement actions would be implemented similarly
  },

  // Start background sync process
  startBackgroundSync(intervalMs = 60000): () => void {
    this.loadOfflineQueue()

    // Process queue immediately if there are items and we're connected
    if (this.offlineQueue.length > 0 && useConnectionStore.getState().isConnected) {
      this.processQueue()
    }

    // Set interval for regular checks
    const intervalId = setInterval(() => {
      if (this.offlineQueue.length > 0 && useConnectionStore.getState().isConnected) {
        this.processQueue()
      }
    }, intervalMs)

    // Return function to clear interval
    return () => clearInterval(intervalId)
  }
}

export default syncService
