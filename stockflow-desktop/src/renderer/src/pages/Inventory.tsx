import { useState, useEffect } from 'react'
import { StockItemDTO, TransferRequest } from '../shared/types'
import stockService from '../services/api/stockService'
import transferService from '../services/api/transferService'
import notifyService from '../services/notification'
import { PageHeader } from '../components/ui/PageHeader'
import StockItemDialog from '../components/inventory/StockItemDialog'
import { StockItemsTable } from '../components/inventory/StockItemsTable'
import TransferDialog from '../components/inventory/TransferDialog'

const Inventory = (): JSX.Element => {
  const [stockItems, setStockItems] = useState<StockItemDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItemDTO | undefined>(undefined)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  interface Location {
    id: string
    name: string
    type: 'WAREHOUSE' | 'STORE'
  }

  const [locations] = useState<Location[]>([
    // Mock locations for now - would be fetched from API
    { id: '1', name: 'Main Warehouse', type: 'WAREHOUSE' },
    { id: '2', name: 'Downtown Store', type: 'STORE' },
    { id: '3', name: 'East Distribution Center', type: 'WAREHOUSE' },
    { id: '4', name: 'North Retail', type: 'STORE' }
  ])

  // Load stock items
  useEffect(() => {
    const loadStockItems = async (): Promise<void> => {
      try {
        setIsLoading(true)
        setIsError(false)
        const data = await stockService.getAllStockItems()
        setStockItems(data)
      } catch (error) {
        console.error('Failed to load stock items:', error)
        setIsError(true)
        notifyService.error('Failed to load inventory data')
      } finally {
        setIsLoading(false)
      }
    }

    loadStockItems()
  }, [])

  // Filter items based on search query and status
  const filteredItems = stockItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Handle creating or updating a stock item
  const handleSaveStockItem = async (item: StockItemDTO): Promise<boolean> => {
    try {
      setIsLoading(true)

      if (item.id) {
        // Update existing item
        const updatedItem = await stockService.updateStockItem(item.id, item)
        setStockItems((prevItems) =>
          prevItems.map((prevItem) => (prevItem.id === updatedItem.id ? updatedItem : prevItem))
        )
        notifyService.success(`Stock item "${item.name}" updated successfully`)
      } else {
        // Create new item
        const newItem = await stockService.createStockItem(item)
        setStockItems((prevItems) => [newItem, ...prevItems])
        notifyService.success(`Stock item "${item.name}" created successfully`)
      }

      setDialogOpen(false)
      return true
    } catch (error) {
      console.error('Failed to save stock item:', error)
      notifyService.error(`Failed to ${item.id ? 'update' : 'create'} stock item`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Handle deleting a stock item
  const handleDeleteItem = async (id: string): Promise<void> => {
    try {
      await stockService.deleteStockItem(id)
      setStockItems((prevItems) => prevItems.filter((item) => item.id !== id))
      notifyService.success('Stock item deleted successfully')
    } catch (error) {
      console.error('Failed to delete stock item:', error)
      notifyService.error('Failed to delete stock item')
    }
  }

  // Handle stock movement
  const handleStockMovement = async (
    item: StockItemDTO,
    type: 'IN' | 'OUT',
    quantity: number
  ): Promise<void> => {
    try {
      await stockService.recordMovement({
        stockItemId: item.id!,
        quantity,
        type,
        reference: `${type}-MANUAL-${new Date().getTime()}`,
        notes: `Manual ${type} movement`
      })

      // Refresh stock items
      const updatedItems = await stockService.getAllStockItems()
      setStockItems(updatedItems)

      notifyService.success(`Successfully recorded ${type} movement for ${item.name}`)
    } catch (error) {
      console.error(`Failed to record ${type} movement:`, error)
      notifyService.error(`Failed to record ${type} movement`)
    }
  }

  // Handle refresh
  const handleRefresh = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const data = await stockService.getAllStockItems()
      setStockItems(data)
      notifyService.success('Inventory refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh inventory:', error)
      notifyService.error('Failed to refresh inventory data')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle stock transfer
  const handleTransfer = async (transferData: TransferRequest): Promise<void> => {
    try {
      // Show loading notification
      const notification = notifyService.loading('Processing stock transfer...')

      await transferService.transferStock(transferData)

      // Success message is shown in the transferService
      notification.dismiss()

      // Refresh stock items after successful transfer
      await handleRefresh()
    } catch (error) {
      console.error('Failed to transfer stock:', error)
      // Error is shown in the transferService, no need to show it again
    }
  } 

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        subtitle="Manage your stock items, track movements, and monitor inventory levels"
        actions={
          <div className="flex space-x-2">
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingItem(undefined)
                setDialogOpen(true)
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Add Item</span>
            </button>

            <button className="btn btn-secondary" onClick={() => setTransferDialogOpen(true)}>
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
              <span>Transfer Stock</span>
            </button>

            <button className="btn btn-outline" onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="size-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* Search and Filters */}
      <div className="bg-surface rounded-lg shadow-card p-4 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="w-full md:w-1/3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-10"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_STOCK">Out of Stock</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-surface rounded-lg shadow-card overflow-hidden">
        <StockItemsTable
          items={filteredItems}
          isLoading={isLoading}
          isError={isError}
          onEdit={(item) => {
            setEditingItem(item)
            setDialogOpen(true)
          }}
          onDelete={handleDeleteItem}
          onStockMovement={handleStockMovement}
        />
      </div>

      {/* Stock Item Dialog */}
      <StockItemDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveStockItem}
        initialData={editingItem}
        title={editingItem ? 'Edit Stock Item' : 'Add New Stock Item'}
      />

      {/* Transfer Stock Dialog */}
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

export default Inventory
