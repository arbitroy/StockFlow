import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PageHeader } from '../components/ui/PageHeader'
import { StockItemDTO, LocationDTO, TransferRequest } from '../shared/types'
import notifyService from '../services/notification'
import locationService from '../services/api/locationService'
import transferService from '../services/api/transferService'
import TransferDialog from '../components/inventory/TransferDialog'

// Define the type for location inventory items
interface LocationInventoryItem {
  stockItem: StockItemDTO
  quantity: number
  locationId: string
}

const LocationInventory: React.FC = () => {
  const { locationId } = useParams<{ locationId: string }>()
  const navigate = useNavigate()

  const [location, setLocation] = useState<LocationDTO | null>(null)
  const [inventory, setInventory] = useState<LocationInventoryItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<LocationInventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [otherLocations, setOtherLocations] = useState<LocationDTO[]>([])
  const [allStockItems, setAllStockItems] = useState<StockItemDTO[]>([])

  // Load location data and inventory
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      if (!locationId) {
        notifyService.error('Location ID is missing')
        navigate('/locations')
        return
      }

      setIsLoading(true)

      try {
        // Load location details
        const locationData = await locationService.getLocation(locationId)
        setLocation(locationData)

        // Load location inventory
        const inventoryData = await locationService.getLocationInventory(locationId)
        setInventory(inventoryData)
        setFilteredInventory(inventoryData)

        // Load other locations for transfer options
        const allLocations = await locationService.getAllLocations()
        setOtherLocations(allLocations.filter((loc) => loc.id !== locationId))

        // Load all stock items for reference
        const stockItems = await locationService.getAllStockItems()
        setAllStockItems(stockItems)
      } catch (error) {
        console.error('Failed to load location inventory:', error)
        notifyService.error('Failed to load location inventory')
        navigate('/locations')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [locationId, navigate])

  // Filter inventory based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInventory(inventory)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = inventory.filter(
      (item) =>
        item.stockItem.name.toLowerCase().includes(query) ||
        item.stockItem.sku.toLowerCase().includes(query)
    )

    setFilteredInventory(filtered)
  }, [searchQuery, inventory])

  // Handle stock transfer
  const handleTransfer = async (transferData: TransferRequest): Promise<void> => {
    try {
      await transferService.transferStock(transferData)

      // Refresh inventory after transfer
      const updatedInventory = await locationService.getLocationInventory(locationId!)
      setInventory(updatedInventory)

      notifyService.success('Stock transfer completed successfully')
    } catch (error) {
      console.error('Failed to transfer stock:', error)
      notifyService.error('Failed to complete stock transfer')
      throw error
    }
  }

  // Handle transfer from this location button click
  const handleTransferFromHere = (): void => {
    setTransferDialogOpen(true)
  }

  // Get location type badge style
  const getLocationTypeBadge = (): JSX.Element | null => {
    if (!location) return null

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          location.type === 'WAREHOUSE'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-green-100 text-green-800'
        }`}
      >
        {location.type}
      </span>
    )
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="flex flex-col items-center">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">Loading location inventory...</p>
        </div>
      </div>
    )
  }

  // Render if location not found
  if (!location) {
    return (
      <div className="text-center py-12">
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
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Location not found</h3>
        <button onClick={() => navigate('/locations')} className="mt-4 btn btn-primary">
          Back to Locations
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Inventory at ${location.name}`}
        subtitle={`Manage stock items at this ${location.type.toLowerCase()}`}
        actions={
          <div className="flex space-x-2">
            <button
              className="btn btn-primary"
              onClick={handleTransferFromHere}
              disabled={inventory.length === 0}
            >
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

            <button className="btn btn-outline" onClick={() => navigate('/locations')}>
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
                  d="M11 17l-5-5m0 0l5-5m-5 5h12"
                />
              </svg>
              <span>Back to Locations</span>
            </button>
          </div>
        }
      />

      {/* Location Info Card */}
      <div className="bg-surface rounded-lg shadow-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-primary-dark">{location.name}</h2>
              <div className="ml-3">{getLocationTypeBadge()}</div>
            </div>
            <p className="mt-1 text-gray-500">Location ID: {locationId}</p>
          </div>

          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-medium text-gray-500">Total Items: </span>
              <span className="font-semibold text-gray-900">{inventory.length}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-500">Total Quantity: </span>
              <span className="font-semibold text-gray-900">
                {inventory.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-surface rounded-lg shadow-card p-4">
        <div className="relative">
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
            placeholder="Search inventory by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-10 w-full md:w-1/2"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-surface rounded-lg shadow-card overflow-hidden">
        {filteredInventory.length === 0 ? (
          <div className="text-center py-12">
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No inventory found</h3>
            <p className="mt-1 text-gray-500">
              {searchQuery
                ? 'No items match your search criteria.'
                : `This ${location.type.toLowerCase()} has no stock items.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item, index) => (
                  <motion.tr
                    key={`${item.stockItem.id}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.stockItem.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.stockItem.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.quantity > 10
                            ? 'bg-green-100 text-green-800'
                            : item.quantity > 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.quantity > 10
                          ? 'In Stock'
                          : item.quantity > 0
                            ? 'Low Stock'
                            : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(item.stockItem.price * item.quantity).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setTransferDialogOpen(true)
                          }}
                          className="text-primary hover:text-primary-dark"
                          title="Transfer"
                          disabled={item.quantity <= 0}
                        >
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
                        </button>
                      </div>
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
        stockItems={inventory
          .filter((item) => item.quantity > 0)
          .map((item) => ({ ...item.stockItem, quantity: item.quantity }))}
        locations={otherLocations}
        isLoading={isLoading}
        preselectedSourceId={locationId}
      />
    </div>
  )
}

export default LocationInventory
