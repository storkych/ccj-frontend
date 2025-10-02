
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViolations } from '../api/api.js'
import { useAuth } from '../auth/AuthContext.jsx'
import ViolationModal from '../components/ViolationModal.jsx'

export default function Violations(){
  const { user } = useAuth()
  const [objectId, setObjectId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [items, setItems] = useState([])
  const [objects, setObjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [selectedViolation, setSelectedViolation] = useState(null)
  const [violationModalOpen, setViolationModalOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const violationsRes = await getViolations({ object_id: objectId||undefined })
      setItems(violationsRes.items || [])
      // Извлекаем уникальные объекты из нарушений для фильтрации
      const uniqueObjects = []
      const seenIds = new Set()
      violationsRes.items?.forEach(violation => {
        if (violation.object && typeof violation.object === 'object' && !seenIds.has(violation.object.id)) {
          uniqueObjects.push(violation.object)
          seenIds.add(violation.object.id)
        }
      })
      setObjects(uniqueObjects)
    } catch (e) {
      console.warn('[ui violations] error', e)
      setItems([])
      setObjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ 
    loadData()
  }, [objectId])

  // Фильтрация по статусу на фронте
  const filteredItems = items.filter(item => {
    if (!statusFilter) return true
    return item.status === statusFilter
  })

  // Пагинация
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  // Сброс на первую страницу при изменении фильтров
  useEffect(() => {
    setCurrentPage(1)
  }, [objectId, statusFilter])

  const getObjectName = (obj) => {
    if (typeof obj === 'object' && obj.name && obj.address) {
      return `${obj.name} (${obj.address})`
    }
    if (typeof obj === 'number') {
      const foundObj = objects.find(o => o.id === obj)
      return foundObj ? `${foundObj.name} (${foundObj.address})` : `Объект #${obj}`
    }
    return `Объект #${obj}`
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      'open': { label: 'Открыто', color: '#ef4444' },
      'fixed': { label: 'Исправлено', color: '#f59e0b' },
      'awaiting_verification': { label: 'Ожидает проверки', color: '#f59e0b' },
      'verified': { label: 'Проверено', color: '#10b981' },
      'closed': { label: 'Закрыто', color: '#6b7280' }
    }
    return statusMap[status] || { label: status, color: '#6b7280' }
  }

  const openViolationModal = (violation) => {
    setSelectedViolation(violation)
    setViolationModalOpen(true)
  }

  const closeViolationModal = () => {
    setSelectedViolation(null)
    setViolationModalOpen(false)
  }

  // Компонент пагинации
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null

    const getPageNumbers = () => {
      const pages = []
      const maxVisible = 5
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i)
          pages.push('...')
          pages.push(totalPages)
        } else if (currentPage >= totalPages - 2) {
          pages.push(1)
          pages.push('...')
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
        } else {
          pages.push(1)
          pages.push('...')
          for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
          pages.push('...')
          pages.push(totalPages)
        }
      }
      return pages
    }

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '20px 0',
        marginTop: '20px'
      }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--bg)',
            color: currentPage === 1 ? 'var(--muted)' : 'var(--text)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            boxShadow: 'none'
          }}
        >
          ← Назад
        </button>

        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} style={{
              padding: '8px 4px',
              color: 'var(--muted)',
              fontSize: '14px'
            }}>
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: currentPage === page ? 'var(--brand)' : 'var(--bg)',
                color: currentPage === page ? 'white' : 'var(--text)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '40px',
                transition: 'all 0.2s ease',
                boxShadow: 'none'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== page) {
                  e.target.style.background = 'var(--bg-light)'
                  e.target.style.borderColor = 'var(--brand)'
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== page) {
                  e.target.style.background = 'var(--bg)'
                  e.target.style.borderColor = 'var(--border)'
                }
              }}
            >
              {page}
            </button>
          )
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--bg)',
            color: currentPage === totalPages ? 'var(--muted)' : 'var(--text)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            boxShadow: 'none'
          }}
        >
          Вперед →
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{marginBottom: '32px'}}>
        <h1 style={{margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: 'var(--text)'}}>Нарушения</h1>
        <p style={{margin: 0, color: 'var(--muted)', fontSize: '16px'}}>
          Управление нарушениями и их исправлением
        </p>
      </div>
      
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          {/* Фильтр по объекту */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '250px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text)',
              fontWeight: '500',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              Объект:
            </div>
            <select 
              className="input" 
              value={objectId} 
              onChange={e=>setObjectId(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: 'var(--text)',
                fontSize: '13px',
                fontWeight: '400'
              }}
            >
              <option value="">Все объекты</option>
              {objects.map(obj => (
                <option key={obj.id} value={obj.id}>
                  {obj.name} - {obj.address}
                </option>
              ))}
            </select>
          </div>

          {/* Фильтр по статусу */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '200px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text)',
              fontWeight: '500',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
              </svg>
              Статус:
            </div>
            <select 
              className="input" 
              value={statusFilter} 
              onChange={e=>setStatusFilter(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: 'var(--text)',
                fontSize: '13px',
                fontWeight: '400'
              }}
            >
              <option value="">Все</option>
              <option value="open">Открыто</option>
              <option value="awaiting_verification">Ожидает проверки</option>
              <option value="verified">Проверено</option>
              <option value="closed">Закрыто</option>
            </select>
          </div>

          {/* Счетчик результатов */}
          <div style={{
            fontSize: '11px',
            color: 'var(--muted)',
            background: 'var(--bg-secondary)',
            padding: '3px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            whiteSpace: 'nowrap'
          }}>
            {filteredItems.length > 0 ? (
              totalPages > 1 ? 
                `${startIndex + 1}-${Math.min(endIndex, filteredItems.length)} из ${filteredItems.length}` :
                `${filteredItems.length} нарушений`
            ) : '0 нарушений'}
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="muted">Загрузка нарушений...</div>
      ) : (
        <div className="list">
          {paginatedItems.map(v=>{
            const statusInfo = getStatusInfo(v.status)
            const isAuthor = v.author === user?.id
            const needsMyReview = (v.status === 'fixed' || v.status === 'awaiting_verification') && isAuthor
            const cannotReview = (v.status === 'fixed' || v.status === 'awaiting_verification') && !isAuthor
            
            return (
              <article 
                key={v.id} 
                className="card violation-card" 
                onClick={() => openViolationModal(v)}
                style={{
                  padding: 0,
                  position: 'relative',
                  borderLeft: `4px solid ${statusInfo.color}`,
                  background: needsMyReview ? 'var(--brand)05' : 'var(--panel)',
                  border: needsMyReview ? `1px solid var(--brand)30` : '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {/* Цветная полоса сверху */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${statusInfo.color}, ${statusInfo.color}80)`,
                  boxShadow: `0 0 8px ${statusInfo.color}40`
                }} />
                
                <div style={{padding: '20px'}}>
                  <div style={{marginBottom: 12}}>
                    <div className="row" style={{alignItems: 'center', gap: 12, marginBottom: 8}}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
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
                        {needsMyReview && (
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '8px',
                            background: 'var(--brand)',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            👁️ Ваша проверка
                          </div>
                        )}
                        {cannotReview && (
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '8px',
                            background: 'var(--muted)',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            🚫 Не ваше
                          </div>
                        )}
                      </div>
                      <div style={{fontSize: '18px', fontWeight: '600', color: 'var(--text)'}}>
                        {v.title}
                      </div>
                    </div>
                    
                    <div style={{color: 'var(--muted)', marginBottom: 12, fontSize: '14px'}}>
                      📍 {getObjectName(v.object)}
                    </div>
                    
                    {v.description && (
                      <div style={{color: 'var(--text)', fontSize: '14px', lineHeight: '1.5', marginBottom: 12}}>
                        {v.description.length > 150 ? `${v.description.substring(0, 150)}...` : v.description}
                      </div>
                    )}
                  </div>
                  
                  <div className="row" style={{gap: 16, fontSize: '12px', color: 'var(--muted)', paddingTop: '12px', borderTop: '1px solid var(--border)'}}>
                    <span>📅 Создано: {new Date(v.created_at).toLocaleDateString('ru-RU')}</span>
                    {v.requires_stop && (
                      <span style={{color: '#ef4444', fontWeight: '500'}}>
                        ⚠️ Требует остановки работ
                      </span>
                    )}
                    {v.requires_personal_recheck && (
                      <span style={{color: '#f59e0b', fontWeight: '500'}}>
                        👁️ Требует личной проверки
                      </span>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
          {filteredItems.length===0 && <div className="muted">Нет нарушений.</div>}
          
          {/* Пагинация */}
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Модальное окно для просмотра нарушения */}
      <ViolationModal
        open={violationModalOpen}
        onClose={closeViolationModal}
        violation={selectedViolation}
        getStatusInfo={getStatusInfo}
        getObjectName={getObjectName}
        user={user}
        onViolationUpdate={() => {
          // Перезагружаем список нарушений после обновления
          loadData()
        }}
      />
    </div>
  )
}
