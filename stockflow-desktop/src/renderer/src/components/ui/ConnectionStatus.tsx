import { motion, AnimatePresence } from 'framer-motion'
import PropTypes from 'prop-types'
import syncService from '../../services/syncService'

interface ConnectionStatusProps {
  isConnected: boolean
  offlineCount?: number
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, offlineCount = 0 }) => {
  // Force sync offline changes
  const handleForceSyncClick = (): void => {
    if (isConnected && offlineCount > 0) {
      syncService.processQueue()
    }
  }

  return (
    <AnimatePresence>
      {!isConnected && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 font-medium text-sm px-4 py-2 flex justify-between items-center overflow-hidden"
        >
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5 mr-2 text-yellow-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Connection to server lost. Data will be saved locally and synced when connection is
              restored.
            </span>
          </div>
        </motion.div>
      )}

      {isConnected && offlineCount > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-indigo-50 border-b border-indigo-200 text-indigo-800 font-medium text-sm px-4 py-2 flex justify-between items-center overflow-hidden"
        >
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5 mr-2 text-indigo-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            <span>Connection restored. {offlineCount} changes are pending synchronization.</span>
          </div>
          <button
            onClick={handleForceSyncClick}
            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-3 py-1 rounded-md ml-4 text-xs transition-colors flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Sync Now
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

ConnectionStatus.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  offlineCount: PropTypes.number
}

export default ConnectionStatus
