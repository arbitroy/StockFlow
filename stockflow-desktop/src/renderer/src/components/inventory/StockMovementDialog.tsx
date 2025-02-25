import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StockItemDTO } from '@shared/types'

interface StockMovementDialogProps {
  item: StockItemDTO
  type: 'IN' | 'OUT'
  onClose: () => void
  onConfirm: (quantity: number) => Promise<void>
}

const StockMovementDialog = ({
  item,
  type,
  onClose,
  onConfirm
}: StockMovementDialogProps): JSX.Element => {
  const [quantity, setQuantity] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value)

    if (isNaN(value) || value < 1) {
      setQuantity(1)
      setError('Quantity must be at least 1')
    } else if (type === 'OUT' && value > item.quantity) {
      setQuantity(item.quantity)
      setError(`Only ${item.quantity} available in stock`)
    } else {
      setQuantity(value)
      setError('')
    }
  }

  const handleConfirm = async (): Promise<void> => {
    if (quantity < 1) {
      setError('Quantity must be at least 1')
      return
    }

    if (type === 'OUT' && quantity > item.quantity) {
      setError(`Only ${item.quantity} available in stock`)
      return
    }

    setIsProcessing(true)
    try {
      await onConfirm(quantity)
    } catch (error) {
      console.error('Error processing stock movement:', error)
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
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dialogVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-primary-dark">
                {type === 'IN' ? 'Stock In' : 'Stock Out'}: {item.name}
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
                <label htmlFor="quantity" className="form-label">
                  {type === 'IN' ? 'Add Quantity' : 'Remove Quantity'}
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  max={type === 'OUT' ? item.quantity : undefined}
                  className={`form-input ${error ? 'border-red-300' : ''}`}
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              </div>

              <div className="mt-6 bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">New Stock Level:</span>
                  <span className="text-sm font-medium">
                    {type === 'IN'
                      ? item.quantity + quantity
                      : Math.max(0, item.quantity - quantity)}{' '}
                    units
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
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing || !!error}
                className={`btn ${type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white focus-visible:ring focus-visible:ring-opacity-50 ${type === 'IN' ? 'focus-visible:ring-green-300' : 'focus-visible:ring-red-300'}`}
              >
                {isProcessing ? (
                  <>
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm {type === 'IN' ? 'Stock In' : 'Stock Out'}</span>
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

export default StockMovementDialog
