import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LocationDTO } from '../../shared/types'

interface LocationInventoryCardProps {
  location: LocationDTO
  inventorySummary?: {
    totalItems: number
    totalQuantity: number
    totalValue: number
    lowStockItems: number
  }
  isLoading?: boolean
}

const LocationInventoryCard: React.FC<LocationInventoryCardProps> = ({
  location,
  inventorySummary = {
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    lowStockItems: 0
  },
  isLoading = false
}) => {
  const navigate = useNavigate()

  // Function to get location type badge
  const getLocationTypeBadge = (): JSX.Element => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-lg shadow-card hover:shadow-card-hover transition-shadow overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-primary-dark">{location.name}</h3>
            <div className="mt-2">{getLocationTypeBadge()}</div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-4 animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-lg font-semibold">{inventorySummary.totalItems}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Quantity</p>
              <p className="text-lg font-semibold">{inventorySummary.totalQuantity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-lg font-semibold">${inventorySummary.totalValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <p className="text-lg font-semibold">{inventorySummary.lowStockItems}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between">
        <button
          className="text-sm text-primary font-medium hover:text-primary-dark flex items-center"
          onClick={() => navigate(`/locations/${location.id}/inventory`)}
        >
          <span>View Inventory</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4 ml-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <span className="text-sm text-gray-500">
          Created: {new Date(location.createdAt!).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  )
}

export default LocationInventoryCard
