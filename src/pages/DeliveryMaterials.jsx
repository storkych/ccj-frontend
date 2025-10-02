import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getDelivery, confirmDeliveryMaterials } from '../api/deliveries.js'
import { useAuth } from '../auth/AuthContext'

export default function DeliveryMaterials() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [delivery, setDelivery] = useState(null)
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadDelivery()
    // Получаем данные о материалах из sessionStorage (переданные с предыдущей страницы)
    const materialsData = sessionStorage.getItem(`delivery_materials_${id}`)
    if (materialsData) {
      try {
        const parsed = JSON.parse(materialsData)
        if (parsed.results && Array.isArray(parsed.results)) {
          setMaterials(parsed.results.map((result, index) => ({
            id: index,
            name: result.data?.material_name || '',
            quantity: result.data?.quantity || '',
            size: result.data?.size || '',
            volume: result.data?.volume || '',
            weight: result.data?.weight || result.data?.netto || '',
            unit: result.data?.unit || '',
            supplier: result.data?.supplier || '',
            originalData: result.data
          })))
        }
      } catch (error) {
        console.error('Ошибка парсинга данных материалов:', error)
      }
    }
  }, [id])

  const loadDelivery = async () => {
    try {
      setLoading(true)
      const data = await getDelivery(id)
      setDelivery(data)
    } catch (error) {
      console.error('Ошибка загрузки поставки:', error)
      alert('Ошибка загрузки поставки')
    } finally {
      setLoading(false)
    }
  }

  const updateMaterial = (materialId, field, value) => {
    setMaterials(prev => prev.map(material => 
      material.id === materialId 
        ? { ...material, [field]: value }
        : material
    ))
  }

  const handleConfirm = async () => {
    if (materials.length === 0) {
      alert('Нет материалов для подтверждения')
      return
    }

    try {
      setSubmitting(true)
      
      const materialsData = {
        materials: materials.map(material => ({
          name: material.name,
          quantity: material.quantity,
          size: material.size,
          volume: material.volume,
          weight: material.weight,
          unit: material.unit,
          supplier: material.supplier
        }))
      }

      await confirmDeliveryMaterials(id, materialsData)
      
      // Очищаем временные данные
      sessionStorage.removeItem(`delivery_materials_${id}`)
      
      alert('Материалы успешно подтверждены!')
      navigate(`/deliveries/${id}`)
    } catch (error) {
      console.error('Ошибка подтверждения материалов:', error)
      alert('Ошибка при подтверждении материалов')
    } finally {
      setSubmitting(false)
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

  return (
    <div className="page">
      {/* Навигация */}
      <div style={{ marginBottom: '20px' }}>
        <Link 
          to={`/deliveries/${id}`}
          style={{
            color: 'var(--brand)',
            textDecoration: 'none',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          ← Назад к поставке
        </Link>
      </div>

      {/* Заголовок */}
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
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--text)'
            }}>
              🔍 Проверка материалов
            </h1>
            <p style={{
              margin: 0,
              color: 'var(--muted)',
              fontSize: '16px'
            }}>
              {delivery.title || `Поставка #${delivery.id}`}
            </p>
          </div>

          <button
            onClick={handleConfirm}
            disabled={submitting || materials.length === 0}
            style={{
              padding: '12px 24px',
              background: 'var(--brand)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting || materials.length === 0 ? 'not-allowed' : 'pointer',
              opacity: submitting || materials.length === 0 ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!submitting && materials.length > 0) {
                e.target.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting && materials.length > 0) {
                e.target.style.transform = 'translateY(0)'
              }
            }}
          >
            {submitting ? '🔄 Подтверждение...' : '✅ Подтвердить материалы'}
          </button>
        </div>
      </div>

      {/* Материалы */}
      {materials.length === 0 ? (
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <div style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text)' }}>
            Нет данных о материалах
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
            Данные о материалах должны быть получены после обработки фотографий
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '20px'
        }}>
          {materials.map((material, index) => (
            <div
              key={material.id}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--brand)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {index + 1}
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'var(--text)'
                }}>
                  Материал #{index + 1}
                </h3>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--muted)',
                    marginBottom: '6px'
                  }}>
                    Наименование материала
                  </label>
                  <input
                    type="text"
                    value={material.name}
                    onChange={(e) => updateMaterial(material.id, 'name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'var(--panel)',
                      color: 'var(--text)'
                    }}
                    placeholder="Введите наименование материала"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--muted)',
                    marginBottom: '6px'
                  }}>
                    Количество
                  </label>
                  <input
                    type="text"
                    value={material.quantity}
                    onChange={(e) => updateMaterial(material.id, 'quantity', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'var(--panel)',
                      color: 'var(--text)'
                    }}
                    placeholder="Количество"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--muted)',
                    marginBottom: '6px'
                  }}>
                    Размер
                  </label>
                  <input
                    type="text"
                    value={material.size}
                    onChange={(e) => updateMaterial(material.id, 'size', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'var(--panel)',
                      color: 'var(--text)'
                    }}
                    placeholder="Размер"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--muted)',
                    marginBottom: '6px'
                  }}>
                    Объем
                  </label>
                  <input
                    type="text"
                    value={material.volume}
                    onChange={(e) => updateMaterial(material.id, 'volume', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'var(--panel)',
                      color: 'var(--text)'
                    }}
                    placeholder="Объем"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--muted)',
                    marginBottom: '6px'
                  }}>
                    Вес (Нетто)
                  </label>
                  <input
                    type="text"
                    value={material.weight}
                    onChange={(e) => updateMaterial(material.id, 'weight', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'var(--panel)',
                      color: 'var(--text)'
                    }}
                    placeholder="Вес"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--muted)',
                    marginBottom: '6px'
                  }}>
                    Единица измерения
                  </label>
                  <input
                    type="text"
                    value={material.unit}
                    onChange={(e) => updateMaterial(material.id, 'unit', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'var(--panel)',
                      color: 'var(--text)'
                    }}
                    placeholder="Единица измерения"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--muted)',
                    marginBottom: '6px'
                  }}>
                    Поставщик
                  </label>
                  <input
                    type="text"
                    value={material.supplier}
                    onChange={(e) => updateMaterial(material.id, 'supplier', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'var(--panel)',
                      color: 'var(--text)'
                    }}
                    placeholder="Поставщик"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
