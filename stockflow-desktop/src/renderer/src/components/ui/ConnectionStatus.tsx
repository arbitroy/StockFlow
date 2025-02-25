import { motion, AnimatePresence } from 'framer-motion'
import PropTypes from 'prop-types'

interface ConnectionStatusProps {
  isConnected: boolean
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <AnimatePresence>
      {!isConnected && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-secondary-light border-b border-secondary text-primary-dark font-medium text-sm px-4 py-2 text-center overflow-hidden"
        >
          ⚠️ Connection to server lost. Data will be saved locally and synced when connection is
          restored.
        </motion.div>
      )}
    </AnimatePresence>
  )
}
ConnectionStatus.propTypes = {
  isConnected: PropTypes.bool.isRequired
}

export default ConnectionStatus
