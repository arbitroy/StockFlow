import { useState } from 'react'
import { motion } from 'framer-motion'
import { StockItemDTO } from '../../shared/types'
import StockMovementDialog from './StockMovementDialog'
import AddToLocationDialog from './AddToLocationDialog'

interface StockItemsTableProps {
  items: StockItemDTO[]
  isLoading: boolean
  isError: boolean
  onEdit: (item: StockItemDTO) => void
  onDelete: (id: string) => Promise<void>
  onStockMovement: (item: StockItemDTO, type: 'IN' | 'OUT', quantity: number) => Promise<void>
}

export const StockItemsTable = ({
  items,
  isLoading,
  isError,
  onEdit,
  onDelete,
  onStockMovement
}: StockItemsTableProps): JSX.Element => {
  const [deleteConfirmItemId, setDeleteConfirmItemId] = useState<string | null>(null)
  const [movementDialogItem, setMovementDialogItem] = useState<{
    item: StockItemDTO
    type: 'IN' | 'OUT'
  } | null>(null)
  // New state for Add to Location dialog
  const [addToLocationItem, setAddToLocationItem] = useState<StockItemDTO | null>(null)

  // Handle confirm delete
  const handleConfirmDelete = async (id: string): Promise<void> => {
    await onDelete(id)
    setDeleteConfirmItemId(null)
  }

  // Handle movement dialog confirm
  const handleMovementConfirm = async (quantity: number): Promise<void> => {
    if (movementDialogItem) {
      await onStockMovement(movementDialogItem.item, movementDialogItem.type, quantity)
      setMovementDialogItem(null)
    }
  }

  // Render table content based on state
  const renderTableContent = (): JSX.Element[] | JSX.Element => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={7} className="px-6 py-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Loading inventory data...</p>
            </div>
          </td>
        </tr>
      )
    }

    if (isError) {
      return (
        <tr>
          <td colSpan={7} className="px-6 py-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="mt-4 text-gray-800 font-medium">Failed to load inventory data</p>
              <p className="text-gray-500">Please try refreshing the page</p>
            </div>
          </td>
        </tr>
      )
    }

    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="px-6 py-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="mt-4 text-gray-800 font-medium">No items found</p>
              <p className="text-gray-500">Try changing your search or add new items</p>
            </div>
          </td>
        </tr>
      )
    }

    return items.map((item) => (
      <motion.tr
        key={item.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="hover:bg-gray-50"
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="font-medium text-gray-900">{item.name}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${item.price.toFixed(2)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              item.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : item.status === 'LOW_STOCK'
                  ? 'bg-yellow-100 text-yellow-800'
                  : item.status === 'OUT_STOCK'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            {item.status === 'ACTIVE'
              ? 'Active'
              : item.status === 'LOW_STOCK'
                ? 'Low Stock'
                : item.status === 'OUT_STOCK'
                  ? 'Out of Stock'
                  : 'Inactive'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setMovementDialogItem({ item, type: 'IN' })}
              className="text-green-600 hover:text-green-900"
              title="Stock In"
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
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </button>
            <button
              onClick={() => setMovementDialogItem({ item, type: 'OUT' })}
              className={`${item.quantity > 0 ? 'text-red-600 hover:text-red-900' : 'text-gray-400 cursor-not-allowed'}`}
              title="Stock Out"
              disabled={item.quantity <= 0}
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
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>
            {/* Add new button for adding to location */}
            <button
              onClick={() => setAddToLocationItem(item)}
              className="text-primary hover:text-primary-dark"
              title="Add to Location"
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <button
              onClick={() => onEdit(item)}
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
            {deleteConfirmItemId === item.id ? (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleConfirmDelete(item.id!)}
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
                  onClick={() => setDeleteConfirmItemId(null)}
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
                onClick={() => setDeleteConfirmItemId(item.id!)}
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
        </td>
      </motion.tr>
    ))
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">{renderTableContent()}</tbody>
        </table>
      </div>

      {!isLoading && !isError && items.length > 0 && (
        <div className="bg-white px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {items.length} item{items.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Stock Movement Dialog */}
      {movementDialogItem && (
        <StockMovementDialog
          item={movementDialogItem.item}
          type={movementDialogItem.type}
          onClose={() => setMovementDialogItem(null)}
          onConfirm={handleMovementConfirm}
        />
      )}

      {/* Add to Location Dialog */}
      {addToLocationItem && (
        <AddToLocationDialog item={addToLocationItem} onClose={() => setAddToLocationItem(null)} />
      )}
    </>
  )
}
