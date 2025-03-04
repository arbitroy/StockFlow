import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LocationDTO, StockItemDTO } from '../../shared/types'
import locationService from '../../services/api/locationService'
import notifyService from '../../services/notification'

interface NewSaleDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (sale: {
    customerName?: string
    customerPhone?: string
    locationId: string
    items: { stockItemId: string; quantity: number; price: number }[]
  }) => Promise<void>
  preselectedLocationId?: string
  availableItems?: StockItemDTO[]
  isLoading?: boolean
}

const NewSaleDialog = ({
  isOpen,
  onClose,
  onSave,
  preselectedLocationId,
  availableItems = [],
  isLoading = false
}: NewSaleDialogProps): JSX.Element | null => {
  const [sale, setSale] = useState({
    customerName: '',
    customerPhone: '',
    locationId: preselectedLocationId || '',
    items: [{ stockItemId: '', quantity: 1, name: '', price: 0, maxQuantity: 0 }]
  })
  const [locations, setLocations] = useState<LocationDTO[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form when dialog opens or when preselectedLocationId changes
  useEffect(() => {
    if (isOpen) {
      setSale({
        customerName: '',
        customerPhone: '',
        locationId: preselectedLocationId || '',
        items: [{ stockItemId: '', quantity: 1, name: '', price: 0, maxQuantity: 0 }]
      })
      setErrors({})
    }
  }, [isOpen, preselectedLocationId])

  // Load locations if needed
  useEffect(() => {
    const loadLocations = async (): Promise<void> => {
      if (!preselectedLocationId) {
        try {
          setIsLoadingLocations(true)
          const locs = await locationService.getAllLocations()
          setLocations(locs)
        } catch (error) {
          console.error('Failed to load locations:', error)
          notifyService.error('Failed to load locations')
        } finally {
          setIsLoadingLocations(false)
        }
      }
    }

    if (isOpen) {
      loadLocations()
    }
  }, [isOpen, preselectedLocationId])

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

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const { value } = e.target
    setSale((prev) => ({
      ...prev,
      locationId: value,
      // Reset items when location changes
      items: [{ stockItemId: '', quantity: 1, name: '', price: 0, maxQuantity: 0 }]
    }))

    // Clear error
    if (errors.locationId) {
      setErrors((prev) => ({
        ...prev,
        locationId: ''
      }))
    }
  }

  const handleItemChange = (index: number, field: string, value: string | number): void => {
    const newItems = [...sale.items]

    if (field === 'stockItemId') {
      // When changing the item, get data from the available items
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

    // Check if location is selected
    if (!sale.locationId) {
      newErrors.locationId = 'Please select a location'
    }

    // Validate items
    sale.items.forEach((item, index) => {
      if (!item.stockItemId) {
        newErrors[`items[${index}].stockItemId`] = 'Please select a product'
      }

      if (!item.quantity || item.quantity < 1) {
        newErrors[`items[${index}].quantity`] = 'Quantity must be at least 1'
      } else if (item.quantity > item.maxQuantity) {
        newErrors[`items[${index}].quantity`] = `Only ${item.maxQuantity} available`
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

    setIsProcessing(true)
    try {
      // Format sale data for API
      const saleData = {
        customerName: sale.customerName.trim() || undefined,
        customerPhone: sale.customerPhone.trim() || undefined,
        locationId: sale.locationId,
        items: sale.items.map((item) => ({
          stockItemId: item.stockItemId,
          quantity: item.quantity,
          price: item.price
        }))
      }

      await onSave(saleData)
    } catch (error) {
      console.error('Failed to create sale:', error)
      notifyService.error('Failed to create sale')
    } finally {
      setIsProcessing(false)
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
        className="fixed inset-0 bg-[rgba(0,0,0,0.5)] transition-opacity"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayVariants}
        onClick={onClose}
      />

      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          className="bg-white rounded-lg shadow-xl w-full z-100 max-w-3xl mx-auto"
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
              {/* Location selection */}
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Location</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    {preselectedLocationId ? (
                      // If location is preselected, show it as read-only
                      <div>
                        <label className="form-label">Selected Location</label>
                        <div className="form-input bg-gray-100 cursor-not-allowed">
                          {locations.find((loc) => loc.id === preselectedLocationId)?.name ||
                            'Selected Location'}
                        </div>
                      </div>
                    ) : (
                      // Otherwise, show location selector
                      <>
                        <label htmlFor="locationId" className="form-label">
                          Select Location <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="locationId"
                          name="locationId"
                          value={sale.locationId}
                          onChange={handleLocationChange}
                          className={`form-select ${errors.locationId ? 'border-red-300' : ''}`}
                          disabled={isLoading || isLoadingLocations || isProcessing}
                        >
                          <option value="">Select a location</option>
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
                        {errors.locationId && (
                          <p className="mt-1 text-sm text-red-600">{errors.locationId}</p>
                        )}
                        {isLoadingLocations && (
                          <p className="mt-1 text-sm text-blue-600 flex items-center">
                            <div className="size-3 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Loading locations...
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

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
                    disabled={isProcessing}
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
                    disabled={isProcessing}
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
                    disabled={isProcessing}
                    className="text-primary hover:text-primary-dark text-sm font-medium"
                  >
                    + Add Item
                  </button>
                </div>

                {isLoading ? (
                  <div className="bg-gray-50 p-8 rounded-md flex justify-center items-center">
                    <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
                    <p className="text-gray-600">Loading inventory for this location...</p>
                  </div>
                ) : availableItems.length === 0 ? (
                  <div className="bg-gray-50 p-8 rounded-md text-center">
                    <p className="text-gray-600">No items available at this location</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Please transfer stock to this location before creating a sale
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sale.items.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md">
                        <div className="flex justify-between">
                          <h5 className="font-medium text-sm text-gray-700">Item #{index + 1}</h5>
                          {sale.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              disabled={isProcessing}
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
                              onChange={(e) =>
                                handleItemChange(index, 'stockItemId', e.target.value)
                              }
                              className={`form-select ${
                                errors[`items[${index}].stockItemId`] ? 'border-red-300' : ''
                              }`}
                              disabled={isProcessing}
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
                              disabled={!item.stockItemId || isProcessing}
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
                )}
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
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || isLoading || availableItems.length === 0}
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

export default NewSaleDialog
