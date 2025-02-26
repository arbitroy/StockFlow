import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import notifyService from '../../services/notification'

interface HeaderProps {
  toggleSidebar: () => void
  isSidebarOpen: boolean
}

const Header = ({ toggleSidebar, isSidebarOpen }: HeaderProps): JSX.Element => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const navigate = useNavigate()

  const handleQuickAction = (action: string): void => {
    switch (action) {
      case 'New Stock':
        navigate('/inventory?action=add')
        break
      case 'Quick Sale':
        navigate('/sales?action=new')
        break
      default:
        notifyService.info(`${action} action triggered`)
    }
  }

  return (
    <header className="h-16 flex items-center border-b border-gray-200 bg-surface z-10">
      <div className="flex items-center justify-between w-full px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-primary-dark hover:bg-gray-100 focus-visible:ring focus-visible:ring-primary-light transition-colors"
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isSidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          <h1 className="text-xl font-semibold text-primary-dark">StockFlow</h1>

          {/* Quick actions */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => handleQuickAction('New Stock')}
              className="px-3 py-1 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              New Stock
            </button>
            <button
              onClick={() => handleQuickAction('Quick Sale')}
              className="px-3 py-1 rounded-md bg-secondary text-white hover:bg-secondary-dark transition-colors"
            >
              Quick Sale
            </button>
          </div>
        </div>

        {/* Right side - User section */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 focus-visible:ring focus-visible:ring-primary-light rounded-md"
          >
            <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center">
              <span className="text-sm font-medium">AD</span>
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700">Admin</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-card py-1 z-10"
              >
                <a
                  href="#profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsDropdownOpen(false)
                    notifyService.info('Profile would open here')
                  }}
                >
                  Your Profile
                </a>
                <a
                  href="#settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsDropdownOpen(false)
                    navigate('/settings')
                  }}
                >
                  Settings
                </a>
                <div className="border-t border-gray-100"></div>
                <a
                  href="#signout"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsDropdownOpen(false)
                    notifyService.success('Signed out successfully')
                  }}
                >
                  Sign out
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

export default Header
