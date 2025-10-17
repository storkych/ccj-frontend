import { useState } from 'react'

export function useNotification() {
  const [notification, setNotification] = useState(null)

  const showSuccess = (message) => {
    setNotification({ type: 'success', message })
  }

  const showError = (message) => {
    setNotification({ type: 'error', message })
  }

  const hide = () => {
    setNotification(null)
  }

  return {
    notification,
    showSuccess,
    showError,
    hide
  }
}
