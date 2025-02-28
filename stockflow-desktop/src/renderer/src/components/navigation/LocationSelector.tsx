import { useState, useEffect } from 'react'
import { LocationDTO } from '../../shared/types'
import locationService from '../../services/api/locationService'
import notifyService from '../../services/notification'

interface LocationSelectorProps {
  value: string
  onChange: (locationId: string) => void
  disabled?: boolean
  required?: boolean
  error?: string
  label?: string
  placeholder?: string
  className?: string
  onLocationLoad?: (location: LocationDTO | null) => void
  filterType?: 'STORE' | 'WAREHOUSE' | null // Optional filter by location type
  showDefault?: boolean // Whether to show a default "Select location" option
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  label = 'Location',
  placeholder = 'Select a location',
  className = '',
  onLocationLoad,
  filterType = null,
  showDefault = true
}) => {
  const [locations, setLocations] = useState<LocationDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LocationDTO | null>(null)

  // Load locations on mount
  useEffect(() => {
    const loadLocations = async (): Promise<void> => {
      setIsLoading(true)
      try {
        const data = await locationService.getAllLocations()
        setLocations(data)

        // Find the selected location if value is provided
        if (value) {
          const location = data.find((loc) => loc.id === value) || null
          setSelectedLocation(location)
          if (onLocationLoad) {
            onLocationLoad(location)
          }
        }
      } catch (error) {
        console.error('Failed to load locations:', error)
        notifyService.error('Failed to load locations')
      } finally {
        setIsLoading(false)
      }
    }

    loadLocations()
  }, [value, onLocationLoad])

  // Handle location change
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newValue = e.target.value
    onChange(newValue)

    // Find and set the selected location
    if (newValue) {
      const location = locations.find((loc) => loc.id === newValue) || null
      setSelectedLocation(location)
      if (onLocationLoad) {
        onLocationLoad(location)
      }
    } else {
      setSelectedLocation(null)
      if (onLocationLoad) {
        onLocationLoad(null)
      }
    }
  }

  // Filter locations based on type if needed
  const filteredLocations = filterType
    ? locations.filter((loc) => loc.type === filterType)
    : locations

  // Organize locations by type
  const warehouseLocations = filteredLocations.filter((loc) => loc.type === 'WAREHOUSE')
  const storeLocations = filteredLocations.filter((loc) => loc.type === 'STORE')

  return (
    <div className={className}>
      {label && (
        <label htmlFor="location-selector" className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <select
        id="location-selector"
        value={value}
        onChange={handleChange}
        disabled={disabled || isLoading}
        className={`form-select ${error ? 'border-red-300' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? 'location-error' : undefined}
        required={required}
      >
        {showDefault && <option value="">{placeholder}</option>}

        {/* Group by location type */}
        {storeLocations.length > 0 && (
          <optgroup label="Stores">
            {storeLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </optgroup>
        )}

        {warehouseLocations.length > 0 && (
          <optgroup label="Warehouses">
            {warehouseLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {error && (
        <p id="location-error" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}

      {isLoading && (
        <p className="mt-1 text-sm text-blue-600 flex items-center">
          <div className="size-3 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Loading locations...
        </p>
      )}
    </div>
  )
}

export default LocationSelector
