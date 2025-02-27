import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '../components/ui/PageHeader'
import { StockItemDTO, TransferRequest } from '../shared/types'
import stockService from '../services/api/stockService'
import transferService from '../services/api/transferService'
import notifyService from '../services/notification'
import TransferDialog from '../components/inventory/TransferDialog'

// Mock transfer history data - would be fetched from API in production
const mockTransferHistory = [
  {
    id: '1',
    date: '2025-02-20T14:30:00Z',
    stockItem: 'Wireless Mouse',
    sourceLocation: 'Main Warehouse',
    targetLocation: 'Downtown Store',
    quantity: 10,
    reference: 'TRANSFER-12345',
    status: 'COMPLETED'
  },
  {
    id: '2',
    date: '2025-02-18T10:15:00Z',
    stockItem: 'USB-C Cable',
    sourceLocation: 'East Distribution Center',
    targetLocation: 'North Retail',
    quantity: 25,
    reference: 'TRANSFER-23456',
    status: 'COMPLETED'
  }
]

const Transfers: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [stockItems, setStockItems] = useState<StockItemDTO[]>([])
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  interface TransferHistoryItem {
    id: string
    date: string
    stockItem: string
    sourceLocation: string
    targetLocation: string
    quantity: number
    reference: string
    status: string
  }

  const [transferHistory, setTransferHistory] = useState<TransferHistoryItem[]>([])
  interface Location {
    id: string
    name: string
    type: 'WAREHOUSE' | 'STORE'
  }

  const [locations, setLocations] = useState<Location[]>([
    // Mock locations for now - would be fetched from API
    { id: '1', name: 'Main Warehouse', type: 'WAREHOUSE' },
    { id: '2', name: 'Downtown Store', type: 'STORE' },
    { id: '3', name: 'East Distribution Center', type: 'WAREHOUSE' },
    { id: '4', name: 'North Retail', type: 'STORE' }
  ])

  // Load data
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      setIsLoading(true)
      try {
        // Load stock items
        const items = await stockService.getAllStockItems()
        setStockItems(items)

        // In a real app, we would fetch transfer history from an API
        // For now, use mock data
        await new Promise((resolve) => setTimeout(resolve, 800))
        setTransferHistory(mockTransferHistory)
      } catch (error) {
        console.error('Failed to load data:', error)
        notifyService.error('Failed to load transfer data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle stock transfer
  const handleTransfer = async (transferData: TransferRequest): Promise<void> => {
    try {
      await transferService.transferStock(transferData)

      // In a real app, we would refresh the transfer history and stock items
      // For now, add a mock entry to the history
      const newTransfer = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        stockItem:
          stockItems.find((item) => item.id === transferData.stockItemId)?.name || 'Unknown Item',
        sourceLocation:
          locations.find((loc) => loc.id === transferData.sourceLocationId)?.name ||
          'Unknown Source',
        targetLocation:
          locations.find((loc) => loc.id === transferData.targetLocationId)?.name ||
          'Unknown Target',
        quantity: transferData.quantity,
        reference: transferData.reference || `TRANSFER-${Date.now()}`,
        status: 'COMPLETED'
      }

      setTransferHistory([newTransfer, ...transferHistory])

      // Refresh stock items
      const updatedItems = await stockService.getAllStockItems()
      setStockItems(updatedItems)

      notifyService.success('Stock transfer completed successfully')
    } catch (error) {
      console.error('Failed to transfer stock:', error)
      notifyService.error('Failed to complete stock transfer')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Transfers"
        subtitle="Transfer inventory between warehouses and stores"
        actions={
          <button className="btn btn-primary" onClick={() => setTransferDialogOpen(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            <span>New Transfer</span>
          </button>
        }
      />

      {/* Transfer History */}
      <div className="bg-surface rounded-lg shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-primary-dark">Transfer History</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center">
              <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Loading transfer history...</p>
            </div>
          </div>
        ) : transferHistory.length === 0 ? (
          <div className="text-center py-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-12 mx-auto text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No transfers found</h3>
            <p className="mt-1 text-gray-500">Get started by creating your first stock transfer.</p>
            <button className="mt-4 btn btn-primary" onClick={() => setTransferDialogOpen(true)}>
              New Transfer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transferHistory.map((transfer, index) => (
                  <motion.tr
                    key={transfer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transfer.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-primary">{transfer.reference}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transfer.stockItem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transfer.sourceLocation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transfer.targetLocation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transfer.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {transfer.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfer Dialog */}
      <TransferDialog
        isOpen={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        onConfirm={handleTransfer}
        stockItems={stockItems.filter((item) => item.quantity > 0)}
        locations={locations}
        isLoading={isLoading}
      />
    </div>
  )
}

export default Transfers
