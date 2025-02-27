import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LocationDTO } from '../../shared/types'
import locationService from '../../services/api/locationService'
import LocationInventoryCard from './LocationInventoryCard'
import notifyService from '../../services/notification'

// Mock inventory summaries (would be fetched from API in production)
const mockInventorySummaries = {
  '1': {
    totalItems: 2,
    totalQuantity: 105,
    totalValue: 2624.55,
    lowStockItems: 0
  },
  '2': {
    totalItems: 2,
    totalQuantity: 30,
    totalValue: 999.8,
    lowStockItems: 1
  },
  '3': {
    totalItems: 2,
    totalQuantity: 40,
    totalValue: 1524.75,
    lowStockItems: 0
  },
  '4': {
    totalItems: 1,
    totalQuantity: 15,
    totalValue: 749.85,
    lowStockItems: 1
  }
}

const LocationInventoryWidget: React.FC = () => {
  const [locations, setLocations] = useState<LocationDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inventorySummaries, setInventorySummaries] = useState<Record<string, any>>({})

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      setIsLoading(true)
      try {
        // Load locations
        const locationsData = await locationService.getAllLocations()
        setLocations(locationsData)

        // In a real app, we would fetch inventory summaries from the API
        // For now, use mock data
        await new Promise((resolve) => setTimeout(resolve, 500))
        setInventorySummaries(mockInventorySummaries)
      } catch (error) {
        console.error('Failed to load location inventory data:', error)
        notifyService.error('Failed to load location inventory data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // If loading or error, show placeholder
  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-primary-dark">Location Inventory</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // If no locations, show empty state
  if (locations.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-primary-dark">Location Inventory</h2>
          <Link
            to="/locations"
            className="text-primary hover:text-primary-dark text-sm font-medium"
          >
            Add Locations →
          </Link>
        </div>
        <div className="text-center py-8">
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
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="mt-4 text-gray-500">No locations found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-lg shadow-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-primary-dark">Location Inventory</h2>
        <Link to="/locations" className="text-primary hover:text-primary-dark text-sm font-medium">
          View All →
        </Link>
      </div>

      <div className="space-y-4">
        {locations.slice(0, 3).map((location) => (
          <LocationInventoryCard
            key={location.id}
            location={location}
            inventorySummary={inventorySummaries[location.id!]}
            isLoading={!inventorySummaries[location.id!]}
          />
        ))}

        {locations.length > 3 && (
          <div className="text-center mt-4">
            <Link
              to="/locations"
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              View {locations.length - 3} More Locations
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default LocationInventoryWidget
