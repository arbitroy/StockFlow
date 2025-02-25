import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { PageHeader } from '../components/ui/PageHeader'
import reportService from '../services/api/reportService'
import notifyService from '../services/notification'

type ReportType = 'stock' | 'movement' | 'sales'

const Reports = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [activeReport, setActiveReport] = useState<ReportType>('stock')
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  })
  const [stockReport, setStockReport] = useState([])
  const [movementReport, setMovementReport] = useState([])
  const [salesReport, setSalesReport] = useState([])

  // Load report data when report type or date range changes
  useEffect(() => {
    loadReportData()
  }, [activeReport, dateRange])

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      const startDateTime = `${dateRange.startDate}T00:00:00`
      const endDateTime = `${dateRange.endDate}T23:59:59`

      switch (activeReport) {
        case 'stock':
          const stockData = await reportService.getStockReport(startDateTime, endDateTime)
          setStockReport(stockData)
          break
        case 'movement':
          const movementData = await reportService.getMovementReport(startDateTime, endDateTime)
          setMovementReport(movementData)
          break
        case 'sales':
          const salesData = await reportService.getSalesReport(startDateTime, endDateTime)
          setSalesReport(salesData)
          break
      }
    } catch (error) {
      console.error(`Failed to load ${activeReport} report:`, error)
      notifyService.error(`Failed to load ${activeReport} report`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleExport = () => {
    notifyService.info(`Exporting ${activeReport} report as CSV`)
    // Here you would implement actual export functionality
  }

  const handlePrint = () => {
    notifyService.info(`Printing ${activeReport} report`)
    window.print()
  }

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-16">
          <div className="flex flex-col items-center">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading report data...</p>
          </div>
        </div>
      )
    }

    switch (activeReport) {
      case 'stock':
        return renderStockReport()
      case 'movement':
        return renderMovementReport()
      case 'sales':
        return renderSalesReport()
      default:
        return <p>Select a report type</p>
    }
  }

  const renderStockReport = () => {
    if (stockReport.length === 0) {
      return (
        <div className="text-center py-10">
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
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No stock data available</h3>
          <p className="mt-1 text-gray-500">
            Try changing your date range or adding inventory items.
          </p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Movements
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sales
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stockReport.map((item: any, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{item.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.quantity}
                </td>
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
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${item.value.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.movementsCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.salesCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderMovementReport = () => {
    if (movementReport.length === 0) {
      return (
        <div className="text-center py-10">
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
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No movements found</h3>
          <p className="mt-1 text-gray-500">Try changing your date range.</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {movementReport.map((movement: any, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(movement.date).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {movement.itemName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {movement.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      movement.type === 'IN'
                        ? 'bg-green-100 text-green-800'
                        : movement.type === 'OUT'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {movement.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {movement.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {movement.reference || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderSalesReport = () => {
    if (salesReport.length === 0) {
      return (
        <div className="text-center py-10">
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No sales data available</h3>
          <p className="mt-1 text-gray-500">
            Try changing your date range or recording some sales.
          </p>
        </div>
      )
    }

    return (
      <div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesReport.map((sale: any, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(sale.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.totalSales}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${sale.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">Summary</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="mt-1 text-2xl font-semibold text-primary-dark">
                {salesReport.reduce((sum: number, sale: any) => sum + sale.totalSales, 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="mt-1 text-2xl font-semibold text-primary-dark">
                $
                {salesReport
                  .reduce((sum: number, sale: any) => sum + sale.totalAmount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Avg. Daily Sales</p>
              <p className="mt-1 text-2xl font-semibold text-primary-dark">
                {(
                  salesReport.reduce((sum: number, sale: any) => sum + sale.totalSales, 0) /
                  salesReport.length
                ).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate and analyze inventory and sales reports"
        actions={
          <div className="flex space-x-2">
            <button onClick={handleExport} className="btn btn-outline">
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Export CSV</span>
            </button>
            <button onClick={handlePrint} className="btn btn-outline">
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
          </div>
        }
      />

      {/* Report Controls */}
      <div className="bg-surface rounded-lg shadow-card p-4">
        <div className="md:flex md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-md ${
                activeReport === 'stock'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
              onClick={() => setActiveReport('stock')}
            >
              Stock Report
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                activeReport === 'movement'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
              onClick={() => setActiveReport('movement')}
            >
              Movement Report
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                activeReport === 'sales'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
              onClick={() => setActiveReport('sales')}
            >
              Sales Report
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-surface rounded-lg shadow-card p-6">
        <div className="print:p-0">
          <h2 className="text-lg font-semibold text-primary-dark mb-4 print:text-xl">
            {activeReport === 'stock'
              ? 'Stock Report'
              : activeReport === 'movement'
                ? 'Stock Movement Report'
                : 'Sales Report'}{' '}
            ({dateRange.startDate} to {dateRange.endDate})
          </h2>

          {renderReportContent()}
        </div>
      </div>
    </div>
  )
}

export default Reports
