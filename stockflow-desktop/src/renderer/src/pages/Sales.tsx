import { useState, useEffect } from 'react'
import { motion, Variants } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { SaleDTO, SaleStatus, LocationDTO } from '../shared/types'
import locationService from '../services/api/locationService'
import notifyService from '../services/notification'
import NewSaleDialog from '../components/sales/NewSaleDialog'

// Status Badge component
const StatusBadge = ({ status }: { status: SaleStatus }): JSX.Element => {
  const getStatusStyles = (): string => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles()}`}
    >
      {status}
    </span>
  )
}

// Sale detail modal
interface SaleDetailModalProps {
  isOpen: boolean
  onClose: () => void
  sale: SaleDTO | null
  onUpdateStatus?: (saleId: string, status: SaleStatus) => Promise<void>
}

const SaleDetailModal = ({
  isOpen,
  onClose,
  sale,
  onUpdateStatus
}: SaleDetailModalProps): JSX.Element | null => {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen || !sale) return null

  const handleUpdateStatus = async (status: SaleStatus): Promise<void> => {
    if (!sale.id || !onUpdateStatus) return

    setIsLoading(true)
    try {
      await onUpdateStatus(sale.id, status)
      notifyService.success(
        `Sale ${status === 'COMPLETED' ? 'completed' : 'cancelled'} successfully`
      )
      onClose()
    } catch (error) {
      console.error('Failed to update sale status:', error)
      notifyService.error(`Failed to update sale status`)
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants
  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
  }

  return (
    <div className="fixed inset-0 z-[50] overflow-y-auto">
      <motion.div
        className="fixed inset-0 bg-[rgba(0,0,0,0.5)]transition-opacity"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayVariants}
        onClick={onClose}
      />

      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-primary-dark">Sale Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Reference</h4>
                <p className="font-medium">{sale.reference}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Date</h4>
                <p>{new Date(sale.createdAt!).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                <p>{sale.customerName || 'Walk-in Customer'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                <p>{sale.customerPhone || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <StatusBadge status={sale.status!} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total</h4>
                <p className="text-lg font-semibold text-primary-dark">${sale.total!.toFixed(2)}</p>
              </div>
              {/* Location information */}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p>{sale.locationName || 'Unknown Location'}</p>
              </div>
            </div>

            <h4 className="font-medium text-gray-900 mb-3">Items</h4>
            <div className="bg-gray-50 rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sale.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {/* In a real app we would fetch and display the item name */}
                        {item.id ? `Item #${item.id.slice(0, 5)}` : `Product ${index + 1}`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                        ${item.price?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        ${item.total?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right"
                    >
                      Total
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary-dark text-right">
                      ${sale.total!.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <button onClick={onClose} className="btn btn-outline">
              Close
            </button>

            <div className="space-x-2">
              <button
                onClick={() => {
                  notifyService.info('Printing receipt...')
                  // In a real app, this would trigger receipt printing
                }}
                className="btn btn-outline"
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
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span>Print</span>
              </button>

              {sale.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus('CANCELLED')}
                    disabled={isLoading}
                    className="btn btn-outline text-red-600 hover:bg-red-50"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span>Cancel Sale</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? (
                      <>
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>Complete Sale</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

const Sales: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  useNavigate()

  const [locations, setLocations] = useState<LocationDTO[]>([])
  const [sales, setSales] = useState<SaleDTO[]>([])
  const [filteredSales, setFilteredSales] = useState<SaleDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [newSaleDialogOpen, setNewSaleDialogOpen] = useState<boolean>(false)
  const [selectedSale, setSelectedSale] = useState<SaleDTO | null>(null)
  const [saleDetailOpen, setSaleDetailOpen] = useState<boolean>(false)

  // Check URL params for actions
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'new') {
      setNewSaleDialogOpen(true)
      searchParams.delete('action')
      setSearchParams(searchParams)
    }
  }, [searchParams, setSearchParams])

  // Load sales data
  useEffect(() => {
    const loadSales = async (): Promise<void> => {
      setIsLoading(true)
      try {
        // In a real app, we would load from API
        // For now, use mock data
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Mock data that would come from API
        const mockSales: SaleDTO[] = [
          {
            id: '1',
            customerName: 'John Smith',
            customerPhone: '555-123-4567',
            locationId: '1', // Main Warehouse
            locationName: 'Main Warehouse',
            items: [
              {
                id: '1-1',
                stockItemId: '1',
                quantity: 2,
                price: 24.99,
                total: 49.98
              }
            ],
            total: 49.98,
            reference: 'SALE-12345',
            status: 'COMPLETED',
            createdAt: '2025-02-20T14:22:35Z'
          },
          {
            id: '2',
            customerName: 'Jane Doe',
            customerPhone: '555-987-6543',
            locationId: '2', // Downtown Store
            locationName: 'Downtown Store',
            items: [
              {
                id: '2-1',
                stockItemId: '2',
                quantity: 1,
                price: 12.99,
                total: 12.99
              },
              {
                id: '2-2',
                stockItemId: '3',
                quantity: 1,
                price: 49.99,
                total: 49.99
              }
            ],
            total: 62.98,
            reference: 'SALE-23456',
            status: 'PENDING',
            createdAt: '2025-02-22T09:15:42Z'
          },
          {
            id: '3',
            customerName: 'Bob Johnson',
            customerPhone: '555-456-7890',
            locationId: '4', // North Retail
            locationName: 'North Retail',
            items: [
              {
                id: '3-1',
                stockItemId: '4',
                quantity: 1,
                price: 79.99,
                total: 79.99
              }
            ],
            total: 79.99,
            reference: 'SALE-34567',
            status: 'COMPLETED',
            createdAt: '2025-02-23T16:30:12Z'
          },
          {
            id: '4',
            customerName: 'Sarah Williams',
            customerPhone: '555-789-0123',
            locationId: '2', // Downtown Store
            locationName: 'Downtown Store',
            items: [
              {
                id: '4-1',
                stockItemId: '1',
                quantity: 1,
                price: 24.99,
                total: 24.99
              },
              {
                id: '4-2',
                stockItemId: '3',
                quantity: 2,
                price: 49.99,
                total: 99.98
              }
            ],
            total: 124.97,
            reference: 'SALE-45678',
            status: 'CANCELLED',
            createdAt: '2025-02-24T10:45:23Z'
          }
        ]

        setSales(mockSales)
        setFilteredSales(mockSales)

        // Load locations
        const locationsData = await locationService.getAllLocations()
        setLocations(locationsData)
      } catch (error) {
        console.error('Failed to load sales data:', error)
        notifyService.error('Failed to load sales data')
      } finally {
        setIsLoading(false)
      }
    }

    loadSales()
  }, [])

  // Apply filters when any filter changes
  useEffect(() => {
    if (sales.length === 0) return

    let filtered = [...sales]

    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter((sale) => sale.locationId === selectedLocation)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((sale) => sale.status === statusFilter)
    }

    // Filter by search query (reference or customer name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (sale) =>
          (sale.reference && sale.reference.toLowerCase().includes(query)) ||
          (sale.customerName && sale.customerName.toLowerCase().includes(query)) ||
          (sale.customerPhone && sale.customerPhone.includes(query))
      )
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate)
      filtered = filtered.filter((sale) => new Date(sale.createdAt!) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // Set to end of day
      filtered = filtered.filter((sale) => new Date(sale.createdAt!) <= end)
    }

    setFilteredSales(filtered)
  }, [sales, selectedLocation, statusFilter, searchQuery, startDate, endDate])

  // Handle creating a new sale
  const handleCreateSale = async (saleData: {
    customerName?: string
    customerPhone?: string
    locationId: string
    items: { stockItemId: string; quantity: number; price: number }[]
  }): Promise<void> => {
    try {
      // In a real app, we'd call the API
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Find location name for the selected locationId
      const location = locations.find((loc) => loc.id === saleData.locationId)

      // Create a new sale object
      const newSale: SaleDTO = {
        id: crypto.randomUUID(),
        customerName: saleData.customerName,
        customerPhone: saleData.customerPhone,
        locationId: saleData.locationId,
        locationName: location?.name || 'Unknown Location',
        items: saleData.items.map((item) => ({
          id: crypto.randomUUID(),
          stockItemId: item.stockItemId,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        total: saleData.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        reference: `SALE-${Date.now().toString().slice(-5)}`,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }

      // Add the new sale to our state
      setSales((prevSales) => [newSale, ...prevSales])

      // Close the dialog
      setNewSaleDialogOpen(false)

      // Show success message
      notifyService.success('Sale created successfully')

      // Open sale details
      setSelectedSale(newSale)
      setSaleDetailOpen(true)
    } catch (error) {
      console.error('Failed to create sale:', error)
      notifyService.error('Failed to create sale')
    }
  }

  // Handle updating a sale status
  const handleUpdateSaleStatus = async (saleId: string, status: SaleStatus): Promise<void> => {
    try {
      // In a real app, we'd call the API
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Update the sale in our state
      setSales((prevSales) =>
        prevSales.map((sale) =>
          sale.id === saleId ? { ...sale, status, updatedAt: new Date().toISOString() } : sale
        )
      )

      // Close the details modal
      setSaleDetailOpen(false)
    } catch (error) {
      console.error('Failed to update sale status:', error)
      notifyService.error('Failed to update sale status')
      throw error
    }
  }

  // Clear all filters
  const handleClearFilters = (): void => {
    setSelectedLocation('')
    setSearchQuery('')
    setStatusFilter('all')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        subtitle="Manage and track sales transactions"
        actions={
          <button onClick={() => setNewSaleDialogOpen(true)} className="btn btn-primary">
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
            <span>New Sale</span>
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-surface rounded-lg shadow-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="form-label">
              Search
            </label>
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
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference or customer..."
                className="form-input pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="form-label">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="location" className="form-label">
              Location
            </label>
            <select
              id="location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="form-select"
            >
              <option value="">All Locations</option>
              <optgroup label="Stores">
                {locations
                  .filter((loc) => loc.type === 'STORE')
                  .map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Warehouses">
                {locations
                  .filter((loc) => loc.type === 'WAREHOUSE')
                  .map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          <div>
            <div className="flex space-x-2">
              <div className="flex-1">
                <label htmlFor="startDate" className="form-label">
                  From
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="endDate" className="form-label">
                  To
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                  min={startDate}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={handleClearFilters} className="btn btn-outline text-sm">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-surface rounded-lg shadow-card overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex justify-center">
            <div className="flex flex-col items-center">
              <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Loading sales data...</p>
            </div>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="py-16 text-center">
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No sales found</h3>
            <p className="mt-1 text-gray-500">
              {Object.values({
                selectedLocation,
                statusFilter,
                searchQuery,
                startDate,
                endDate
              }).some((v) => v)
                ? 'Try adjusting your filters'
                : 'Start by creating your first sale'}
            </p>
            {!Object.values({
              selectedLocation,
              statusFilter,
              searchQuery,
              startDate,
              endDate
            }).some((v) => v) && (
              <button onClick={() => setNewSaleDialogOpen(true)} className="mt-4 btn btn-primary">
                New Sale
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <motion.tr
                    key={sale.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedSale(sale)
                      setSaleDetailOpen(true)
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-primary">{sale.reference}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sale.createdAt!).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {sale.customerName || 'Walk-in Customer'}
                      </div>
                      {sale.customerPhone && (
                        <div className="text-sm text-gray-500">{sale.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.locationName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={sale.status!} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${sale.total!.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation() // Prevent row click
                            notifyService.info('Printing receipt...')
                            // In a real app, this would trigger receipt printing
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="Print Receipt"
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
                              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                            />
                          </svg>
                        </button>
                        {sale.status === 'PENDING' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation() // Prevent row click
                                // Show a confirmation dialog before cancelling
                                if (window.confirm('Are you sure you want to cancel this sale?')) {
                                  handleUpdateSaleStatus(sale.id!, 'CANCELLED')
                                    .then(() => {
                                      notifyService.success('Sale cancelled successfully')
                                    })
                                    .catch((error) => {
                                      console.error('Error cancelling sale:', error)
                                    })
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel Sale"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation() // Prevent row click
                                handleUpdateSaleStatus(sale.id!, 'COMPLETED')
                                  .then(() => {
                                    notifyService.success('Sale completed successfully')
                                  })
                                  .catch((error) => {
                                    console.error('Error completing sale:', error)
                                  })
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Complete Sale"
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination - For future implementation */}
      {!isLoading && filteredSales.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">Showing {filteredSales.length} sales</div>
          {/* Pagination component would go here */}
        </div>
      )}

      {/* New Sale Dialog */}
      <NewSaleDialog
        isOpen={newSaleDialogOpen}
        onClose={() => setNewSaleDialogOpen(false)}
        onSave={handleCreateSale}
      />

      {/* Sale Detail Modal */}
      <SaleDetailModal
        isOpen={saleDetailOpen}
        onClose={() => setSaleDetailOpen(false)}
        sale={selectedSale}
        onUpdateStatus={handleUpdateSaleStatus}
      />
    </div>
  )
}

export default Sales
