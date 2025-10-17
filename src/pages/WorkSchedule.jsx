
import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getSchedules, getObjects, getWorkPlan, updateWorkItemStatus } from '../api/api.js'

export default function WorkSchedule(){
  const { user } = useAuth()
  const [objectId, setObjectId] = useState('')
  const [items, setItems] = useState([])
  const [objects, setObjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [onlyMine, setOnlyMine] = useState(false)
  const [showCompleted, setShowCompleted] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [planDetails, setPlanDetails] = useState(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [updatingItems, setUpdatingItems] = useState(new Set())

  // Загружаем объекты для фильтрации
  useEffect(()=>{
    const mineParam = user?.role === 'ssk' ? true : undefined // ССК видит только свои объекты
    getObjects({ mine: mineParam })
      .then(r => { 
        console.log('[ui work-schedule] objects loaded', r)
        setObjects(r.items||[])
      })
      .catch(e => { 
        console.warn('[ui work-schedule] objects error', e)
        setObjects([]) 
      })
      .finally(() => setLoading(false))
  }, [user])

  // Фильтруем объекты для ССК - показываем только свои
  const availableObjects = useMemo(() => {
    if(!user) return []
    if(user.role === 'ssk') {
      return objects.filter(o => o.ssk && o.ssk.id === user.id)
    }
    return objects
  }, [objects, user])

  // Загружаем графики работ
  useEffect(()=>{ 
    if(objectId) {
      getSchedules({ object_id: objectId }).then(r=>{
        console.log('[ui work-schedule] schedules loaded', r)
        setItems(r.items || [])
      }).catch(e=>{
        console.warn('[ui work-schedule] schedules error', e)
        setItems([])
      })
    } else {
      // Если объект не выбран, загружаем все графики для своих объектов
      const objectIds = availableObjects.map(o => o.id).join(',')
      if(objectIds) {
        getSchedules({}).then(r=>{
          console.log('[ui work-schedule] all schedules loaded', r)
          // Фильтруем только те планы, которые относятся к нашим объектам
          const myObjectIds = availableObjects.map(o => o.id)
          const filteredPlans = (r.items || []).filter(plan => myObjectIds.includes(plan.object))
          setItems(filteredPlans)
        }).catch(e=>{
          console.warn('[ui work-schedule] all schedules error', e)
          setItems([])
        })
      } else {
        setItems([])
      }
    }
  }, [objectId, availableObjects])

  const shown = useMemo(() => {
    let filtered = items
    
    // Фильтр для прораба - только его планы
    if (onlyMine && user?.role === 'foreman') {
      filtered = filtered.filter(i => i.assignee === user.id)
    }
    
    // Фильтр по завершенности
    if (!showCompleted) {
      filtered = filtered.filter(plan => {
        const workItemsCount = plan.work_items?.length || 0
        if (workItemsCount === 0) return true // Планы без элементов показываем
        const completedItems = plan.work_items?.filter(item => item.status === 'done').length || 0
        const progress = workItemsCount > 0 ? Math.round((completedItems / workItemsCount) * 100) : 0
        return progress < 100
      })
    }
    
    return filtered
  }, [items, onlyMine, showCompleted, user])

  const openPlanDetails = async (plan) => {
    setSelectedPlan(plan)
    setPlanLoading(true)
    try {
      const details = await getWorkPlan(plan.id)
      console.log('[ui work-schedule] plan details loaded', details)
      setPlanDetails(details)
    } catch (e) {
      console.warn('[ui work-schedule] plan details error', e)
      setPlanDetails(null)
    } finally {
      setPlanLoading(false)
    }
  }

  const closePlanDetails = () => {
    setSelectedPlan(null)
    setPlanDetails(null)
  }

  return (
    <div className="page">

      {/* Панель фильтров */}
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
              disabled={loading}
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
              <option value="">Все мои объекты</option>
              {availableObjects.map(obj => (
                <option key={obj.id} value={obj.id}>
                  {obj.name} - {obj.address}
                </option>
              ))}
        </select>
          </div>

          {/* Фильтр по завершенности */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
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
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              Статус:
            </div>
            <div style={{display: 'flex', gap: '4px'}}>
              <button 
                className={`btn small ${showCompleted ? '' : 'ghost'}`} 
                onClick={()=>setShowCompleted(true)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Все
              </button>
              <button 
                className={`btn small ${!showCompleted ? '' : 'ghost'}`} 
                onClick={()=>setShowCompleted(false)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Активные
              </button>
            </div>
          </div>

          {/* Фильтр для прораба */}
          {user?.role === 'foreman' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
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
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                </svg>
                Показывать:
              </div>
              <div style={{display: 'flex', gap: '4px'}}>
                <button 
                  className={`btn small ${onlyMine ? '' : 'ghost'}`} 
                  onClick={()=>setOnlyMine(true)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Только мои
                </button>
                <button 
                  className={`btn small ${!onlyMine ? '' : 'ghost'}`} 
                  onClick={()=>setOnlyMine(false)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Все
                </button>
              </div>
            </div>
          )}

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
            {shown.length} планов
          </div>
        </div>
      </div>

      {loading && (
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          color: 'var(--muted)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border)',
            borderTop: '3px solid var(--brand)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          Загрузка объектов...
        </div>
      )}
      {shown.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {shown.map(plan => {
            const obj = objects.find(o => o.id === plan.object)
            const workItemsCount = plan.work_items?.length || 0
            const completedItems = plan.work_items?.filter(item => item.status === 'done').length || 0
            const progress = workItemsCount > 0 ? Math.round((completedItems / workItemsCount) * 100) : 0
            
            return (
              <div
                key={plan.id}
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  opacity: progress === 100 && workItemsCount > 0 ? 0.7 : 1,
                  filter: progress === 100 && workItemsCount > 0 ? 'grayscale(0.2)' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                  if (progress === 100 && workItemsCount > 0) {
                    e.target.style.opacity = '1'
                    e.target.style.filter = 'none'
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 1px 4px rgba(0,0,0,0.1)'
                  if (progress === 100 && workItemsCount > 0) {
                    e.target.style.opacity = '0.7'
                    e.target.style.filter = 'grayscale(0.2)'
                  }
                }}
                onClick={() => openPlanDetails(plan)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    lineHeight: '1.3',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {plan.title || `План #${plan.id}`}
                    {progress === 100 && workItemsCount > 0 && (
                      <span style={{
                        color: 'var(--green)',
                        fontSize: '16px'
                      }}>
                        ✓
                      </span>
                    )}
                  </h3>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    {progress === 100 && workItemsCount > 0 && (
                      <div style={{
                        background: 'var(--green)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Завершен
                      </div>
                    )}
                    <div style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--muted)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {plan.versions?.length || 0} версий
                    </div>
                  </div>
                </div>

                <div style={{marginBottom: '16px'}}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                    <span style={{fontWeight: '500', color: 'var(--text)'}}>
                      {obj?.name || `Объект #${plan.object}`}
                    </span>
                  </div>
                  {obj?.address && (
                    <div style={{
                      color: 'var(--muted)',
                      fontSize: '14px',
                      marginLeft: '24px'
                    }}>
                      {obj.address}
                    </div>
                  )}
                </div>

                {workItemsCount > 0 ? (
                  <div style={{marginBottom: '16px'}}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--text)'
                      }}>
                        Прогресс выполнения
                      </span>
                      <span style={{
                        fontSize: '14px',
                        color: progress === 100 ? 'var(--green)' : 'var(--muted)',
                        fontWeight: progress === 100 ? '600' : '400'
                      }}>
                        {completedItems} из {workItemsCount}
                        {progress === 100 && ' ✓'}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: progress === 100 ? 'var(--green)' : 'var(--brand)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    background: 'var(--bg-light)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--muted)',
                      fontStyle: 'italic'
                    }}>
                      Нет элементов работ
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)'
                }}>
                  <div style={{
                    color: 'var(--muted)',
                    fontSize: '13px'
                  }}>
                    Создан {new Date(plan.created_at).toLocaleDateString('ru-RU')}
                  </div>
                  <button 
                    className="btn small"
                    onClick={(e) => {
                      e.stopPropagation()
                      openPlanDetails(plan)
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Открыть
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '60px 40px',
          textAlign: 'center',
          color: 'var(--muted)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'var(--bg-secondary)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '32px'
          }}>
            📋
          </div>
          <h3 style={{margin: '0 0 8px 0', color: 'var(--text)', fontSize: '18px', fontWeight: '600'}}>
            {objectId ? 'Графики работ не найдены' : 'Нет рабочих планов'}
          </h3>
          <p style={{margin: 0, fontSize: '14px'}}>
            {objectId ? 'Для выбранного объекта пока нет графиков работ' : 'У вас пока нет созданных рабочих планов'}
          </p>
        </div>
      )}

      {/* Модальное окно с деталями плана */}
      {selectedPlan && (
        <div className="modal-backdrop" onClick={closePlanDetails}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{
            width: '95vw', 
            maxWidth: '95vw', 
            maxHeight: '90vh', 
            overflow: 'auto',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 24px 0 24px',
              marginBottom: '24px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '20px'
            }}>
              <div>
                <h3 style={{
                  margin: '0 0 4px 0',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'var(--text)'
                }}>
                  Детали рабочего плана
                </h3>
                <p style={{
                  margin: 0,
                  color: 'var(--muted)',
                  fontSize: '14px'
                }}>
                  {selectedPlan.title || `План #${selectedPlan.id}`}
                </p>
              </div>
              <button 
                className="btn ghost" 
                onClick={closePlanDetails}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '600'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{padding: '0 24px 24px 24px'}}>
              {planLoading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                  color: 'var(--muted)'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid var(--border)',
                    borderTop: '3px solid var(--brand)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '16px'
                  }} />
                  Загрузка деталей...
                </div>
              ) : planDetails ? (
                <div style={{display:'flex', flexDirection:'column', gap: '24px'}}>
                  <div style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <h4 style={{
                      margin: '0 0 16px 0',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: 'var(--text)'
                    }}>
                      Основная информация
                    </h4>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginBottom: '16px'
                    }}>
                      <span style={{
                        background: 'var(--bg-secondary)',
                        color: 'var(--muted)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        ID: {planDetails.id}
                      </span>
                      <span style={{
                        background: 'var(--bg-secondary)',
                        color: 'var(--muted)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Объект: {planDetails.object}
                      </span>
                      <span style={{
                        background: 'var(--bg-secondary)',
                        color: 'var(--muted)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Создан: {new Date(planDetails.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    {planDetails.title && (
                      <div style={{
                        background: 'var(--bg-light)',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--muted)',
                          marginBottom: '4px',
                          fontWeight: '500'
                        }}>
                          Название плана:
                        </div>
                        <div style={{
                          fontSize: '16px',
                          color: 'var(--text)',
                          fontWeight: '500'
                        }}>
                          {planDetails.title}
                        </div>
                      </div>
                    )}
                  </div>

                {/* Показываем элементы работ, если они есть */}
                {planDetails.work_items && planDetails.work_items.length > 0 && (
                  <div style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <h4 style={{
                      margin: '0 0 20px 0',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: 'var(--text)'
                    }}>
                      Элементы работ ({planDetails.work_items.length})
                    </h4>
                    <div style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px'
                      }}>
                        <thead>
                          <tr style={{
                            background: 'var(--bg-secondary)',
                            borderBottom: '1px solid var(--border)'
                          }}>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontWeight: '600',
                              color: 'var(--text)',
                              fontSize: '13px'
                            }}>
                              Название
                            </th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontWeight: '600',
                              color: 'var(--text)',
                              fontSize: '13px'
                            }}>
                              Количество
                            </th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontWeight: '600',
                              color: 'var(--text)',
                              fontSize: '13px'
                            }}>
                              Единица
                            </th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontWeight: '600',
                              color: 'var(--text)',
                              fontSize: '13px'
                            }}>
                              Период
                            </th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontWeight: '600',
                              color: 'var(--text)',
                              fontSize: '13px'
                            }}>
                              Статус
                            </th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontWeight: '600',
                              color: 'var(--text)',
                              fontSize: '13px'
                            }}>
                              Документ
                            </th>
                            {user?.role === 'ssk' && (
                              <th style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontWeight: '600',
                                color: 'var(--text)',
                                fontSize: '13px'
                              }}>
                                Действия
                              </th>
                            )}
                          </tr>
                        </thead>
        <tbody>
                          {planDetails.work_items.map((item, idx) => (
                            <tr key={item.id || idx} style={{
                              borderBottom: '1px solid var(--border)',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'var(--bg-light)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent'
                            }}>
                              <td style={{
                                padding: '12px 16px',
                                color: 'var(--text)',
                                fontWeight: '500'
                              }}>
                                {item.name}
                              </td>
                              <td style={{
                                padding: '12px 16px',
                                color: 'var(--text)'
                              }}>
                                {item.quantity || '—'}
                              </td>
                              <td style={{
                                padding: '12px 16px',
                                color: 'var(--muted)',
                                fontSize: '13px'
                              }}>
                                {item.unit || '—'}
                              </td>
                              <td style={{
                                padding: '12px 16px',
                                color: 'var(--text)',
                                fontSize: '13px'
                              }}>
                                {item.start_date && item.end_date ? (
                                  <div>
                                    <div>{new Date(item.start_date).toLocaleDateString('ru-RU')}</div>
                                    <div style={{color: 'var(--muted)', fontSize: '12px'}}>
                                      до {new Date(item.end_date).toLocaleDateString('ru-RU')}
                                    </div>
                                  </div>
                                ) : '—'}
                              </td>
                              <td style={{
                                padding: '12px 16px'
                              }}>
                                <span style={{
                                  background: item.status === 'planned' ? '#fef3c7' : 
                                             item.status === 'in_progress' ? '#dbeafe' : 
                                             item.status === 'done' ? '#d1fae5' : 'var(--bg-secondary)',
                                  color: item.status === 'planned' ? '#92400e' : 
                                        item.status === 'in_progress' ? '#1e40af' : 
                                        item.status === 'done' ? '#065f46' : 'var(--muted)',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>
                                  {item.status === 'planned' ? 'Запланировано' : 
                                   item.status === 'in_progress' ? 'В работе' : 
                                   item.status === 'done' ? 'Выполнено' : item.status}
                                </span>
                              </td>
                              <td style={{
                                padding: '12px 16px'
                              }}>
                                {item.document_url ? (
                                  <a 
                                    href={item.document_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="btn small"
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '12px',
                                      textDecoration: 'none'
                                    }}
                                  >
                                    Открыть
                                  </a>
                                ) : (
                                  <span style={{color: 'var(--muted)', fontSize: '13px'}}>—</span>
                                )}
                              </td>
                              {user?.role === 'ssk' && (
                                <td style={{
                                  padding: '12px 16px'
                                }}>
                                  <div style={{display: 'flex', gap: '6px'}}>
                                    {item.status !== 'in_progress' && item.status !== 'done' && (
                                      <button 
                                        className="btn small" 
                                        disabled={updatingItems.has(item.id)}
                                        onClick={async () => {
                                          setUpdatingItems(prev => new Set(prev).add(item.id))
                                          try {
                                            await updateWorkItemStatus(item.id, 'in_progress')
                                            const updated = await getWorkPlan(planDetails.id)
                                            setPlanDetails(updated)
                                          } catch (e) {
                                            alert('Ошибка обновления статуса: ' + (e?.message || ''))
                                          } finally {
                                            setUpdatingItems(prev => {
                                              const next = new Set(prev)
                                              next.delete(item.id)
                                              return next
                                            })
                                          }
                                        }}
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          background: updatingItems.has(item.id) ? '#6b7280' : '#ff8a00',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: updatingItems.has(item.id) ? 'not-allowed' : 'pointer',
                                          fontWeight: '500',
                                          transition: 'all 0.2s ease',
                                          opacity: updatingItems.has(item.id) ? 0.7 : 1,
                                          boxShadow: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!updatingItems.has(item.id)) {
                                            e.target.style.background = '#e67e00'
                                            e.target.style.transform = 'translateY(-1px)'
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!updatingItems.has(item.id)) {
                                            e.target.style.background = '#ff8a00'
                                            e.target.style.transform = 'translateY(0)'
                                          }
                                        }}
                                      >
                                        {updatingItems.has(item.id) ? '...' : 'Начать'}
                                      </button>
                                    )}
                                    {item.status === 'in_progress' && (
                                      <button 
                                        className="btn small" 
                                        disabled={updatingItems.has(item.id)}
                                        onClick={async () => {
                                          setUpdatingItems(prev => new Set(prev).add(item.id))
                                          try {
                                            await updateWorkItemStatus(item.id, 'done')
                                            const updated = await getWorkPlan(planDetails.id)
                                            setPlanDetails(updated)
                                          } catch (e) {
                                            alert('Ошибка обновления статуса: ' + (e?.message || ''))
                                          } finally {
                                            setUpdatingItems(prev => {
                                              const next = new Set(prev)
                                              next.delete(item.id)
                                              return next
                                            })
                                          }
                                        }}
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          background: updatingItems.has(item.id) ? '#6b7280' : '#22c55e',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: updatingItems.has(item.id) ? 'not-allowed' : 'pointer',
                                          fontWeight: '500',
                                          transition: 'all 0.2s ease',
                                          opacity: updatingItems.has(item.id) ? 0.7 : 1,
                                          boxShadow: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!updatingItems.has(item.id)) {
                                            e.target.style.background = '#16a34a'
                                            e.target.style.transform = 'translateY(-1px)'
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!updatingItems.has(item.id)) {
                                            e.target.style.background = '#22c55e'
                                            e.target.style.transform = 'translateY(0)'
                                          }
                                        }}
                                      >
                                        {updatingItems.has(item.id) ? '...' : 'Завершить'}
                                      </button>
                                    )}
                                    {item.status === 'done' && (
                                      <span style={{
                                        background: '#d1fae5',
                                        color: '#065f46',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                      }}>
                                        Выполнено
                                      </span>
                                    )}
                                  </div>
                                </td>
                              )}
            </tr>
          ))}
        </tbody>
      </table>
                    </div>
                  </div>
                )}

                {planDetails.versions && planDetails.versions.length > 0 && (
                  <div style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <h4 style={{
                      margin: '0 0 16px 0',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: 'var(--text)'
                    }}>
                      Версии плана ({planDetails.versions.length})
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {planDetails.versions.map((version, idx) => (
                        <div key={version.id} style={{
                          padding: '16px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          background: 'var(--bg-light)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = 'var(--brand)'
                          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = 'var(--border)'
                          e.target.style.boxShadow = 'none'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <span style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: 'var(--text)'
                            }}>
                              Версия {version.version}
                            </span>
                            <span style={{
                              background: 'var(--bg-secondary)',
                              color: 'var(--muted)',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              {new Date(version.created_at).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          {version.doc_url && (
                            <div>
                              <a 
                                href={version.doc_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn small"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  textDecoration: 'none'
                                }}
                              >
                                Открыть документ
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Если нет ни элементов, ни версий, показываем информационное сообщение */}
                {(!planDetails.work_items || planDetails.work_items.length === 0) && 
                 (!planDetails.versions || planDetails.versions.length === 0) && (
                  <div style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <h4 style={{
                      margin: '0 0 16px 0',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: 'var(--text)'
                    }}>
                      Информация о плане
                    </h4>
                    <div style={{
                      color: 'var(--muted)',
                      marginBottom: '16px',
                      lineHeight: '1.5'
                    }}>
                      Элементы работ не отображаются. Возможно, они хранятся в версиях плана или в отдельной системе расписания.
                    </div>
                    <details style={{marginTop: '12px'}}>
                      <summary style={{
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: 'var(--text)',
                        fontWeight: '500',
                        padding: '8px 0'
                      }}>
                        Техническая информация
                      </summary>
                      <pre style={{
                        fontSize: '12px',
                        background: 'var(--bg-light)',
                        padding: '16px',
                        borderRadius: '8px',
                        overflow: 'auto',
                        marginTop: '12px',
                        border: '1px solid var(--border)',
                        color: 'var(--text)'
                      }}>
                        {JSON.stringify(planDetails, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                  color: 'var(--muted)'
                }}>
                  <div style={{
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      fontSize: '24px'
                    }}>
                      ⚠️
                    </div>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      color: 'var(--text)',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      Ошибка загрузки
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '14px'
                    }}>
                      Не удалось загрузить детали плана
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
