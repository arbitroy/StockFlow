import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '../components/ui/PageHeader'
import { StockMovementReport, MovementType } from '../shared/types'
import { format, subDays } from 'date-fns'
import reportService from '../services/api/reportService'
import notifyService from '../services/notification'

// Movement Type Badge component
const MovementTypeBadge = ({ type }: { type: MovementType }): JSX.Element => {
  const getTypeStyles = (): string => {
    switch (type) {
      case 'IN':
        return 'bg-green-100 text-green-800'
      case 'OUT':
        return 'bg-red-100 text-red-800'
      case 'ADJUST':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeStyles()}`}
    >
      {type}
    </span>
  )
}

const Movements: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [movements, setMovements] = useState<StockMovementReport[]>([])
  const [filteredMovements, setFilteredMovements] = useState<StockMovementReport[]>([])
  const [filter, setFilter] = useState({
    type: 'ALL',
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    searchQuery: ''
  })

  // Load movements
  useEffect(() => {
    loadMovements()
  }, [])

  // Apply filters
  useEffect(() => {
    applyFilters()
  }, [filter, movements])

  const loadMovements = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const startDate = `${filter.startDate}T00:00:00`
      const endDate = `${filter.endDate}T23:59:59`
      const data = await reportService.getMovementReport(startDate, endDate)
      const formattedData = data.map((movement) => ({
        ...movement,
        type: movement.type as MovementType
      }))
      setMovements(formattedData)
    } catch (error) {
      console.error('Failed to load movements:', error)
      notifyService.error('Failed to load stock movements data')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = (): void => {
    let filtered = [...movements]

    // Filter by type
    if (filter.type !== 'ALL') {
      filtered = filtered.filter((movement) => movement.type === filter.type)
    }

    // Filter by search query
    if (filter.searchQuery.trim() !== '') {
      const query = filter.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (movement) =>
          movement.itemName.toLowerCase().includes(query) ||
          movement.sku.toLowerCase().includes(query) ||
          (movement.reference && movement.reference.toLowerCase().includes(query))
      )
    }

    setFilteredMovements(filtered)
  }

  const handleFilterChange = (name: string, value: string): void => {
    setFilter((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRefresh = (): void => {
    loadMovements()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movements"
        subtitle="Track all inbound and outbound inventory movements"
        actions={
          <button onClick={handleRefresh} className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
        }
      />

      {/* Filters */}
      <div className="bg-surface rounded-lg shadow-card p-4 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 flex-wrap">
        <div className="w-full md:w-auto">
          <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Movement Type
          </label>
          <select
            id="typeFilter"
            value={filter.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="form-select"
          >
            <option value="ALL">All Types</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
            <option value="ADJUST">Adjustments</option>
          </select>
        </div>

        <div className="w-full md:w-auto">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={filter.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="form-input"
          />
        </div>

        <div className="w-full md:w-auto">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={filter.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="form-input"
          />
        </div>

        <div className="w-full md:w-auto md:flex-1">
          <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
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
              id="searchQuery"
              placeholder="Search by item name, SKU, or reference"
              value={filter.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="form-input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-surface rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-gray-500">Loading movements data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="mt-4 text-gray-800 font-medium">No movements found</p>
                      <p className="text-gray-500">Try changing your search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(movement.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{movement.itemName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <MovementTypeBadge type={movement.type} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.reference || '-'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with pagination (future enhancement) */}
        {!isLoading && filteredMovements.length > 0 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {filteredMovements.length} movements
            </div>
            {/* Pagination component would go here */}
          </div>
        )}
      </div>
    </div>
  )
}

export default Movements
