import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LocationDTO } from '../../shared/types'
import notifyService from '../../services/notification'

interface LocationSelectorDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (locationId: string) => void
  locations: LocationDTO[]
  isLoading?: boolean
  title?: string
}

const LocationSelectorDialog = ({
  isOpen,
  onClose,
  onSelect,
  locations,
  isLoading = false,
  title = 'Select Location'
}: LocationSelectorDialogProps): JSX.Element | null => {
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [filteredLocations, setFilteredLocations] = useState<LocationDTO[]>([])

  // Initialize state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedLocation('')
      setSearch('')
      setFilteredLocations(locations)
    }
  }, [isOpen, locations])

  // Filter locations based on search input
  useEffect(() => {
    if (!search.trim()) {
      setFilteredLocations(locations)
      return
    }

    const query = search.toLowerCase()
    const filtered = locations.filter((location) => location.name.toLowerCase().includes(query))
    setFilteredLocations(filtered)
  }, [search, locations])

  // Handle location selection
  const handleSelect = (): void => {
    if (!selectedLocation) {
      notifyService.warning('Please select a location')
      return
    }

    onSelect(selectedLocation)
    onClose()
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
    <div className="fixed inset-0 z-[50] overflow-y-auto">
      <motion.div
        className="fixed inset-0 bg-[rgba(0,0,0,0.5)] transition-opacity"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayVariants}
        onClick={onClose}
      />

      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto z-[60]"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={dialogVariants}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-primary-dark">{title}</h3>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search locations..."
                className="form-input pl-10 w-full"
                disabled={isLoading}
              />
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
            </div>

            {/* Locations list */}
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-gray-500">Loading locations...</span>
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No locations found</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {/* Store locations */}
                  {filteredLocations.filter((loc) => loc.type === 'STORE').length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                        Stores
                      </div>
                      {filteredLocations
                        .filter((loc) => loc.type === 'STORE')
                        .map((location) => (
                          <div
                            key={location.id}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                              selectedLocation === location.id
                                ? 'bg-primary-light bg-opacity-20'
                                : ''
                            }`}
                            onClick={() => setSelectedLocation(location.id!)}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`location-${location.id}`}
                                name="location"
                                checked={selectedLocation === location.id}
                                onChange={() => setSelectedLocation(location.id!)}
                                className="text-primary focus:ring-primary"
                              />
                              <label
                                htmlFor={`location-${location.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="font-medium text-gray-900">{location.name}</div>
                              </label>
                            </div>
                          </div>
                        ))}
                    </>
                  )}

                  {/* Warehouse locations */}
                  {filteredLocations.filter((loc) => loc.type === 'WAREHOUSE').length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                        Warehouses
                      </div>
                      {filteredLocations
                        .filter((loc) => loc.type === 'WAREHOUSE')
                        .map((location) => (
                          <div
                            key={location.id}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                              selectedLocation === location.id
                                ? 'bg-primary-light bg-opacity-20'
                                : ''
                            }`}
                            onClick={() => setSelectedLocation(location.id!)}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`location-${location.id}`}
                                name="location"
                                checked={selectedLocation === location.id}
                                onChange={() => setSelectedLocation(location.id!)}
                                className="text-primary focus:ring-primary"
                              />
                              <label
                                htmlFor={`location-${location.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="font-medium text-gray-900">{location.name}</div>
                              </label>
                            </div>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button onClick={onClose} className="btn btn-outline" disabled={isLoading}>
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedLocation || isLoading}
              className="btn btn-primary"
            >
              Select Location
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LocationSelectorDialog
