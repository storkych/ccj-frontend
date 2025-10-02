import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDeliveries } from '../api/deliveries.js'
import { useAuth } from '../auth/AuthContext'

export default function Deliveries() {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTodayOnly, setShowTodayOnly] = useState(true)

  useEffect(() => {
    loadDeliveries()
  }, [showTodayOnly])

  const loadDeliveries = async () => {
    try {
      setLoading(true)
      const params = {}
      if (showTodayOnly) {
        params.today = true
      }
      const data = await getDeliveries(params)
      setDeliveries(data.items || [])
    } catch (error) {
      console.error('Ошибка загрузки поставок:', error)
      alert('Ошибка загрузки поставок')
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'scheduled':
        return { label: 'Запланировано', color: '#6b7280' }
      case 'pending':
        return { label: 'Ожидает', color: '#f59e0b' }
      case 'in_transit':
        return { label: 'В пути', color: '#3b82f6' }
      case 'delivered':
        return { label: 'Доставлено', color: '#10b981' }
      case 'received':
        return { label: 'Принято прорабом', color: '#059669' }
      case 'in_lab':
        return { label: 'В лаборатории', color: '#8b5cf6' }
      case 'accepted':
        return { label: 'Принято ССК', color: '#16a34a' }
      case 'rejected':
        return { label: 'Отклонено', color: '#ef4444' }
      default:
        return { label: status, color: '#6b7280' }
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--border)',
            borderTop: '4px solid var(--brand)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--text)'
          }}>
            📦 Поставки
          </h1>

          {user?.role === 'foreman' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: 'var(--text)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={showTodayOnly}
                  onChange={(e) => setShowTodayOnly(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px'
                  }}
                />
                Только сегодняшние
              </label>
            </div>
          )}
        </div>

        {deliveries.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--muted)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>
              {showTodayOnly ? 'Нет поставок на сегодня' : 'Поставки не найдены'}
            </div>
            <div style={{ fontSize: '14px' }}>
              {showTodayOnly ? 'Попробуйте снять фильтр "Только сегодняшние"' : 'Поставки появятся здесь когда будут созданы'}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '16px'
          }}>
            {deliveries.map(delivery => {
              const statusInfo = getStatusInfo(delivery.status)
              
              return (
                <Link
                  key={delivery.id}
                  to={`/deliveries/${delivery.id}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  <div style={{
                    background: 'var(--bg-light)',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${statusInfo.color}`,
                    borderRadius: '12px',
                    padding: '20px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '8px'
                        }}>
                          <div style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            background: `${statusInfo.color}15`,
                            color: statusInfo.color,
                            fontSize: '12px',
                            fontWeight: '600',
                            border: `1px solid ${statusInfo.color}30`
                          }}>
                            {statusInfo.label}
                          </div>
                          
                          {delivery.object && (
                            <div style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              background: 'var(--brand)15',
                              color: 'var(--brand)',
                              fontSize: '12px',
                              fontWeight: '600',
                              border: '1px solid var(--brand)30'
                            }}>
                              📍 {delivery.object.name}
                            </div>
                          )}
                        </div>
                        
                        <h3 style={{
                          margin: '0 0 8px 0',
                          fontSize: '18px',
                          fontWeight: '600',
                          color: 'var(--text)'
                        }}>
                          {delivery.title || `Поставка #${delivery.id}`}
                        </h3>
                        
                        {delivery.description && (
                          <p style={{
                            margin: '0 0 12px 0',
                            color: 'var(--text)',
                            fontSize: '14px',
                            lineHeight: '1.4'
                          }}>
                            {delivery.description.length > 150 ? 
                              `${delivery.description.substring(0, 150)}...` : 
                              delivery.description
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '13px',
                      color: 'var(--muted)',
                      alignItems: 'center'
                    }}>
                      {delivery.expected_date && (
                        <span>📅 Ожидается: {new Date(delivery.expected_date).toLocaleDateString('ru-RU')}</span>
                      )}
                      {delivery.supplier && (
                        <span>🏢 {delivery.supplier}</span>
                      )}
                      {delivery.items_count && (
                        <span>📦 Позиций: {delivery.items_count}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}