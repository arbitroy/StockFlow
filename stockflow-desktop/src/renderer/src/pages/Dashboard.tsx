import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import notifyService from '../services/notification'
import { PageHeader } from '../components/ui/PageHeader'
import stockService from '../services/api/stockService'
import reportService from '../services/api/reportService'
import { StockItemDTO } from '../shared/types'
import PropTypes from 'prop-types'
import LocationInventoryWidget from '../components/inventory/LocationInventoryWidget'

// Component for stat cards
const StatCard = ({ title, value, icon, color, isLoading = false }): JSX.Element => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-surface rounded-lg p-6 shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {isLoading ? (
            <div className="mt-2 h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          )}
        </div>
        <div className={`${color} p-3 rounded-full text-white`}>{icon}</div>
      </div>
    </motion.div>
  )
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.element.isRequired,
  color: PropTypes.string.isRequired,
  isLoading: PropTypes.bool
}

const Dashboard = (): JSX.Element => {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0
  })
  const [lowStockItems, setLowStockItems] = useState<StockItemDTO[]>([])
  const [recentMovements, setRecentMovements] = useState<
    {
      itemName: string
      sku: string
      type: string
      quantity: number
      date: string
      reference: string
    }[]
  >([])

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async (): Promise<void> => {
      try {
        setIsLoading(true)

        // Get all stock items
        const stockItems = await stockService.getAllStockItems()

        // Calculate stats
        const lowStock = stockItems.filter((item) => item.status === 'LOW_STOCK')
        const outOfStock = stockItems.filter((item) => item.status === 'OUT_STOCK')
        const totalValue = stockItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

        setStats({
          totalItems: stockItems.length,
          lowStockItems: lowStock.length,
          outOfStockItems: outOfStock.length,
          totalValue
        })

        // Get low stock items
        setLowStockItems([...lowStock, ...outOfStock].slice(0, 5))

        // Get recent movements
        const now = new Date()
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

        const movements = await reportService.getMovementReport(
          oneMonthAgo.toISOString(),
          now.toISOString()
        )

        setRecentMovements(movements.slice(0, 5))

        notifyService.success('Dashboard loaded successfully')
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        notifyService.error('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const handleRefresh = async (): Promise<void> => {
    try {
      setIsLoading(true)
      // Re-fetch all data
      const stockItems = await stockService.getAllStockItems()

      // Calculate stats
      const lowStock = stockItems.filter((item) => item.status === 'LOW_STOCK')
      const outOfStock = stockItems.filter((item) => item.status === 'OUT_STOCK')
      const totalValue = stockItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

      setStats({
        totalItems: stockItems.length,
        lowStockItems: lowStock.length,
        outOfStockItems: outOfStock.length,
        totalValue
      })

      setLowStockItems([...lowStock, ...outOfStock].slice(0, 5))

      notifyService.success('Dashboard refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh dashboard:', error)
      notifyService.error('Failed to refresh dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your inventory status and recent activities"
        actions={
          <button onClick={handleRefresh} className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Refreshing...</span>
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Inventory Items"
          value={isLoading ? '-' : stats.totalItems}
          icon={
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          }
          color="bg-primary"
          isLoading={isLoading}
        />

        <StatCard
          title="Low Stock Items"
          value={isLoading ? '-' : stats.lowStockItems}
          icon={
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
          color="bg-yellow-500"
          isLoading={isLoading}
        />

        <StatCard
          title="Out of Stock Items"
          value={isLoading ? '-' : stats.outOfStockItems}
          icon={
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
          }
          color="bg-red-500"
          isLoading={isLoading}
        />

        <StatCard
          title="Total Inventory Value"
          value={isLoading ? '-' : `$${stats.totalValue.toFixed(2)}`}
          icon={
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          color="bg-secondary"
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert Panel */}
        <div className="bg-surface rounded-lg shadow-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-primary-dark">Low Stock Alerts</h2>
            <Link
              to="/inventory?filter=low-stock"
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              View All →
            </Link>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 border border-gray-100 rounded-md"
                >
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-12 mx-auto text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-4 text-gray-500">All stock levels are good!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-between items-center p-3 border border-gray-100 rounded-md hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'OUT_STOCK'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {item.status === 'OUT_STOCK' ? 'Out of Stock' : `${item.quantity} left`}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Panel */}
        <div className="bg-surface rounded-lg shadow-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-primary-dark">Recent Stock Movements</h2>
            <Link
              to="/movements"
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              View All →
            </Link>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 border border-gray-100 rounded-md"
                >
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : recentMovements.length === 0 ? (
            <div className="text-center py-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-12 mx-auto text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-4 text-gray-500">No recent movements</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMovements.map((movement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-between items-center p-3 border border-gray-100 rounded-md hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{movement.itemName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(movement.date).toLocaleDateString()} • Ref:{' '}
                      {movement.reference || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        movement.type === 'IN'
                          ? 'bg-green-100 text-green-800'
                          : movement.type === 'OUT'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {movement.type} • {movement.quantity} units
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location Inventory Widget */}
      <LocationInventoryWidget />

      {/* Quick Actions */}
      <div className="bg-surface rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold text-primary-dark mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/inventory?action=add"
            className="btn btn-outline hover:bg-primary-light hover:text-primary-dark hover:border-primary-light justify-center py-4"
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
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Add New Item</span>
          </Link>

          <Link
            to="/inventory?view=low-stock"
            className="btn btn-outline hover:bg-yellow-100 hover:text-yellow-800 hover:border-yellow-100 justify-center py-4"
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>View Low Stock</span>
          </Link>

          <Link
            to="/transfers"
            className="btn btn-outline hover:bg-secondary-light hover:text-secondary-dark hover:border-secondary-light justify-center py-4"
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
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            <span>Transfer Stock</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
