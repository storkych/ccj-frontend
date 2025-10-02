
import React, { useEffect, useState } from 'react'
import { getSSKDailyChecklists, getObjects } from '../api/api.js'
import DailyChecklistModal from '../components/DailyChecklistModal.jsx'

export default function SSKChecklists(){
  const [checklists, setChecklists] = useState([])
  const [objects, setObjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedObject, setSelectedObject] = useState('')
  const [statusFilter, setStatusFilter] = useState('submitted')
  const [selectedChecklist, setSelectedChecklist] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })

  useEffect(() => {
    loadObjects()
  }, [])

  useEffect(() => {
    if (objects.length > 0) {
      loadChecklists()
    }
  }, [selectedObject, statusFilter, pagination.page])

  const loadObjects = async () => {
    try {
      const data = await getObjects()
      setObjects(data.items || [])
      if (data.items && data.items.length > 0) {
        setSelectedObject(data.items[0].id.toString())
      }
    } catch (error) {
      console.error('Ошибка загрузки объектов:', error)
    }
  }

  const loadChecklists = async () => {
    try {
      setLoading(true)
      const data = await getSSKDailyChecklists({
        object_id: selectedObject,
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit
      })
      setChecklists(data.items || [])
      setPagination(prev => ({
        ...prev,
        total: data.total || 0
      }))
    } catch (error) {
      console.error('Ошибка загрузки чеклистов:', error)
      alert('Ошибка загрузки чеклистов')
    } finally {
      setLoading(false)
    }
  }

  const handleChecklistClick = (checklist) => {
    setSelectedChecklist(checklist)
    setModalOpen(true)
  }

  const handleReview = (checklistId, decision) => {
    // Обновляем статус чеклиста в списке
    setChecklists(prev => prev.map(c => 
      c.id === checklistId 
        ? { ...c, status: decision === 'approve' ? 'approved' : 'rejected' }
        : c
    ))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return '#f59e0b'
      case 'approved': return '#10b981'
      case 'rejected': return '#ef4444'
      default: return 'var(--muted)'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'submitted': return 'На рассмотрении'
      case 'approved': return 'Одобрен'
      case 'rejected': return 'Отклонен'
      default: return status
    }
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  if (loading && checklists.length === 0) {
    return (
      <div className="page">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          color: 'var(--muted)'
        }}>
          Загрузка...
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
          Ежедневные чек-листы прорабов
        </h1>
      </div>

      {/* Фильтры */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text)',
              marginBottom: '8px'
            }}>
              Объект
            </label>
            <select
              value={selectedObject}
              onChange={(e) => setSelectedObject(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--panel)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            >
              {objects.map(obj => (
                <option key={obj.id} value={obj.id}>{obj.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text)',
              marginBottom: '8px'
            }}>
              Статус
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--panel)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            >
              <option value="">Все статусы</option>
              <option value="submitted">На рассмотрении</option>
              <option value="approved">Одобрены</option>
              <option value="rejected">Отклонены</option>
            </select>
          </div>

          <div>
            <button
              onClick={loadChecklists}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: loading ? 'var(--muted)' : 'var(--brand)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Загрузка...' : 'Обновить'}
            </button>
          </div>
        </div>
      </div>

      {/* Список чеклистов */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        {checklists.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--muted)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Чек-листы не найдены
            </div>
            <div style={{ fontSize: '14px' }}>
              {statusFilter ? `Нет чеклистов со статусом "${getStatusText(statusFilter)}"` : 'Нет чеклистов для отображения'}
            </div>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gap: '12px'
            }}>
              {checklists.map(checklist => (
                <div
                  key={checklist.id}
                  onClick={() => handleChecklistClick(checklist)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    ':hover': {
                      background: 'var(--bg)',
                      borderColor: 'var(--brand)'
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg)'
                    e.currentTarget.style.borderColor = 'var(--brand)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '16px',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                        Дата создания
                      </div>
                      <div style={{ fontWeight: '600' }}>
                        {new Date(checklist.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                        Объект
                      </div>
                      <div style={{ fontWeight: '600' }}>
                        ID: {checklist.object_id}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                        Статус
                      </div>
                      <div style={{
                        color: getStatusColor(checklist.status),
                        fontWeight: '600'
                      }}>
                        {getStatusText(checklist.status)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                        Действие
                      </div>
                      <div style={{
                        color: 'var(--brand)',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        {checklist.status === 'submitted' ? 'Нажмите для ревью' : 'Просмотр'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border)'
              }}>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  style={{
                    padding: '8px 12px',
                    background: pagination.page <= 1 ? 'var(--muted)' : 'var(--panel)',
                    color: pagination.page <= 1 ? 'var(--text)' : 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ←
                </button>

                <span style={{
                  padding: '8px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {pagination.page} из {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= totalPages}
                  style={{
                    padding: '8px 12px',
                    background: pagination.page >= totalPages ? 'var(--muted)' : 'var(--panel)',
                    color: pagination.page >= totalPages ? 'var(--text)' : 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: pagination.page >= totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно */}
      <DailyChecklistModal
        checklist={selectedChecklist}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedChecklist(null)
        }}
        onReview={handleReview}
      />
    </div>
  )
}
