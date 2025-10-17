import React from 'react'

export function TokenExpiredModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: 'var(--text)',
          marginBottom: '12px'
        }}>
          Сессия истекла
        </h3>
        <p style={{ 
          color: 'var(--muted)', 
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          Ваша сессия истекла по соображениям безопасности. 
          Необходимо войти в систему заново.
        </p>
        <button
          onClick={onClose}
          style={{
            background: 'var(--brand)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-1px)'
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = 'none'
          }}
        >
          Войти заново
        </button>
      </div>
    </div>
  )
}
