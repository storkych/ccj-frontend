
import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getVisits, createVisit, getObjects } from '../api/api.js'

export default function Visits(){
  const { user } = useAuth()
  const [objectId, setObjectId] = useState('')
  const [items, setItems] = useState([])
  const [objects, setObjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [visitData, setVisitData] = useState({
    object_id: '',
    visit_date: new Date().toISOString().split('T')[0]
  })
  const [saving, setSaving] = useState(false)

  useEffect(()=>{ 
    const loadData = async () => {
      setLoading(true)
      try {
        const [visitsRes, objectsRes] = await Promise.all([
          getVisits({ user_id: user?.id, object_id: objectId||undefined }),
          getObjects({ mine: user?.role === 'ssk' ? undefined : true })
        ])
        setItems(visitsRes.sessions || [])
        setObjects(objectsRes.items || [])
      } catch (e) {
        console.warn('[ui visits] error', e)
        setItems([])
        setObjects([])
      } finally {
        setLoading(false)
      }
    }
    if (user) loadData()
  }, [user, objectId])

  const handleCreateVisit = async (e) => {
    e.preventDefault()
    if (!visitData.object_id || !visitData.visit_date) return alert('Заполните все поля')
    setSaving(true)
    try {
      await createVisit({
        user_id: user.id,
        user_role: user.role,
        object_id: Number(visitData.object_id),
        visit_date: visitData.visit_date
      })
      alert('Посещение создано')
      setCreateModalOpen(false)
      setVisitData({ object_id: '', visit_date: new Date().toISOString().split('T')[0] })
      // Перезагружаем данные
      const visitsRes = await getVisits({ user_id: user.id, object_id: objectId||undefined })
      setItems(visitsRes.sessions || [])
    } catch (e) {
      alert('Ошибка создания посещения: ' + (e?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  const getObjectName = (objId) => {
    const obj = objects.find(o => o.id === objId)
    return obj ? `${obj.name} (${obj.address})` : `Объект #${objId}`
  }

  const getRoleLabel = (role) => {
    const roleMap = {
      'ssk': 'ССК',
      'iko': 'ИКО', 
      'foreman': 'Прораб'
    }
    return roleMap[role] || role
  }

  return (
    <div className="page">
      <div style={{marginBottom: '32px'}}>
        <h1 style={{margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: 'var(--text)'}}>Посещения</h1>
        <p style={{margin: 0, color: 'var(--muted)', fontSize: '16px'}}>
          Управление посещениями объектов
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
            minWidth: '300px'
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
            {items.length} посещений
          </div>

          {/* Кнопка создания посещения */}
          {(user?.role === 'ssk' || user?.role === 'iko') && (
            <button 
              className="btn" 
              onClick={() => setCreateModalOpen(true)}
              style={{
                padding: '6px 12px',
                background: 'var(--brand)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e67e00';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 8px rgba(255, 138, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--brand)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Создать посещение
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="muted">Загрузка посещений...</div>
      ) : (
        <div className="list">
          {items.map(v => {
            const isToday = new Date(v.visit_date).toDateString() === new Date().toDateString()
            const isPast = new Date(v.visit_date) < new Date()
            const isFuture = new Date(v.visit_date) > new Date()
            
            return (
              <article key={v.id} className="card" style={{
                padding: 16,
                border: isToday ? '2px solid var(--brand)' : '1px solid var(--border)',
                backgroundColor: isToday ? 'var(--brand)10' : 'var(--panel)'
              }}>
                <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12}}>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: '18px', fontWeight: '600', marginBottom: 6}}>
                      {getObjectName(v.object_id)}
                    </div>
                    <div className="row" style={{gap: 16, alignItems: 'center', marginBottom: 8}}>
                      <div style={{color: 'var(--muted)', fontSize: '14px'}}>
                        📅 {new Date(v.visit_date).toLocaleDateString('ru-RU', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      {isToday && (
                        <span style={{
                          backgroundColor: 'var(--brand)',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Сегодня
                        </span>
                      )}
                      {isPast && !isToday && (
                        <span style={{
                          backgroundColor: '#6b7280',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Прошедшее
                        </span>
                      )}
                      {isFuture && (
                        <span style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Запланировано
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="row" style={{gap: 12, alignItems: 'center'}}>
                    <span className="pill" style={{
                      backgroundColor: v.user_role === 'foreman' ? '#f59e0b20' : 
                                      v.user_role === 'ssk' ? '#3b82f620' : '#8b5cf620',
                      color: v.user_role === 'foreman' ? '#f59e0b' : 
                             v.user_role === 'ssk' ? '#3b82f6' : '#8b5cf6',
                      border: v.user_role === 'foreman' ? '1px solid #f59e0b40' : 
                              v.user_role === 'ssk' ? '1px solid #3b82f640' : '1px solid #8b5cf640',
                      fontWeight: '600'
                    }}>
                      {v.user_role === 'foreman' ? '🔨' : v.user_role === 'ssk' ? '👷' : '👁️'} {getRoleLabel(v.user_role)}
                    </span>
                  </div>
                </div>
                
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--muted)',
                  border: '1px solid var(--border)'
                }}>
                  {v.user_role === 'foreman' ? 'Автоматически созданное посещение для ежедневного контроля' : 
                   v.user_role === 'ssk' ? 'Посещение ССК для контроля работ' : 
                   'Посещение ИКО для проверки объекта'}
                </div>
              </article>
            )
          })}
          {items.length === 0 && (
            <div className="card" style={{padding: 40, textAlign: 'center'}}>
              <div style={{fontSize: '48px', marginBottom: 16}}>📅</div>
              <div style={{fontSize: '18px', fontWeight: '600', marginBottom: 8}}>Нет посещений</div>
              <div style={{color: 'var(--muted)'}}>
                {user?.role === 'foreman' ? 
                  'Автоматически созданные посещения появятся здесь' :
                  'Создайте новое посещение, нажав кнопку выше'
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* Модальное окно создания посещения */}
      {createModalOpen && (
        <div className="modal-backdrop" onClick={() => setCreateModalOpen(false)} style={{zIndex: 9998}}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{width: '500px', maxWidth: '90vw', zIndex: 9999}}>
            <div style={{padding: 16}}>
              <div className="row" style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                <h2 style={{margin: 0, fontSize: '20px'}}>Создать посещение</h2>
                <button onClick={() => setCreateModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--muted)'}}>✕</button>
              </div>
              
              <form onSubmit={handleCreateVisit}>
                <div style={{marginBottom: 12}}>
                  <label style={{display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '14px'}}>Объект *</label>
                  <select 
                    className="input" 
                    value={visitData.object_id} 
                    onChange={e => setVisitData(prev => ({...prev, object_id: e.target.value}))}
                    required
                    style={{width: '100%', padding: '8px 12px'}}
                  >
                    <option value="">Выберите объект</option>
                    {objects.map(obj => (
                      <option key={obj.id} value={obj.id}>
                        {obj.name} - {obj.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{marginBottom: 16}}>
                  <label style={{display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '14px'}}>Дата посещения *</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={visitData.visit_date} 
                    onChange={e => setVisitData(prev => ({...prev, visit_date: e.target.value}))}
                    required
                    style={{width: '100%', padding: '8px 12px'}}
                  />
                </div>

                <div className="row" style={{gap: 8, justifyContent: 'flex-end'}}>
                  <button type="button" onClick={() => setCreateModalOpen(false)} className="btn ghost">
                    Отмена
                  </button>
                  <button type="submit" className="btn" disabled={saving || !visitData.object_id || !visitData.visit_date}>
                    {saving ? 'Создаём...' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
