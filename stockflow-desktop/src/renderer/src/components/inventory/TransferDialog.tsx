import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LocationDTO, StockItemDTO, TransferRequest } from '../../shared/types'

interface TransferDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (transfer: TransferRequest) => Promise<void>
  stockItems: StockItemDTO[]
  locations: LocationDTO[]
  isLoading?: boolean
  preselectedSourceId?: string
}

const TransferDialog = ({
  isOpen,
  onClose,
  onConfirm,
  stockItems,
  locations,
  isLoading = false,
  preselectedSourceId
}: TransferDialogProps): JSX.Element | null => {
  const [transferData, setTransferData] = useState<TransferRequest>({
    stockItemId: '',
    sourceLocationId: '',
    targetLocationId: '',
    quantity: 1,
    reference: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableStock, setAvailableStock] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItemDTO | null>(null)

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTransferData({
        stockItemId: '',
        sourceLocationId: preselectedSourceId || '',
        targetLocationId: '',
        quantity: 1,
        reference: `TRANSFER-${Date.now()}`,
        notes: ''
      })
      setErrors({})
      setAvailableStock(0)
      setSelectedItem(null)
    }
  }, [isOpen, preselectedSourceId])

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target

    // Special handling for quantity to ensure it's a number
    if (name === 'quantity') {
      const numValue = parseInt(value)
      setTransferData((prev) => ({
        ...prev,
        [name]: isNaN(numValue) ? 1 : Math.max(1, numValue)
      }))
    } else {
      setTransferData((prev) => ({
        ...prev,
        [name]: value
      }))
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }))
    }

    // Update available stock when changing stockItem
    if (name === 'stockItemId') {
      const item = stockItems.find((item) => item.id === value)
      if (item) {
        setSelectedItem(item)
        setAvailableStock(item.quantity)
        // Set quantity to 1 when item changes
        setTransferData((prev) => ({
          ...prev,
          quantity: 1
        }))
      } else {
        setSelectedItem(null)
        setAvailableStock(0)
      }
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!transferData.stockItemId) {
      newErrors.stockItemId = 'Please select a stock item'
    }

    if (!transferData.sourceLocationId) {
      newErrors.sourceLocationId = 'Please select a source location'
    }

    if (!transferData.targetLocationId) {
      newErrors.targetLocationId = 'Please select a target location'
    }

    if (transferData.sourceLocationId === transferData.targetLocationId) {
      newErrors.targetLocationId = 'Source and target locations must be different'
    }

    if (!transferData.quantity || transferData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1'
    } else if (transferData.quantity > availableStock) {
      newErrors.quantity = `Available stock is only ${availableStock} units`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle confirm button click
  const handleConfirm = async (): Promise<void> => {
    if (!validateForm()) {
      return
    }

    setIsProcessing(true)
    try {
      await onConfirm(transferData)
      onClose()
    } catch (error) {
      console.error('Error processing transfer:', error)
      // Error is already shown via notify service in the transferService
    } finally {
      setIsProcessing(false)
    }
  }

  // Get location name by ID
  const getLocationName = (id: string): string => {
    const location = locations.find((loc) => loc.id === id)
    return location ? location.name : id
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

  // Only return JSX if the dialog is open
  if (!isOpen) return null

  return (
    <AnimatePresence>
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
            className="bg-white rounded-lg shadow-xl w-full z-100 max-w-md mx-auto"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dialogVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-primary-dark">Transfer Stock</h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Stock Item Selection */}
              <div>
                <label htmlFor="stockItemId" className="form-label">
                  Stock Item
                </label>
                <select
                  id="stockItemId"
                  name="stockItemId"
                  value={transferData.stockItemId}
                  onChange={handleChange}
                  className={`form-select ${errors.stockItemId ? 'border-red-300' : ''}`}
                  disabled={isLoading || isProcessing}
                >
                  <option value="">Select an item</option>
                  {stockItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku}) - {item.quantity} available
                    </option>
                  ))}
                </select>
                {errors.stockItemId && (
                  <p className="mt-1 text-sm text-red-600">{errors.stockItemId}</p>
                )}
              </div>

              {/* Source Location */}
              <div>
                <label htmlFor="sourceLocationId" className="form-label">
                  From (Source Location)
                </label>
                <select
                  id="sourceLocationId"
                  name="sourceLocationId"
                  value={transferData.sourceLocationId}
                  onChange={handleChange}
                  className={`form-select ${errors.sourceLocationId ? 'border-red-300' : ''}`}
                  disabled={isLoading || isProcessing || !!preselectedSourceId}
                >
                  <option value="">Select source location</option>
                  <optgroup label="Warehouses">
                    {locations
                      .filter((loc) => loc.type === 'WAREHOUSE')
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Stores">
                    {locations
                      .filter((loc) => loc.type === 'STORE')
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
                {errors.sourceLocationId && (
                  <p className="mt-1 text-sm text-red-600">{errors.sourceLocationId}</p>
                )}
                {preselectedSourceId && (
                  <p className="mt-1 text-sm text-blue-600">
                    Using {getLocationName(preselectedSourceId)} as source
                  </p>
                )}
              </div>

              {/* Target Location */}
              <div>
                <label htmlFor="targetLocationId" className="form-label">
                  To (Target Location)
                </label>
                <select
                  id="targetLocationId"
                  name="targetLocationId"
                  value={transferData.targetLocationId}
                  onChange={handleChange}
                  className={`form-select ${errors.targetLocationId ? 'border-red-300' : ''}`}
                  disabled={isLoading || isProcessing}
                >
                  <option value="">Select target location</option>
                  <optgroup label="Stores">
                    {locations
                      .filter(
                        (loc) => loc.type === 'STORE' && loc.id !== transferData.sourceLocationId
                      )
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Warehouses">
                    {locations
                      .filter(
                        (loc) =>
                          loc.type === 'WAREHOUSE' && loc.id !== transferData.sourceLocationId
                      )
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
                {errors.targetLocationId && (
                  <p className="mt-1 text-sm text-red-600">{errors.targetLocationId}</p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="form-label">
                  Quantity to Transfer
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={transferData.quantity}
                    onChange={handleChange}
                    min="1"
                    max={availableStock}
                    className={`form-input ${errors.quantity ? 'border-red-300' : ''}`}
                    disabled={isLoading || isProcessing || !selectedItem}
                  />
                  {availableStock > 0 && (
                    <button
                      type="button"
                      className="ml-2 text-primary hover:text-primary-dark text-sm"
                      onClick={() =>
                        setTransferData((prev) => ({ ...prev, quantity: availableStock }))
                      }
                      disabled={isLoading || isProcessing}
                    >
                      Max
                    </button>
                  )}
                </div>
                {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
                {availableStock > 0 && !errors.quantity && (
                  <p className="mt-1 text-sm text-gray-500">Available: {availableStock} units</p>
                )}
              </div>

              {/* Reference */}
              <div>
                <label htmlFor="reference" className="form-label">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  id="reference"
                  name="reference"
                  value={transferData.reference}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., TRANSFER-20250226"
                  disabled={isLoading || isProcessing}
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="form-label">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={transferData.notes}
                  onChange={handleChange}
                  className="form-input"
                  rows={2}
                  placeholder="Additional information about this transfer"
                  disabled={isLoading || isProcessing}
                />
              </div>

              {/* Transfer Preview */}
              {selectedItem && transferData.sourceLocationId && transferData.targetLocationId && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Transfer Preview</h4>
                  <p className="text-sm text-blue-800">
                    Moving{' '}
                    <span className="font-medium">
                      {transferData.quantity}x {selectedItem.name}
                    </span>{' '}
                    from{' '}
                    <span className="font-medium">
                      {getLocationName(transferData.sourceLocationId)}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {getLocationName(transferData.targetLocationId)}
                    </span>
                  </p>
                </div>
              )}
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
                onClick={handleConfirm}
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
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                    <span>Transfer Stock</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

export default TransferDialog
