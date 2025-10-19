import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDeliveries } from '../api/deliveries.js'
import { getObjects } from '../api/api.js'
import DeliveryActionModal from '../components/DeliveryActionModal.jsx'

export default function DeliveriesSSK() {
  const [deliveries, setDeliveries] = useState([])
  const [objects, setObjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedObject, setSelectedObject] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [selectedAction, setSelectedAction] = useState(null)

  useEffect(() => {
    loadData()
  }, [selectedObject])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Загружаем объекты для фильтра
      const objectsData = await getObjects()
      setObjects(objectsData.items || [])
      
      // Загружаем все поставки
      const params = {}
      if (selectedObject) {
        params.object_id = selectedObject
      }
      
      const deliveriesData = await getDeliveries(params)
      setDeliveries(deliveriesData.items || [])
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      alert('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (delivery, action) => {
    setSelectedDelivery(delivery)
    setSelectedAction(action)
    setModalOpen(true)
  }

  const handleActionSuccess = (deliveryId, action) => {
    // Обновляем статус поставки в списке
    setDeliveries(prev => prev.map(d => {
      if (d.id === deliveryId) {
        let newStatus = d.status
        switch (action) {
          case 'accept':
            newStatus = 'accepted'
            break
          case 'reject':
            newStatus = 'rejected'
            break
          case 'send_to_lab':
            newStatus = 'sent_to_lab'
            break
        }
        return { ...d, status: newStatus }
      }
      return d
    }))
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
        return { label: 'Отклонено ССК', color: '#ef4444' }
      case 'sent_to_lab':
        return { label: 'Отправлено в лабораторию', color: '#8b5cf6' }
      default:
        return { label: status, color: '#6b7280' }
    }
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
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: '20px'
        }}>

          {/* Фильтр по объекту */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <select
              value={selectedObject}
              onChange={(e) => setSelectedObject(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--panel)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            >
              <option value="">Все объекты</option>
              {objects.map(obj => (
                <option key={obj.id} value={obj.id}>
                  {obj.name}
                </option>
              ))}
            </select>
          </div>
        </div>


        {loading ? (
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
        ) : deliveries.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--muted)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>
              Нет поставок
            </div>
            <div style={{ fontSize: '14px' }}>
              Поставки появятся здесь когда будут доставлены
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '16px'
          }}>
            {deliveries.map(delivery => {
              const statusInfo = getStatusInfo(delivery.status)
              const canSendToLab = delivery.status === 'delivered'
              const canAccept = delivery.status === 'delivered' || delivery.status === 'in_lab'
              const canReject = delivery.status === 'delivered' || delivery.status === 'in_lab'
              
              return (
                <div
                  key={delivery.id}
                  style={{
                    background: 'var(--bg-light)',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${statusInfo.color}`,
                    borderRadius: '12px',
                    padding: '20px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
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
                            {delivery.object.name}
                          </div>
                        )}
                      </div>
                      
                      <Link
                        to={`/deliveries/${delivery.id}`}
                        style={{
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <h3 style={{
                          margin: '0 0 8px 0',
                          fontSize: '18px',
                          fontWeight: '600',
                          color: 'var(--text)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = 'var(--brand)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = 'var(--text)'
                        }}>
                          {delivery.title || `Поставка #${delivery.id}`}
                        </h3>
                      </Link>
                      
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

                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        fontSize: '13px',
                        color: 'var(--muted)',
                        alignItems: 'center'
                      }}>
                        {delivery.expected_date && (
                          <span>Ожидается: {new Date(delivery.expected_date).toLocaleDateString('ru-RU')}</span>
                        )}
                        {delivery.supplier && (
                          <span>🏢 {delivery.supplier}</span>
                        )}
                        {delivery.items_count && (
                          <span>Позиций: {delivery.items_count}</span>
                        )}
                      </div>
                    </div>

                    {/* Кнопки действий */}
                    {(canSendToLab || canAccept || canReject) && (
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginLeft: '16px',
                        flexWrap: 'wrap'
                      }}>
                        {canSendToLab && (
                          <button
                            onClick={() => handleAction(delivery, 'send_to_lab')}
                            style={{
                              padding: '8px 16px',
                              background: '#8b5cf6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#7c3aed'
                              e.target.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#8b5cf6'
                              e.target.style.transform = 'translateY(0)'
                            }}
                          >
                            В лабораторию
                          </button>
                        )}
                        
                        {canAccept && (
                          <button
                            onClick={() => handleAction(delivery, 'accept')}
                            style={{
                              padding: '8px 16px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#059669'
                              e.target.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#10b981'
                              e.target.style.transform = 'translateY(0)'
                            }}
                          >
                            Принять
                          </button>
                        )}

                        {canReject && (
                          <button
                            onClick={() => handleAction(delivery, 'reject')}
                            style={{
                              padding: '8px 16px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#dc2626'
                              e.target.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#ef4444'
                              e.target.style.transform = 'translateY(0)'
                            }}
                          >
                            Отклонить
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Модальное окно для действий */}
      <DeliveryActionModal
        delivery={selectedDelivery}
        action={selectedAction}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedDelivery(null)
          setSelectedAction(null)
        }}
        onSuccess={handleActionSuccess}
      />
    </div>
  )
}
