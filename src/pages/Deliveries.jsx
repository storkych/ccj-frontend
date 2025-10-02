import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDeliveries } from '../api/deliveries.js'
import { getObjects } from '../api/api.js'
import { useAuth } from '../auth/AuthContext'

export default function Deliveries() {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [objects, setObjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTodayOnly, setShowTodayOnly] = useState(true)
  const [selectedObject, setSelectedObject] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => {
    loadData()
  }, [showTodayOnly, selectedObject, selectedStatus])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Загружаем объекты, если еще не загружены
      let currentObjects = objects
      if (objects.length === 0) {
        const objectsData = await getObjects()
        currentObjects = objectsData.items || []
        setObjects(currentObjects)
      }
      
      // Загружаем поставки с фильтрами
      const params = {}
      if (showTodayOnly) {
        params.today = true
      }
      if (selectedObject) {
        params.object_id = selectedObject
      }
      if (selectedStatus) {
        params.status = selectedStatus
      }
      
      const data = await getDeliveries(params)
      const deliveriesWithObjects = (data.items || []).map(delivery => {
        const objectData = currentObjects.find(obj => obj.id === delivery.object)
        return {
          ...delivery,
          objectData
        }
      })
      
      setDeliveries(deliveriesWithObjects)
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      alert('Ошибка загрузки данных')
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
      {/* Заголовок */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--text)'
        }}>
          📦 Поставки
        </h1>
      </div>

      {/* Блок фильтров */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text)',
            marginRight: '8px'
          }}>
            🔍 Фильтры:
          </div>

          {/* Фильтр по объекту */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
              Объект:
            </label>
            <select
              value={selectedObject}
              onChange={(e) => setSelectedObject(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--panel)',
                color: 'var(--text)',
                fontSize: '14px',
                minWidth: '120px'
              }}
            >
          <option value="">Все объекты</option>
              {objects.map(obj => (
                <option key={obj.id} value={obj.id}>{obj.name}</option>
              ))}
            </select>
          </div>

          {/* Фильтр по статусу */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
              Статус:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--panel)',
                color: 'var(--text)',
                fontSize: '14px',
                minWidth: '120px'
              }}
            >
              <option value="">Все статусы</option>
              <option value="scheduled">Запланировано</option>
              <option value="pending">Ожидает</option>
              <option value="in_transit">В пути</option>
              <option value="delivered">Доставлено</option>
              <option value="received">Принято прорабом</option>
              <option value="in_lab">В лаборатории</option>
              <option value="accepted">Принято ССК</option>
              <option value="rejected">Отклонено</option>
        </select>
          </div>

          {/* Чекбокс "Только сегодняшние" */}
          {user?.role === 'foreman' && (
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
          )}

          {/* Кнопка сброса фильтров */}
          {(selectedObject || selectedStatus || showTodayOnly) && (
            <button
              onClick={() => {
                setSelectedObject('')
                setSelectedStatus('')
                setShowTodayOnly(false)
              }}
              style={{
                padding: '6px 12px',
                background: 'var(--muted)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ✕ Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Список поставок */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>

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
                    {/* Основная сетка: левая - информация, правая - статус */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '20px',
                      alignItems: 'start'
                    }}>
                      {/* Левая колонка - основная информация */}
                      <div>
                        {/* Заголовок: название объекта и дата */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '16px',
                          marginBottom: '6px',
                          flexWrap: 'wrap'
                        }}>
                          {delivery.objectData && (
                            <h3 style={{
                              margin: 0,
                              fontSize: '18px',
                              fontWeight: '700',
                              color: 'var(--text)'
                            }}>
                              {delivery.objectData.name}
                            </h3>
                          )}
                          
                          {delivery.delivery_date && (
                            <div style={{
                              fontSize: '14px',
                              color: 'var(--muted)',
                              fontWeight: '500'
                            }}>
                              {new Date(delivery.delivery_date).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                          )}
                        </div>
                        
                        {/* Адрес */}
                        {delivery.objectData?.address && (
                          <div style={{
                            fontSize: '14px',
                            color: 'var(--muted)',
                            marginBottom: '12px'
                          }}>
                            {delivery.objectData.address}
                          </div>
                        )}
                        
                        {/* Описание */}
                        {delivery.description && (
                          <p style={{
                            margin: '0 0 12px 0',
                            color: 'var(--text)',
                            fontSize: '14px',
                            lineHeight: '1.5'
                          }}>
                            {delivery.description.length > 150 ? 
                              `${delivery.description.substring(0, 150)}...` : 
                              delivery.description
                            }
                          </p>
                        )}

                        {/* Дата создания если нет даты доставки */}
                        {!delivery.delivery_date && (
                          <div style={{
                            fontSize: '13px',
                            color: 'var(--muted)'
                          }}>
                            Создано: {new Date(delivery.created_at).toLocaleDateString('ru-RU')}
                          </div>
                        )}
                      </div>

                      {/* Правая колонка - статус и номер */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '8px'
                      }}>
                        {/* Статус */}
                        <span style={{
                          background: statusInfo.color,
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                        }}>
                          {statusInfo.label}
                        </span>
                        
                        {/* Номер поставки */}
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--muted)',
                          fontWeight: '500'
                        }}>
                          #{delivery.id}
                        </div>
                      </div>
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