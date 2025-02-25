import toast, { ToastOptions } from 'react-hot-toast'

// Default toast options
const defaultOptions: ToastOptions = {
  duration: 3000,
  position: 'top-right'
}

/**
 * Notification service for providing feedback to users
 */
const notifyService = {
  /**
   * Show a success notification
   */
  success: (message: string, options?: ToastOptions): string => {
    return toast.success(message, {
      ...defaultOptions,
      ...options,
      className: 'toast-success',
      style: {
        background: '#219ebc',
        color: '#fff',
        borderRadius: '0.375rem'
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#219ebc'
      }
    })
  },

  /**
   * Show an error notification
   */
  error: (message: string, options?: ToastOptions): string => {
    return toast.error(message, {
      ...defaultOptions,
      ...options,
      duration: options?.duration || 4000, // Longer duration for errors by default
      className: 'toast-error',
      style: {
        background: '#e53e3e',
        color: '#fff',
        borderRadius: '0.375rem'
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#e53e3e'
      }
    })
  },

  /**
   * Show an information notification
   */
  info: (message: string, options?: ToastOptions): string => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      className: 'toast-info',
      style: {
        background: '#219ebc',
        color: '#fff',
        borderRadius: '0.375rem'
      },
      icon: 'ℹ️'
    })
  },

  /**
   * Show a warning notification
   */
  warning: (message: string, options?: ToastOptions): string => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      className: 'toast-warning',
      style: {
        background: '#ffb703',
        color: '#023047',
        borderRadius: '0.375rem'
      },
      icon: '⚠️'
    })
  },

  /**
   * Dismiss all notifications
   */
  dismissAll: (): void => {
    toast.dismiss()
  },

  /**
   * Show a loading notification that can be updated
   */
  loading: (
    message: string,
    options?: ToastOptions
  ): {
    success: (successMessage: string) => void
    error: (errorMessage: string) => void
    update: (updateMessage: string) => void
    dismiss: () => void
  } => {
    const toastId = toast.loading(message, {
      ...defaultOptions,
      ...options,
      className: 'toast-loading',
      duration: Infinity, // Loading toasts don't auto-dismiss
      style: {
        background: '#f8fafc',
        color: '#023047',
        borderRadius: '0.375rem'
      }
    })

    return {
      /**
       * Update the loading toast with success
       */
      success: (successMessage: string): void => {
        toast.success(successMessage, {
          id: toastId,
          ...defaultOptions,
          ...options,
          style: {
            background: '#219ebc',
            color: '#fff',
            borderRadius: '0.375rem'
          }
        })
      },

      /**
       * Update the loading toast with error
       */
      error: (errorMessage: string): void => {
        toast.error(errorMessage, {
          id: toastId,
          ...defaultOptions,
          ...options,
          style: {
            background: '#e53e3e',
            color: '#fff',
            borderRadius: '0.375rem'
          }
        })
      },

      /**
       * Update the loading toast with a custom message
       */
      update: (updateMessage: string): void => {
        toast.loading(updateMessage, {
          id: toastId
        })
      },

      /**
       * Dismiss the loading toast
       */
      dismiss: (): void => {
        toast.dismiss(toastId)
      }
    }
  },

  /**
   * Promise-based toast that shows loading, success, and error states
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error
      },
      {
        ...defaultOptions,
        ...options,
        style: {
          background: '#f8fafc',
          color: '#023047',
          borderRadius: '0.375rem'
        },
        success: {
          style: {
            background: '#219ebc',
            color: '#fff',
            borderRadius: '0.375rem'
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#219ebc'
          }
        },
        error: {
          style: {
            background: '#e53e3e',
            color: '#fff',
            borderRadius: '0.375rem'
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#e53e3e'
          }
        }
      }
    )
  },

  /**
   * Custom toast with specific icon and styling
   */
  custom: (message: string, options?: ToastOptions & { icon?: React.ReactNode }): string => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      style: {
        background: '#f8fafc',
        color: '#023047',
        borderRadius: '0.375rem',
        ...options?.style
      }
    })
  },

  /**
   * Create a persistent notification that requires user dismissal
   */
  persistent: (message: string, options?: ToastOptions): string => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      duration: Infinity,
      style: {
        background: '#f8fafc',
        color: '#023047',
        borderRadius: '0.375rem'
      }
    })
  }
}

export default notifyService
