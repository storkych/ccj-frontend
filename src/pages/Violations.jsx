
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViolations } from '../api/api.js'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Violations(){
  const { user } = useAuth()
  const [objectId, setObjectId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [items, setItems] = useState([])
  const [objects, setObjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ 
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
    loadData()
  }, [objectId])

  // Фильтрация по статусу на фронте
  const filteredItems = items.filter(item => {
    if (!statusFilter) return true
    return item.status === statusFilter
  })

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
            {filteredItems.length} нарушений
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="muted">Загрузка нарушений...</div>
      ) : (
        <div className="list">
          {filteredItems.map(v=>{
            const statusInfo = getStatusInfo(v.status)
            return (
              <article key={v.id} className="card violation-card" style={{
                padding: 0,
                position: 'relative',
                borderLeft: `4px solid ${statusInfo.color}`,
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
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
                  <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12}}>
                    <div style={{flex: 1}}>
                      <div className="row" style={{alignItems: 'center', gap: 12, marginBottom: 8}}>
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
                    
                    <Link className="btn ghost" to={`/violations/${v.id}`} style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}>
                      Открыть
                    </Link>
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
        </div>
      )}
    </div>
  )
}
