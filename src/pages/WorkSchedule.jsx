
import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getSchedules, getObjects, getWorkPlan, updateWorkItemStatus } from '../api/api.js'
import { getChangeRequests, makeChangeRequestDecision } from '../api/workPlans.js'
import NotificationToast from '../components/NotificationToast.jsx'
import { useNotification } from '../hooks/useNotification.js'

export default function WorkSchedule(){
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [activeTab, setActiveTab] = useState('schedules')
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
  
  // Состояние для запросов на изменение
  const [changeRequests, setChangeRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [decisionModalOpen, setDecisionModalOpen] = useState(false)
  const [decision, setDecision] = useState('')
  const [decisionComment, setDecisionComment] = useState('')
  const [editedItems, setEditedItems] = useState([])
  const [processing, setProcessing] = useState(false)

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

  // Загружаем запросы на изменение
  const loadChangeRequests = async () => {
    if (user?.role !== 'ssk') return
    
    setRequestsLoading(true)
    try {
      const params = {}
      if (objectId) params.object_id = objectId
      
      const response = await getChangeRequests(params)
      setChangeRequests(response.items || [])
    } catch (error) {
      console.error('Ошибка загрузки запросов:', error)
      showError('Ошибка загрузки запросов: ' + (error?.message || ''))
    } finally {
      setRequestsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'requests' && user?.role === 'ssk') {
      loadChangeRequests()
    }
  }, [activeTab, objectId, user])

  // Принятие решения по запросу
  const handleDecision = async (decisionType) => {
    if (!decisionComment.trim()) {
      showError('Укажите комментарий')
      return
    }

    setProcessing(true)
    try {
      await makeChangeRequestDecision(
        selectedRequest.id, 
        decisionType, 
        decisionComment, 
        null
      )
      
      showSuccess(`Решение "${decisionType === 'approve' ? 'Одобрено' : 'Отклонено'}" принято`)
      setDetailModalOpen(false)
      setDecisionComment('')
      setEditedItems([])
      loadChangeRequests() // Перезагружаем список
    } catch (error) {
      console.error('Ошибка принятия решения:', error)
      showError('Ошибка принятия решения: ' + (error?.message || ''))
    } finally {
      setProcessing(false)
    }
  }

  // Открытие модального окна принятия решения
  const openDecisionModal = (request) => {
    setSelectedRequest(request)
    setDecisionComment('')
    setEditedItems(request.new_items_data || [])
    setDecisionModalOpen(true)
  }

  // Открытие модального окна просмотра деталей
  const openDetailModal = (request) => {
    setSelectedRequest(request)
    setDetailModalOpen(true)
  }

  // Функция для сравнения полей и определения изменений
  const getChangedFields = (oldItem, newItem) => {
    const changes = []
    
    // Сравниваем каждое поле отдельно
    if (oldItem.name !== newItem.name) {
      changes.push({ field: 'name', old: oldItem.name, new: newItem.name })
    }
    if (oldItem.quantity !== newItem.quantity) {
      changes.push({ field: 'quantity', old: oldItem.quantity, new: newItem.quantity })
    }
    if (oldItem.unit !== newItem.unit) {
      changes.push({ field: 'unit', old: oldItem.unit, new: newItem.unit })
    }
    if (oldItem.start_date !== newItem.start_date) {
      changes.push({ field: 'start_date', old: oldItem.start_date, new: newItem.start_date })
    }
    if (oldItem.end_date !== newItem.end_date) {
      changes.push({ field: 'end_date', old: oldItem.end_date, new: newItem.end_date })
    }
    
    // Пропускаем сравнение подполигонов - сервер не возвращает их в old_items_data
    
    return changes
  }

  // Функция для сравнения элементов и определения изменений
  const getChangedItems = (oldItems, newItems) => {
    if (!oldItems || !newItems) return { added: [], modified: [], removed: [] }
    
    const added = []
    const modified = []
    const removed = []
    
    // Находим добавленные элементы (есть в новых, нет в старых)
    newItems.forEach(newItem => {
      if (!oldItems.find(oldItem => oldItem.id === newItem.id)) {
        added.push(newItem)
      }
    })
    
    // Находим удаленные элементы (есть в старых, нет в новых)
    oldItems.forEach(oldItem => {
      if (!newItems.find(newItem => newItem.id === oldItem.id)) {
        removed.push(oldItem)
      }
    })
    
    // Находим измененные элементы (есть в обоих, но отличаются)
    newItems.forEach(newItem => {
      const oldItem = oldItems.find(old => old.id === newItem.id)
      if (oldItem) {
        const changedFields = getChangedFields(oldItem, newItem)
        if (changedFields.length > 0) {
          modified.push({ 
            old: oldItem, 
            new: newItem, 
            changedFields: changedFields 
          })
        }
      }
    })
    
    return { added, modified, removed }
  }

  // Получение статуса на русском
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает решения',
      'approved': 'Одобрено',
      'rejected': 'Отклонено',
      'edited': 'Отредактировано'
    }
    return statusMap[status] || status
  }

  // Получение цвета статуса
  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#f59e0b',
      'approved': '#10b981',
      'rejected': '#ef4444',
      'edited': '#3b82f6'
    }
    return colorMap[status] || '#6b7280'
  }

  // Форматирование даты
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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

      {/* Вкладки */}
      {user?.role === 'ssk' && (
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '0',
          marginBottom: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)'
          }}>
            <button
              className={`btn ghost`}
              onClick={() => setActiveTab('schedules')}
              style={{
                flex: 1,
                padding: '16px 20px',
                borderRadius: 0,
                background: activeTab === 'schedules' ? 'var(--bg-light)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'schedules' ? '2px solid var(--brand)' : '2px solid transparent',
                color: activeTab === 'schedules' ? 'var(--brand)' : 'var(--text)',
                fontWeight: activeTab === 'schedules' ? '600' : '400',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              Графики работ
            </button>
            <button
              className={`btn ghost`}
              onClick={() => setActiveTab('requests')}
              style={{
                flex: 1,
                padding: '16px 20px',
                borderRadius: 0,
                background: activeTab === 'requests' ? 'var(--bg-light)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'requests' ? '2px solid var(--brand)' : '2px solid transparent',
                color: activeTab === 'requests' ? 'var(--brand)' : 'var(--text)',
                fontWeight: activeTab === 'requests' ? '600' : '400',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              Запросы на изменение
            </button>
          </div>
        </div>
      )}

      {/* Контент вкладки "Графики работ" */}
      {activeTab === 'schedules' && (
        <>
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
                                   item.status === 'done' ? 'Готово' : item.status}
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
        </>
      )}

      {/* Контент вкладки "Запросы на изменение" */}
      {activeTab === 'requests' && user?.role === 'ssk' && (
        <>
          <NotificationToast />
          
          {requestsLoading ? (
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
              Загрузка запросов...
            </div>
          ) : changeRequests.length === 0 ? (
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              color: 'var(--muted)'
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>
                Нет запросов
              </h3>
              <p style={{ margin: 0 }}>
                {objectId 
                  ? 'По выбранному объекту запросы не найдены'
                  : 'Запросы на изменение планов отсутствуют'
                }
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {changeRequests.map((request) => (
                <div
                  key={request.id}
                  style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-light)'
                    e.currentTarget.style.borderColor = 'var(--brand)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--panel)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                  onClick={() => openDetailModal(request)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
                        Запрос #{request.id}
                      </h3>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--muted)' }}>
                        От: {request.requested_by_name}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: getStatusColor(request.status) + '20',
                        color: getStatusColor(request.status),
                        border: `1px solid ${getStatusColor(request.status)}40`
                      }}>
                        {getStatusText(request.status)}
                      </span>
                      
                      {request.status === 'pending' && (
                        <button
                          className="btn small"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDecisionModal(request)
                          }}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          Решить
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <p style={{ 
                    margin: '8px 0 0 0', 
                    fontSize: '14px', 
                    color: 'var(--text)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {request.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Модальное окно просмотра деталей запроса */}
      {detailModalOpen && selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '1200px',
            width: '95%',
            maxHeight: '95vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: 'var(--text)' }}>
                Детали запроса #{selectedRequest.id}
              </h2>
              <button
                className="btn ghost"
                onClick={() => setDetailModalOpen(false)}
                style={{ padding: '8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Информация о запросе */}
              <div style={{
                background: 'var(--bg-light)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
                  Информация о запросе
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>От:</span>
                    <span style={{ marginLeft: '8px', color: 'var(--text)' }}>{selectedRequest.requested_by_name}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Статус:</span>
                    <span style={{ 
                      marginLeft: '8px', 
                      color: getStatusColor(selectedRequest.status),
                      fontWeight: '500'
                    }}>
                      {getStatusText(selectedRequest.status)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Создан:</span>
                    <span style={{ marginLeft: '8px', color: 'var(--text)' }}>{formatDate(selectedRequest.created_at)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Изменен:</span>
                    <span style={{ marginLeft: '8px', color: 'var(--text)' }}>{formatDate(selectedRequest.modified_at)}</span>
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <span style={{ color: 'var(--muted)' }}>Комментарий:</span>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text)' }}>{selectedRequest.comment}</p>
                </div>
              </div>

              {/* Сравнение изменений */}
              <div style={{
                background: 'var(--bg-light)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
                  ИЗМЕНЕНИЯ
                </h3>
                
                {(() => {
                  const changes = getChangedItems(selectedRequest.old_items_data, selectedRequest.new_items_data)
                  
                  if (changes.added.length === 0 && changes.modified.length === 0 && changes.removed.length === 0) {
                    return (
                      <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: 'var(--muted)',
                        background: 'var(--panel)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>
                          Изменений не обнаружено
                        </p>
                      </div>
                    )
                  }
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Добавленные элементы */}
                      {changes.added.length > 0 && (
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500', color: '#10b981' }}>
                            ➕ Добавлено ({changes.added.length}):
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {changes.added.map((item, idx) => (
                              <div key={idx} style={{
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '6px',
                                padding: '12px',
                                fontSize: '13px'
                              }}>
                                <div style={{ fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
                                  {item.name}
                                </div>
                                <div style={{ color: 'var(--muted)' }}>
                                  {item.quantity} {item.unit} • {item.start_date} - {item.end_date}
                                </div>
                                {item.sub_areas && item.sub_areas.length > 0 && (
                                  <div style={{ marginTop: '4px', color: 'var(--muted)' }}>
                                    Участки: {item.sub_areas.map(sa => sa.name).join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Измененные элементы */}
                      {changes.modified.length > 0 && (
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500', color: '#f59e0b' }}>
                            ✏️ Изменено ({changes.modified.length}):
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {changes.modified.map((change, idx) => (
                              <div key={idx} style={{
                                background: 'var(--panel)',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                padding: '12px',
                                fontSize: '13px'
                              }}>
                                <div style={{ fontWeight: '500', color: 'var(--text)', marginBottom: '8px' }}>
                                  {change.old.name}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {change.changedFields.map((fieldChange, fieldIdx) => (
                                    <div key={fieldIdx} style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ color: '#dc2626', marginBottom: '2px', fontSize: '11px', fontWeight: '500' }}>
                                          {fieldChange.field === 'name' ? 'Название' :
                                           fieldChange.field === 'quantity' ? 'Количество' :
                                           fieldChange.field === 'unit' ? 'Единица' :
                                           fieldChange.field === 'start_date' ? 'Дата начала' :
                                           fieldChange.field === 'end_date' ? 'Дата окончания' :
                                           fieldChange.field === 'sub_areas' ? 'Подполигоны' : fieldChange.field}:
                                        </div>
                                        <div style={{ color: 'var(--muted)', fontSize: '11px' }}>
                                          {fieldChange.field === 'sub_areas' ? 
                                            (fieldChange.old.length > 0 ? fieldChange.old.map(sa => sa.name).join(', ') : 'Нет') :
                                            fieldChange.old}
                                        </div>
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ color: '#16a34a', marginBottom: '2px', fontSize: '11px', fontWeight: '500' }}>
                                          Стало:
                                        </div>
                                        <div style={{ color: 'var(--muted)', fontSize: '11px' }}>
                                          {fieldChange.field === 'sub_areas' ? 
                                            (fieldChange.new.length > 0 ? fieldChange.new.map(sa => sa.name).join(', ') : 'Нет') :
                                            fieldChange.new}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Удаленные элементы */}
                      {changes.removed.length > 0 && (
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500', color: '#ef4444' }}>
                            ➖ Удалено ({changes.removed.length}):
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {changes.removed.map((item, idx) => (
                              <div key={idx} style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                padding: '12px',
                                fontSize: '13px'
                              }}>
                                <div style={{ fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
                                  {item.name}
                                </div>
                                <div style={{ color: 'var(--muted)' }}>
                                  {item.quantity} {item.unit} • {item.start_date} - {item.end_date}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>

            {selectedRequest.status === 'pending' && (
              <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-light)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
                  Принятие решения:
                </h4>
                <textarea
                  className="input"
                  placeholder="Укажите комментарий к решению..."
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  rows={3}
                  style={{ width: '100%', resize: 'vertical', marginBottom: '12px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    onClick={() => handleDecision('reject')}
                    disabled={processing || !decisionComment.trim()}
                    style={{
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: processing || !decisionComment.trim() ? 'not-allowed' : 'pointer',
                      background: processing || !decisionComment.trim() ? '#6b7280' : '#ef4444',
                      color: 'white',
                      transition: 'all 0.2s ease',
                      opacity: processing || !decisionComment.trim() ? 0.6 : 1,
                      minWidth: '120px'
                    }}
                    onMouseEnter={(e) => {
                      if (!processing && decisionComment.trim()) {
                        e.target.style.background = '#dc2626'
                        e.target.style.transform = 'translateY(-1px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!processing && decisionComment.trim()) {
                        e.target.style.background = '#ef4444'
                        e.target.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    {processing ? 'Обработка...' : 'Отклонить'}
                  </button>
                  <button
                    onClick={() => handleDecision('approve')}
                    disabled={processing || !decisionComment.trim()}
                    style={{
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: processing || !decisionComment.trim() ? 'not-allowed' : 'pointer',
                      background: processing || !decisionComment.trim() ? '#6b7280' : '#10b981',
                      color: 'white',
                      transition: 'all 0.2s ease',
                      opacity: processing || !decisionComment.trim() ? 0.6 : 1,
                      minWidth: '120px'
                    }}
                    onMouseEnter={(e) => {
                      if (!processing && decisionComment.trim()) {
                        e.target.style.background = '#059669'
                        e.target.style.transform = 'translateY(-1px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!processing && decisionComment.trim()) {
                        e.target.style.background = '#10b981'
                        e.target.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    {processing ? 'Обработка...' : 'Одобрить'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
