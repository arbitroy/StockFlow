import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '../components/ui/PageHeader'
import { LocationDTO } from '../shared/types'
import notifyService from '../services/notification'

// Mock data for locations
const mockLocations: LocationDTO[] = [
  {
    id: '1',
    name: 'Main Warehouse',
    type: 'WAREHOUSE',
    createdAt: '2025-01-10T00:00:00Z'
  },
  {
    id: '2',
    name: 'Downtown Store',
    type: 'STORE',
    createdAt: '2025-01-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'East Distribution Center',
    type: 'WAREHOUSE',
    createdAt: '2025-01-20T00:00:00Z'
  },
  {
    id: '4',
    name: 'North Retail',
    type: 'STORE',
    createdAt: '2025-02-01T00:00:00Z'
  }
]

interface LocationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (location: LocationDTO) => Promise<void>
  initialData?: LocationDTO
  title: string
}

const LocationDialog = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  title
}: LocationDialogProps): JSX.Element | null => {
  const [location, setLocation] = useState<LocationDTO>({
    name: '',
    type: 'WAREHOUSE'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize with initial data when provided
  useEffect(() => {
    if (initialData) {
      setLocation({ ...initialData })
    } else {
      setLocation({
        name: '',
        type: 'WAREHOUSE'
      })
    }
    setErrors({})
  }, [initialData, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target
    setLocation((prev) => ({
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!location.name.trim()) {
      newErrors.name = 'Location name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handles the form submission event.
   *
   * @param {React.FormEvent} e - The form submission event.
   * @returns {Promise<void>} A promise that resolves when the form submission is complete.
   *
   * This function prevents the default form submission behavior, validates the form,
   * sets the loading state, attempts to save the location, and handles any errors
   * that occur during the save process. Finally, it resets the loading state.
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await onSave(location)
      onClose()
    } catch (error) {
      console.error('Error saving location:', error)
    } finally {
      setIsLoading(false)
    }
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
          className="bg-white rounded-lg shadow-xl w-full z-100 max-w-md mx-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={dialogVariants}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-primary-dark">{title}</h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="name" className="form-label">
                  Location Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={location.name}
                  onChange={handleChange}
                  className={`form-input ${errors.name ? 'border-red-300' : ''}`}
                  placeholder="Enter location name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="type" className="form-label">
                  Location Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={location.type}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="STORE">Store</option>
                </select>
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
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

const Locations: React.FC = () => {
  const [locations, setLocations] = useState<LocationDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<LocationDTO | undefined>(undefined)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Load locations
  useEffect(() => {
    const loadLocations = async (): Promise<void> => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800))
        setLocations(mockLocations)
      } catch (error) {
        console.error('Failed to load locations:', error)
        notifyService.error('Failed to load locations')
      } finally {
        setIsLoading(false)
      }
    }

    loadLocations()
  }, [])

  const handleAddLocation = (): void => {
    setEditingLocation(undefined)
    setDialogOpen(true)
  }

  const handleEditLocation = (location: LocationDTO): void => {
    setEditingLocation(location)
    setDialogOpen(true)
  }

  const handleSaveLocation = async (location: LocationDTO): Promise<void> => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (location.id) {
        // Edit existing location
        setLocations((prev) => prev.map((item) => (item.id === location.id ? location : item)))
        notifyService.success(`Location "${location.name}" updated successfully`)
      } else {
        // Add new location
        const newLocation = {
          ...location,
          id: Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString()
        }
        setLocations((prev) => [...prev, newLocation])
        notifyService.success(`Location "${location.name}" added successfully`)
      }
    } catch (error) {
      console.error('Failed to save location:', error)
      notifyService.error(`Failed to ${location.id ? 'update' : 'add'} location`)
    }
  }

  const handleDeleteLocation = async (id: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 600))

      setLocations((prev) => prev.filter((item) => item.id !== id))
      notifyService.success('Location deleted successfully')

      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Failed to delete location:', error)
      notifyService.error('Failed to delete location')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        subtitle="Manage warehouses and store locations"
        actions={
          <button className="btn btn-primary" onClick={handleAddLocation}>
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
            <span>Add Location</span>
          </button>
        }
      />

      {/* Locations Grid */}
      {isLoading ? (
        <div className="bg-surface rounded-lg shadow-card p-8 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading locations...</p>
          </div>
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-surface rounded-lg shadow-card p-12 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-16 mx-auto text-gray-400"
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
          <h3 className="mt-4 text-lg font-medium text-gray-900">No locations found</h3>
          <p className="mt-1 text-gray-500">Get started by adding your first location.</p>
          <button className="mt-6 btn btn-primary" onClick={handleAddLocation}>
            Add Location
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-lg shadow-card hover:shadow-card-hover transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-primary-dark">{location.name}</h3>
                    <span
                      className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        location.type === 'WAREHOUSE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {location.type === 'WAREHOUSE' ? 'Warehouse' : 'Store'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditLocation(location)}
                      className="text-primary hover:text-primary-dark"
                      title="Edit"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    {deleteConfirmId === location.id ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleDeleteLocation(location.id!)}
                          className="text-red-600 hover:text-red-900"
                          title="Confirm Delete"
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
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Cancel Delete"
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
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(location.id!)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Created on {new Date(location.createdAt!).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between">
                <button
                  className="text-sm text-primary font-medium hover:text-primary-dark"
                  onClick={() => {
                    notifyService.info(`Opening inventory for ${location.name}`)
                  }}
                >
                  View Inventory
                </button>
                <span className="text-sm text-gray-500">ID: {location.id?.substring(0, 8)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Location Dialog */}
      <LocationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveLocation}
        initialData={editingLocation}
        title={editingLocation ? 'Edit Location' : 'Add New Location'}
      />
    </div>
  )
}

export default Locations
