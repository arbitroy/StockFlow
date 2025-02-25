import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StockItemDTO } from '../../shared/types'

interface StockItemDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: StockItemDTO) => Promise<boolean>
  initialData?: StockItemDTO
  title: string
}

const StockItemDialog = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  title
}: StockItemDialogProps): JSX.Element | null => {
  const [item, setItem] = useState<StockItemDTO>({
    name: '',
    sku: '',
    price: 0,
    quantity: 0,
    status: 'ACTIVE'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form with initial data when provided
  useEffect(() => {
    if (initialData) {
      setItem({
        ...initialData
      })
    } else {
      setItem({
        name: '',
        sku: '',
        price: 0,
        quantity: 0,
        status: 'ACTIVE'
      })
    }
    setErrors({})
  }, [initialData, isOpen])

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target

    // For number inputs, convert to number
    if (name === 'price' || name === 'quantity') {
      setItem({
        ...item,
        [name]: parseFloat(value) || 0
      })
    } else {
      setItem({
        ...item,
        [name]: value
      })
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!item.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!item.sku.trim()) {
      newErrors.sku = 'SKU is required'
    }

    if (item.price <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }

    if (item.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const success = await onSave(item)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Error saving stock item:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // If dialog is not open, don't render anything
  if (!isOpen) return null

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
    <AnimatePresence>
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
            className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto"
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
                    Item Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={item.name}
                    onChange={handleChange}
                    className={`form-input ${errors.name ? 'border-red-300' : ''}`}
                    placeholder="Enter item name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="sku" className="form-label">
                    SKU
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={item.sku}
                    onChange={handleChange}
                    className={`form-input ${errors.sku ? 'border-red-300' : ''}`}
                    placeholder="Enter SKU"
                  />
                  {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="form-label">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={item.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className={`form-input ${errors.price ? 'border-red-300' : ''}`}
                      placeholder="0.00"
                    />
                    {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                  </div>

                  <div>
                    <label htmlFor="quantity" className="form-label">
                      Quantity
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={item.quantity}
                      onChange={handleChange}
                      min="0"
                      className={`form-input ${errors.quantity ? 'border-red-300' : ''}`}
                      placeholder="0"
                    />
                    {errors.quantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="status" className="form-label">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={item.status}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_STOCK">Out of Stock</option>
                    <option value="INACTIVE">Inactive</option>
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
                    <span>Save</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

export default StockItemDialog
