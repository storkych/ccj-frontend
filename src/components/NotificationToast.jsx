import React, { useEffect } from 'react'

export default function NotificationToast({ notification, onClose }) {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification, onClose])

  if (!notification) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      background: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${notification.type === 'success' ? '#22c55e' : '#ef4444'}`,
      borderRadius: '8px',
      padding: '16px',
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'slideInUp 0.3s ease-out'
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: notification.type === 'success' ? '#22c55e' : '#ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {notification.type === 'success' ? '✓' : '✕'}
      </div>
      <div style={{
        flex: 1,
        color: notification.type === 'success' ? '#15803d' : '#dc2626',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {notification.message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: notification.type === 'success' ? '#15803d' : '#dc2626',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  )
}
