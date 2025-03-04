import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LocationDTO, StockItemDTO, SaleDTO } from '../shared/types'
import notifyService from '../services/notification'
import locationService from '../services/api/locationService'
import saleService from '../services/api/saleService'
import NewSaleDialog from '../components/sales/NewSaleDialog'
import LocationSelectorDialog from '../components/sales/LocationSelectorDialog'

/**
 * SalesFlow is a controller component that manages the complete sales workflow,
 * including location selection, product selection, and sale creation.
 */
const SalesFlow: React.FC = () => {
  const navigate = useNavigate()

  // State for locations and selected location
  const [locations, setLocations] = useState<LocationDTO[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationDTO | null>(null)
  const [isLocationsLoading, setIsLocationsLoading] = useState(false)

  // State for inventory at the selected location
  const [locationInventory, setLocationInventory] = useState<StockItemDTO[]>([])
  const [isInventoryLoading, setIsInventoryLoading] = useState(false)

  // Dialog visibility states
  const [locationSelectorOpen, setLocationSelectorOpen] = useState(false)
  const [newSaleDialogOpen, setNewSaleDialogOpen] = useState(false)

  // State for the workflow status
  const [workflowStatus, setWorkflowStatus] = useState<
    'idle' | 'selecting_location' | 'selecting_products' | 'processing' | 'completed' | 'error'
  >('idle')

  // Success state
  const [completedSale, setCompletedSale] = useState<SaleDTO | null>(null)

  // Load locations when component mounts
  useEffect(() => {
    const loadLocations = async (): Promise<void> => {
      setIsLocationsLoading(true)
      try {
        const data = await locationService.getAllLocations()
        setLocations(data)
      } catch (error) {
        console.error('Failed to load locations:', error)
        notifyService.error('Failed to load locations')
        setWorkflowStatus('error')
      } finally {
        setIsLocationsLoading(false)
      }
    }

    loadLocations()

    // Start workflow by showing location selector
    setLocationSelectorOpen(true)
    setWorkflowStatus('selecting_location')
  }, [])

  // Load inventory for the selected location
  useEffect(() => {
    if (!selectedLocation) return

    const loadLocationInventory = async (): Promise<void> => {
      setIsInventoryLoading(true)
      try {
        // In a real app, this would call an API endpoint to get location inventory
        const inventory = await locationService.getLocationInventory(selectedLocation.id!)

        // Convert inventory items to StockItemDTO array
        const stockItems = inventory.map((item) => ({
          ...item.stockItem,
          quantity: item.quantity // Use location-specific quantity
        }))

        setLocationInventory(stockItems)

        // Continue workflow
        setWorkflowStatus('selecting_products')
        setNewSaleDialogOpen(true)
      } catch (error) {
        console.error('Failed to load location inventory:', error)
        notifyService.error('Failed to load inventory for selected location')
        setWorkflowStatus('error')
      } finally {
        setIsInventoryLoading(false)
      }
    }

    loadLocationInventory()
  }, [selectedLocation])

  // Handle location selection
  const handleLocationSelect = (locationId: string): void => {
    const location = locations.find((loc) => loc.id === locationId)
    if (location) {
      setSelectedLocation(location)
      setLocationSelectorOpen(false)
      notifyService.success(`Selected location: ${location.name}`)
    }
  }

  // Handle sale creation
  const handleCreateSale = async (saleData: {
    customerName?: string
    customerPhone?: string
    locationId: string
    items: { stockItemId: string; quantity: number; price: number }[]
  }): Promise<void> => {
    setWorkflowStatus('processing')

    try {
      // Call the API to create the sale
      const newSale = await saleService.createSale({
        customerName: saleData.customerName,
        customerPhone: saleData.customerPhone,
        locationId: saleData.locationId,
        items: saleData.items.map((item) => ({
          stockItemId: item.stockItemId,
          quantity: item.quantity
        }))
      })

      // Close the sale dialog
      setNewSaleDialogOpen(false)

      // Set success state
      setCompletedSale(newSale)
      setWorkflowStatus('completed')

      // Show success message
      notifyService.success('Sale created successfully', {
        duration: 5000 // Show for longer
      })

      // Navigate to sales page after a delay
      setTimeout(() => {
        navigate('/sales')
      }, 1500)
    } catch (error) {
      console.error('Failed to create sale:', error)
      notifyService.error('Failed to create sale')
      setWorkflowStatus('error')
    }
  }

  // Handle cancellation
  const handleCancel = (): void => {
    // Ask for confirmation if we're in the middle of creating a sale
    if (workflowStatus === 'selecting_products') {
      if (window.confirm('Are you sure you want to cancel this sale?')) {
        navigate('/sales')
      }
    } else {
      navigate('/sales')
    }
  }

  // Render UI based on workflow status
  return (
    <div>
      {/* Location Selector Dialog */}
      <LocationSelectorDialog
        isOpen={locationSelectorOpen}
        onClose={handleCancel}
        onSelect={handleLocationSelect}
        locations={locations}
        isLoading={isLocationsLoading}
        title="Select Sale Location"
      />

      {/* New Sale Dialog */}
      {selectedLocation && (
        <NewSaleDialog
          isOpen={newSaleDialogOpen}
          onClose={handleCancel}
          onSave={handleCreateSale}
          preselectedLocationId={selectedLocation.id}
          availableItems={locationInventory}
          isLoading={isInventoryLoading}
        />
      )}

      {/* Loading or error state */}
      {(workflowStatus === 'processing' || workflowStatus === 'error') &&
        !newSaleDialogOpen &&
        !locationSelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center">
              {workflowStatus === 'processing' ? (
                <>
                  <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-xl font-medium">Processing sale...</p>
                </>
              ) : (
                <>
                  <div className="size-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-10 text-red-600"
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
                  </div>
                  <p className="mt-4 text-xl font-medium">An error occurred</p>
                  <button onClick={() => navigate('/sales')} className="mt-4 btn btn-primary">
                    Return to Sales
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      {/* Success state */}
      {workflowStatus === 'completed' && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
            <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-10 text-green-600"
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
            </div>
            <p className="mt-4 text-xl font-medium">Sale Completed!</p>
            <p className="mt-2 text-gray-600">
              Sale reference: <span className="font-medium">{completedSale.reference}</span>
            </p>
            <p className="mt-1 text-gray-600">
              Total: <span className="font-medium">${completedSale.total?.toFixed(2)}</span>
            </p>
            <div className="mt-6 flex space-x-2 justify-center">
              <button onClick={() => navigate('/sales')} className="btn btn-outline">
                View All Sales
              </button>
              <button
                onClick={() => {
                  notifyService.info('Printing receipt...')
                  // In a real app, this would trigger receipt printing
                }}
                className="btn btn-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-5 mr-1"
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
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesFlow
