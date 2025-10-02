import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getDelivery, attachDeliveryPhotos, sendDeliveryToLab, acceptDelivery, receiveDelivery, extractTextFromImage } from '../api/deliveries.js'
import { getObjects } from '../api/api.js'
import { useAuth } from '../auth/AuthContext'
import ReceiveDeliveryModal from '../components/ReceiveDeliveryModal.jsx'

export default function DeliveryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [delivery, setDelivery] = useState(null)
  const [objects, setObjects] = useState([])
  const [currentObject, setCurrentObject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [processingCV, setProcessingCV] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)

  useEffect(() => {
    loadDelivery()
  }, [id])

  const loadDelivery = async () => {
    try {
      setLoading(true)
      
      // Загружаем данные поставки
      const data = await getDelivery(id)
      setDelivery(data)
      
      // Загружаем объекты, если еще не загружены
      if (objects.length === 0) {
        const objectsData = await getObjects()
        setObjects(objectsData.items || [])
        
        // Находим текущий объект
        if (data.object && objectsData.items) {
          const foundObject = objectsData.items.find(obj => obj.id === data.object)
          setCurrentObject(foundObject)
        }
      } else {
        // Находим текущий объект из уже загруженных
        if (data.object) {
          const foundObject = objects.find(obj => obj.id === data.object)
          setCurrentObject(foundObject)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки поставки:', error)
      alert('Ошибка загрузки поставки')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files)
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPhotos(prev => [...prev, {
            file,
            preview: e.target.result,
            name: file.name
          }])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmitPhotos = async () => {
    if (photos.length === 0) {
      alert('Выберите фотографии для загрузки')
      return
    }

    try {
      setUploading(true)
      
      // Конвертируем фотографии в base64
      const photoData = await Promise.all(
        photos.map(photo => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => {
              resolve(e.target.result) // base64 строка
            }
            reader.readAsDataURL(photo.file)
          })
        })
      )

      // Прикрепляем фотографии к поставке
      await attachDeliveryPhotos(id, photoData)
      
      // Обрабатываем первую фотографию через CV API
      if (photoData.length > 0) {
        setProcessingCV(true)
        try {
          const cvResult = await extractTextFromImage(
            photoData[0], 
            delivery?.object, 
            parseInt(id)
          )
          
          // Сохраняем результат CV обработки в sessionStorage
          sessionStorage.setItem(`delivery_materials_${id}`, JSON.stringify(cvResult))
          
          // Переходим на страницу подтверждения материалов
          navigate(`/deliveries/${id}/materials`)
          return
        } catch (cvError) {
          console.error('Ошибка обработки CV API:', cvError)
          alert('Фотографии загружены, но произошла ошибка при обработке накладной. Попробуйте позже.')
        } finally {
          setProcessingCV(false)
        }
      }
      
      alert('Фотографии успешно прикреплены!')
      setPhotos([])
      loadDelivery() // Перезагружаем данные
    } catch (error) {
      console.error('Ошибка загрузки фотографий:', error)
      alert('Ошибка при загрузке фотографий')
    } finally {
      setUploading(false)
    }
  }

  const handleSendToLab = async () => {
    if (!confirm('Отправить поставку в лабораторию?')) return

    try {
      setActionLoading(true)
      await sendDeliveryToLab(id)
      alert('Поставка отправлена в лабораторию')
      loadDelivery()
    } catch (error) {
      console.error('Ошибка отправки в лабораторию:', error)
      alert('Ошибка при отправке в лабораторию')
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenReceiveModal = () => {
    setShowReceiveModal(true)
  }

  const handleReceiveSuccess = (action) => {
    setShowReceiveModal(false)
    if (action === 'materials') {
      navigate(`/deliveries/${id}/materials`)
    } else {
      loadDelivery()
    }
  }

  const handleAcceptDelivery = async () => {
    if (!confirm('Принять поставку?')) return

    try {
      setActionLoading(true)
      await acceptDelivery(id)
      alert('Поставка принята')
      loadDelivery()
    } catch (error) {
      console.error('Ошибка принятия поставки:', error)
      alert('Ошибка при принятии поставки')
    } finally {
      setActionLoading(false)
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

  if (!delivery) {
    return (
      <div className="page">
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--muted)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <div style={{ fontSize: '18px' }}>Поставка не найдена</div>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(delivery.status)
  // Прораб может прикреплять фото и принимать доставку
  const canAttachPhotos = user?.role === 'foreman' && !['accepted', 'rejected'].includes(delivery.status)
  const canAcceptDelivery = user?.role === 'foreman' && !['accepted', 'rejected'].includes(delivery.status)
  
  // ССК работает с уже принятыми прорабом поставками
  const canSendToLab = user?.role === 'ssk' && delivery.status === 'delivered'
  const canAcceptBySSK = user?.role === 'ssk' && (delivery.status === 'in_lab' || delivery.status === 'delivered')

  // Отладочная информация
  console.log('DeliveryDetail Debug:', {
    userRole: user?.role,
    deliveryStatus: delivery.status,
    canAttachPhotos,
    canAcceptDelivery,
    canSendToLab,
    canAcceptBySSK
  })

  return (
    <div className="page">
      {/* Навигация */}
      <div style={{ marginBottom: '20px' }}>
        <Link 
          to="/deliveries" 
          style={{
            color: 'var(--brand)',
            textDecoration: 'none',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          ← Назад к поставкам
        </Link>
      </div>

      {/* Основная информация */}
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
          alignItems: 'flex-start',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                padding: '6px 16px',
                borderRadius: '20px',
                background: `${statusInfo.color}15`,
                color: statusInfo.color,
                fontSize: '14px',
                fontWeight: '600',
                border: `1px solid ${statusInfo.color}30`
              }}>
                {statusInfo.label}
              </div>
              
              {currentObject && (
                <div style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  background: 'var(--brand)15',
                  color: 'var(--brand)',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: '1px solid var(--brand)30'
                }}>
                  📍 {currentObject.name}
                </div>
              )}
            </div>
            
            <h1 style={{
              margin: '0 0 12px 0',
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--text)'
            }}>
              {delivery.title || `Поставка #${delivery.id}`}
            </h1>
            
            {delivery.description && (
              <p style={{
                margin: '0 0 16px 0',
                color: 'var(--text)',
                fontSize: '16px',
                lineHeight: '1.5'
              }}>
                {delivery.description}
              </p>
            )}
          </div>

          {/* Кнопки действий для прораба */}
          {canAcceptDelivery && user?.role === 'foreman' && (
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={handleOpenReceiveModal}
                disabled={actionLoading}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!actionLoading) {
                    e.target.style.background = '#059669'
                    e.target.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!actionLoading) {
                    e.target.style.background = '#10b981'
                    e.target.style.transform = 'translateY(0)'
                  }
                }}
              >
                📦 Принять доставку
              </button>
            </div>
          )}

          {/* Кнопки действий для ССК */}
          {(canSendToLab || canAcceptBySSK) && user?.role === 'ssk' && (
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              {canSendToLab && (
                <button
                  onClick={handleSendToLab}
                  disabled={actionLoading}
                  style={{
                    padding: '12px 24px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!actionLoading) {
                      e.target.style.background = '#7c3aed'
                      e.target.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!actionLoading) {
                      e.target.style.background = '#8b5cf6'
                      e.target.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  🧪 В лабораторию
                </button>
              )}
              
              {canAcceptBySSK && (
                <button
                  onClick={handleAcceptDelivery}
                  disabled={actionLoading}
                  style={{
                    padding: '12px 24px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!actionLoading) {
                      e.target.style.background = '#059669'
                      e.target.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!actionLoading) {
                      e.target.style.background = '#10b981'
                      e.target.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  ✅ Принять
                </button>
              )}
            </div>
          )}
        </div>

        {/* Метаданные */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          padding: '16px',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border)'
        }}>
          {delivery.expected_date && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                Ожидаемая дата
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '500' }}>
                📅 {new Date(delivery.expected_date).toLocaleDateString('ru-RU')}
              </div>
            </div>
          )}
          
          {delivery.supplier && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                Поставщик
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '500' }}>
                🏢 {delivery.supplier}
              </div>
            </div>
          )}
          
          {delivery.items_count && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                Количество позиций
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '500' }}>
                📦 {delivery.items_count}
              </div>
            </div>
          )}
          
          {currentObject && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                Объект
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '500' }}>
                🏗️ {currentObject.name}
              </div>
            </div>
          )}
          
          {delivery.created_at && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                Создано
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '500' }}>
                📅 {new Date(delivery.created_at).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Прикрепленные фотографии накладных */}
      {delivery.invoice_photos && delivery.invoice_photos.length > 0 && (
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text)'
          }}>
            📄 Фотографии накладных
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {delivery.invoice_photos.map((photo, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => window.open(photo, '_blank')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <img
                  src={photo}
                  alt={`Накладная ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentElement.innerHTML = `
                      <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 150px;
                        color: var(--muted);
                        font-size: 14px;
                      ">
                        📄 Фото недоступно
                      </div>
                    `
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Отладочная информация для прораба */}
      {user?.role === 'foreman' && (
        <div style={{
          background: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <strong>Debug Info (Прораб):</strong><br/>
          Роль: {user?.role}<br/>
          Статус поставки: {delivery.status}<br/>
          Object ID: {delivery?.object || 'Отсутствует'}<br/>
          Object Name: {currentObject?.name || 'Не загружен'}<br/>
          Можно прикреплять фото: {canAttachPhotos ? 'Да' : 'Нет'}<br/>
          Можно принять доставку: {canAcceptDelivery ? 'Да' : 'Нет'}<br/>
          Запрещенные статусы: accepted, rejected
        </div>
      )}

      {/* Блок для прикрепления фотографий (только для прораба) */}
      {canAttachPhotos && (
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text)'
          }}>
            📷 Прикрепить фотографии накладных
          </h2>
          
          <div style={{ marginBottom: '16px' }}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
              id="photo-upload"
            />
            
            <label
              htmlFor="photo-upload"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'var(--text)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--border)'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--bg-secondary)'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              📷 Выбрать фотографии
            </label>
          </div>

          {/* Превью загруженных фотографий */}
          {photos.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {photos.map((photo, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <img
                    src={photo.preview}
                    alt={`Фото ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '4px',
                    right: '4px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 4px',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {photo.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <button
              onClick={handleSubmitPhotos}
              disabled={uploading || processingCV}
              style={{
                padding: '12px 24px',
                background: 'var(--brand)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: uploading || processingCV ? 'not-allowed' : 'pointer',
                opacity: uploading || processingCV ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!uploading && !processingCV) {
                  e.target.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!uploading && !processingCV) {
                  e.target.style.transform = 'translateY(0)'
                }
              }}
            >
              {processingCV ? '🔍 Обработка накладной...' : 
               uploading ? '📤 Загрузка...' : 
               '📤 Прикрепить фотографии'}
            </button>
          )}
        </div>
      )}

      {/* Модальное окно принятия доставки */}
      <ReceiveDeliveryModal
        open={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        delivery={delivery}
        onSuccess={handleReceiveSuccess}
      />
    </div>
  )
}
