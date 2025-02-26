import { useState, useEffect } from 'react'
import { motion, Variants } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { SaleDTO, SaleStatus, StockItemDTO } from '../shared/types'
import notifyService from '../services/notification'
import stockService from '../services/api/stockService'

// Sale detail modal
interface SaleDetailModalProps {
  isOpen: boolean
  onClose: () => void
  sale: SaleDTO | null
}

const SaleDetailModal = ({ isOpen, onClose, sale }: SaleDetailModalProps): JSX.Element | null => {
  if (!isOpen || !sale) return null

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
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
                <button
                  onClick={() => {
                    notifyService.success('Sale completed successfully')
                    onClose()
                    // In a real app, this would update the sale status
                  }}
                  className="btn btn-primary"
                >
                  Complete Sale
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Mock sales data
const mockSales: SaleDTO[] = [
  {
    id: '1',
    customerName: 'John Smith',
    customerPhone: '555-123-4567',
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
    status: 'CANCELLED',
    createdAt: '2025-02-19T16:05:11Z'
  }
]

// Main Sales component
const Sales: React.FC = () => {
  useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [sales, setSales] = useState<SaleDTO[]>([])
  const [filteredSales, setFilteredSales] = useState<SaleDTO[]>([])
  const [newSaleDialogOpen, setNewSaleDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<SaleDTO | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Open new sale dialog if action=new in URL
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'new') {
      setNewSaleDialogOpen(true)
    }
  }, [searchParams])

  // Load sales data
  useEffect(() => {
    const loadSales = async (): Promise<void> => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800))
        setSales(mockSales)
      } catch (error) {
        console.error('Failed to load sales:', error)
        notifyService.error('Failed to load sales data')
      } finally {
        setIsLoading(false)
      }
    }

    loadSales()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...sales]

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((sale) => sale.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (sale) =>
          (sale.customerName && sale.customerName.toLowerCase().includes(query)) ||
          (sale.customerPhone && sale.customerPhone.toLowerCase().includes(query)) ||
          (sale.reference && sale.reference.toLowerCase().includes(query))
      )
    }

    setFilteredSales(filtered)
  }, [sales, statusFilter, searchQuery])

  const handleCreateSale = async (saleData: {
    customerName?: string
    customerPhone?: string
    items: { stockItemId: string; quantity: number; price: number }[]
  }): Promise<void> => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate a new sale with mock data
      const newSale: SaleDTO = {
        id: Date.now().toString(),
        customerName: saleData.customerName,
        customerPhone: saleData.customerPhone,
        items: saleData.items.map(
          (item: { stockItemId: string; quantity: number; price: number }, index: number) => ({
            id: `${Date.now()}-${index}`,
            stockItemId: item.stockItemId,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
          })
        ),
        total: saleData.items.reduce(
          (sum: number, item: { price: number; quantity: number }) =>
            sum + item.price * item.quantity,
          0
        ),
        reference: `SALE-${Math.floor(10000 + Math.random() * 90000)}`,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }

      setSales([newSale, ...sales])
      notifyService.success('Sale created successfully')
      setNewSaleDialogOpen(false)
    } catch (error) {
      console.error('Failed to create sale:', error)
      notifyService.error('Failed to create sale')
    }
  }

  const handleViewSale = (sale: SaleDTO): void => {
    setSelectedSale(sale)
    setDetailModalOpen(true)
  }

  const handleStatusChange = async (saleId: string, newStatus: SaleStatus): Promise<void> => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 600))

      // Update sale status
      setSales((prev) =>
        prev.map((sale) => (sale.id === saleId ? { ...sale, status: newStatus } : sale))
      )

      notifyService.success(`Sale ${newStatus.toLowerCase()} successfully`)
    } catch (error) {
      console.error(`Failed to update sale status to ${newStatus}:`, error)
      notifyService.error('Failed to update sale status')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        subtitle="Manage and track all sales transactions"
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
            placeholder="Search by customer name, phone or reference..."
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
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-surface rounded-lg shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center">
              <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Loading sales data...</p>
            </div>
          </div>
        ) : filteredSales.length === 0 ? (
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No sales found</h3>
            <p className="mt-1 text-gray-500">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try changing your search criteria'
                : 'Get started by creating your first sale'}
            </p>
            {!searchQuery && statusFilter === 'ALL' && (
              <button onClick={() => setNewSaleDialogOpen(true)} className="mt-4 btn btn-primary">
                New Sale
              </button>
            )}
          </div>
        ) : (
          <>
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
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-primary">{sale.reference}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sale.createdAt!).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sale.customerName || 'Walk-in Customer'}
                        </div>
                        {sale.customerPhone && (
                          <div className="text-sm text-gray-500">{sale.customerPhone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${sale.total!.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={sale.status!} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewSale(sale)}
                            className="text-primary hover:text-primary-dark"
                            title="View Details"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>

                          {sale.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(sale.id!, 'COMPLETED')}
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

                              <button
                                onClick={() => handleStatusChange(sale.id!, 'CANCELLED')}
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
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {filteredSales.length} of {sales.length} sales
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Sale Dialog */}
      <NewSaleDialog
        isOpen={newSaleDialogOpen}
        onClose={() => setNewSaleDialogOpen(false)}
        onSave={handleCreateSale}
      />

      {/* Sale Detail Modal */}
      <SaleDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        sale={selectedSale}
      />
    </div>
  )
}

export default Sales

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

// New Sale Dialog
interface NewSaleDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (sale: {
    customerName?: string
    customerPhone?: string
    items: { stockItemId: string; quantity: number; price: number }[]
  }) => Promise<void>
}

const NewSaleDialog = ({ isOpen, onClose, onSave }: NewSaleDialogProps): JSX.Element | null => {
  const [sale, setSale] = useState({
    customerName: '',
    customerPhone: '',
    items: [{ stockItemId: '', quantity: 1, name: '', price: 0, maxQuantity: 0 }]
  })
  const [availableItems, setAvailableItems] = useState<StockItemDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Load available stock items
    const loadStockItems = async (): Promise<void> => {
      try {
        const items = await stockService.getAllStockItems()
        // Filter out out-of-stock items
        const inStockItems = items.filter((item) => item.quantity > 0)
        setAvailableItems(inStockItems)
      } catch (error) {
        console.error('Failed to load stock items:', error)
        notifyService.error('Failed to load available products')
      }
    }

    if (isOpen) {
      loadStockItems()
    }
  }, [isOpen])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSale({
        customerName: '',
        customerPhone: '',
        items: [{ stockItemId: '', quantity: 1, name: '', price: 0, maxQuantity: 0 }]
      })
      setErrors({})
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setSale((prev) => ({
      ...prev,
      [name]: value
    }))

    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleItemChange = (index: number, field: string, value: string | number): void => {
    const newItems = [...sale.items]

    if (field === 'stockItemId') {
      const selectedItem = availableItems.find((item) => item.id === value)
      if (selectedItem) {
        newItems[index] = {
          ...newItems[index],
          stockItemId: value as string,
          name: selectedItem.name,
          price: selectedItem.price,
          maxQuantity: selectedItem.quantity
        }
      }
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: field === 'quantity' ? parseInt(value as string) || 1 : value
      }
    }

    setSale((prev) => ({
      ...prev,
      items: newItems
    }))

    // Clear error
    if (errors[`items[${index}].${field}`]) {
      setErrors((prev) => ({
        ...prev,
        [`items[${index}].${field}`]: ''
      }))
    }
  }

  const addItem = (): void => {
    setSale((prev) => ({
      ...prev,
      items: [...prev.items, { stockItemId: '', quantity: 1, name: '', price: 0, maxQuantity: 0 }]
    }))
  }

  const removeItem = (index: number): void => {
    if (sale.items.length > 1) {
      const newItems = [...sale.items]
      newItems.splice(index, 1)

      setSale((prev) => ({
        ...prev,
        items: newItems
      }))
    } else {
      notifyService.info('Sale must have at least one item')
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate items
    sale.items.forEach((item, index) => {
      if (!item.stockItemId) {
        newErrors[`items[${index}].stockItemId`] = 'Please select a product'
      }

      if (!item.quantity || item.quantity < 1) {
        newErrors[`items[${index}].quantity`] = 'Quantity must be at least 1'
      }

      const stockItem = availableItems.find((i) => i.id === item.stockItemId)
      if (stockItem && item.quantity > stockItem.quantity) {
        newErrors[`items[${index}].quantity`] = `Only ${stockItem.quantity} available`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      // Format sale data for API
      const saleData = {
        customerName: sale.customerName.trim() || undefined,
        customerPhone: sale.customerPhone.trim() || undefined,
        items: sale.items.map((item) => ({
          stockItemId: item.stockItemId,
          quantity: item.quantity,
          price: item.price
        }))
      }

      await onSave(saleData)
      onClose()
      notifyService.success('Sale created successfully')
    } catch (error) {
      console.error('Failed to create sale:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotal = (): number => {
    return sale.items.reduce((sum, item) => {
      return sum + item.price * item.quantity
    }, 0)
  }

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayVariants}
        onClick={onClose}
      />

      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={dialogVariants}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-primary-dark">New Sale</h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerName" className="form-label">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={sale.customerName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label htmlFor="customerPhone" className="form-label">
                    Customer Phone (Optional)
                  </label>
                  <input
                    type="text"
                    id="customerPhone"
                    name="customerPhone"
                    value={sale.customerPhone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter customer phone"
                  />
                </div>
              </div>

              {/* Sale Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">Sale Items</h4>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-primary hover:text-primary-dark text-sm font-medium"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {sale.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between">
                        <h5 className="font-medium text-sm text-gray-700">Item #{index + 1}</h5>
                        {sale.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
                        <div className="md:col-span-6">
                          <label
                            htmlFor={`item-${index}-product`}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Product
                          </label>
                          <select
                            id={`item-${index}-product`}
                            value={item.stockItemId}
                            onChange={(e) => handleItemChange(index, 'stockItemId', e.target.value)}
                            className={`form-select ${
                              errors[`items[${index}].stockItemId`] ? 'border-red-300' : ''
                            }`}
                          >
                            <option value="">Select a product</option>
                            {availableItems.map((stockItem) => (
                              <option key={stockItem.id} value={stockItem.id}>
                                {stockItem.name} (${stockItem.price.toFixed(2)} -{' '}
                                {stockItem.quantity} available)
                              </option>
                            ))}
                          </select>
                          {errors[`items[${index}].stockItemId`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[`items[${index}].stockItemId`]}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label
                            htmlFor={`item-${index}-quantity`}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Qty
                          </label>
                          <input
                            type="number"
                            id={`item-${index}-quantity`}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            min="1"
                            max={item.maxQuantity}
                            className={`form-input ${
                              errors[`items[${index}].quantity`] ? 'border-red-300' : ''
                            }`}
                          />
                          {errors[`items[${index}].quantity`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[`items[${index}].quantity`]}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price
                          </label>
                          <div className="form-input bg-gray-100 cursor-not-allowed">
                            ${item.price.toFixed(2)}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total
                          </label>
                          <div className="form-input bg-gray-100 cursor-not-allowed font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sale Summary */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-4">Sale Summary</h4>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-semibold text-primary-dark">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="btn btn-primary">
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
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
