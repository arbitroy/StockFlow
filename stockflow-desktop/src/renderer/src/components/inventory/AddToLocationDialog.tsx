import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LocationDTO, StockItemDTO, TransferRequest } from '../../shared/types'
import locationService from '../../services/api/locationService'
import transferService from '../../services/api/transferService'
import notifyService from '../../services/notification'

interface AddToLocationDialogProps {
  item: StockItemDTO
  onClose: () => void
}

const AddToLocationDialog = ({ item, onClose }: AddToLocationDialogProps): JSX.Element => {
  const [locations, setLocations] = useState<LocationDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load locations when dialog opens
  useEffect(() => {
    const loadLocations = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const locationsData = await locationService.getAllLocations()
        setLocations(locationsData)
      } catch (error) {
        console.error('Failed to load locations:', error)
        notifyService.error('Failed to load locations')
      } finally {
        setIsLoading(false)
      }
    }

    loadLocations()
  }, [])

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value)

    if (isNaN(value) || value < 1) {
      setQuantity(1)
      setErrors((prev) => ({ ...prev, quantity: 'Quantity must be at least 1' }))
    } else if (value > item.quantity) {
      setQuantity(item.quantity)
      setErrors((prev) => ({ ...prev, quantity: `Only ${item.quantity} available in stock` }))
    } else {
      setQuantity(value)
      setErrors((prev) => ({ ...prev, quantity: '' }))
    }
  }

  // Handle location change
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedLocation(e.target.value)

    if (e.target.value) {
      setErrors((prev) => ({ ...prev, location: '' }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedLocation) {
      newErrors.location = 'Please select a location'
    }

    if (quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1'
    } else if (quantity > item.quantity) {
      newErrors.quantity = `Only ${item.quantity} available in stock`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) {
      return
    }

    setIsProcessing(true)
    try {
      // Create transfer request
      const transferRequest: TransferRequest = {
        stockItemId: item.id!,
        // Using a virtual "master" warehouse as source in this implementation
        // In a real app, you'd need to know which location the global stock is at
        sourceLocationId: 'master', // This should be replaced with a real source location
        targetLocationId: selectedLocation,
        quantity: quantity,
        reference: `LOC-ADD-${Date.now()}`,
        notes: `Adding ${item.name} to location`
      }

      // Process the transfer
      await transferService.transferStock(transferRequest)

      notifyService.success(`Added ${quantity} ${item.name} to location successfully`)
      onClose()
    } catch (error) {
      console.error('Error adding to location:', error)
      notifyService.error('Failed to add item to location')
    } finally {
      setIsProcessing(false)
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
          className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={dialogVariants}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-primary-dark">
              Add to Location: {item.name}
            </h3>
          </div>

          <div className="px-6 py-4">
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Current Stock:</span>
                <span className="text-sm text-gray-500">{item.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">SKU:</span>
                <span className="text-sm text-gray-500">{item.sku}</span>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="location" className="form-label">
                Select Location
              </label>
              <select
                id="location"
                value={selectedLocation}
                onChange={handleLocationChange}
                className={`form-select ${errors.location ? 'border-red-300' : ''}`}
                disabled={isLoading || isProcessing}
              >
                <option value="">Select a location</option>
                {/* Group locations by type */}
                <optgroup label="Warehouses">
                  {locations
                    .filter((loc) => loc.type === 'WAREHOUSE')
                    .map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Stores">
                  {locations
                    .filter((loc) => loc.type === 'STORE')
                    .map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                </optgroup>
              </select>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="quantity" className="form-label">
                Quantity
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  max={item.quantity}
                  className={`form-input ${errors.quantity ? 'border-red-300' : ''}`}
                  disabled={isProcessing}
                />
                <button
                  type="button"
                  className="ml-2 text-primary hover:text-primary-dark text-sm"
                  onClick={() => setQuantity(item.quantity)}
                  disabled={isProcessing}
                >
                  Max
                </button>
              </div>
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing || isLoading}
              className="btn btn-primary"
            >
              {isProcessing ? (
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
                  <span>Add to Location</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AddToLocationDialog
