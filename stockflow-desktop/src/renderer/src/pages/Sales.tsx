import { useState, useEffect } from 'react'
import { motion, Variants } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { SaleDTO, SaleStatus, StockItemDTO, LocationDTO } from '../shared/types'
import notifyService from '../services/notification'
import stockService from '../services/api/stockService'
import locationService from '../services/api/locationService'
import NewSaleDialog from '../components/sales/NewSaleDialog'

// Sale detail modal
interface SaleDetailModalProps {
  isOpen: boolean
  onClose: () => void
  sale: SaleDTO | null
}

const SaleDetailModal = ({ isOpen, onClose, sale }: SaleDetailModalProps): JSX.Element | null => {
  if (!isOpen || !sale) return null

  // Animation variants
  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
  }

  return (
    <div className="fixed inset-0 z-[50] overflow-y-auto">
      <motion.div
        className="fixed inset-0 bg-[rgba(0,0,0,0.5)]transition-opacity"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayVariants}
        onClick={onClose}
      />

      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-primary-dark">Sale Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-6"
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

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Reference</h4>
                <p className="font-medium">{sale.reference}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Date</h4>
                <p>{new Date(sale.createdAt!).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                <p>{sale.customerName || 'Walk-in Customer'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                <p>{sale.customerPhone || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <StatusBadge status={sale.status!} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total</h4>
                <p className="text-lg font-semibold text-primary-dark">${sale.total!.toFixed(2)}</p>
              </div>
              {/* Add location information */}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p>{sale.locationName || 'Unknown Location'}</p>
              </div>
            </div>

            <h4 className="font-medium text-gray-900 mb-3">Items</h4>
            <div className="bg-gray-50 rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sale.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {/* In a real app we would fetch and display the item name */}
                        {item.id ? `Item #${item.id.slice(0, 5)}` : `Product ${index + 1}`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                        ${item.price?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        ${item.total?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right"
                    >
                      Total
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary-dark text-right">
                      ${sale.total!.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <button onClick={onClose} className="btn btn-outline">
              Close
            </button>

            <div className="space-x-2">
              <button
                onClick={() => {
                  notifyService.info('Printing receipt...')
                  // In a real app, this would trigger receipt printing
                }}
                className="btn btn-outline"
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
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span>Print</span>
              </button>

              {sale.status === 'PENDING' && (
                <button
                  onClick={() => {
                    notifyService.success('Sale completed successfully')
                    onClose()
                    // In a real app, this would update the sale status
                  }}
                  className="btn btn-primary"
                >
                  Complete Sale
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Mock sales data with location information
const mockSales: SaleDTO[] = [
  {
    id: '1',
    customerName: 'John Smith',
    customerPhone: '555-123-4567',
    locationId: '1', // Main Warehouse
    locationName: 'Main Warehouse',
    items: [
      {
        id: '1-1',
        stockItemId: '1',
        quantity: 2,
        price: 24.99,
        total: 49.98
      }
    ],
    total: 49.98,
    reference: 'SALE-12345',
    status: 'COMPLETED',
    createdAt: '2025-02-20T14:22:35Z'
  },
  {
    id: '2',
    customerName: 'Jane Doe',
    customerPhone: '555-987-6543',
    locationId: '2', // Downtown Store
    locationName: 'Downtown Store',
    items: [
      {
        id: '2-1',
        stockItemId: '2',
        quantity: 1,
        price: 12.99,
        total: 12.99
      },
      {
        id: '2-2',
        stockItemId: '3',
        quantity: 1,
        price: 49.99,
        total: 49.99
      }
    ],
    total: 62.98,
    reference: 'SALE-23456',
    status: 'PENDING',
    createdAt: '2025-02-22T09:15:42Z'
  },
  {
    id: '3',
    customerName: 'Bob Johnson',
    customerPhone: '555-456-7890',
    locationId: '3', // East Distribution Center
    locationName: 'East Distribution Center',
    items: [
      {
        id: '3-1',
        stockItemId: '4',
        quantity: 1,
        price: 79.99,
        t
