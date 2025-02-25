import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <div className="mt-4 text-primary-dark">
          <h2 className="text-3xl font-semibold">Page Not Found</h2>
          <p className="mt-2 text-lg text-gray-600">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="mt-8">
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default NotFound
