import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getObject, getForemen, patchObject, requestActivation, getWorkPlans, createArea, getWorkPlan, updateWorkItemStatus, ikoActivationCheck, createViolation, createViolationWithPhotos, completeObjectBySSK, completeObjectByIKO, getViolations, getWorkItemDetails } from '../api/api.js'
import { getChangeRequests, makeChangeRequestDecision } from '../api/workPlans.js'
import AreaMap from './AreaMap.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import ViolationModal from '../components/ViolationModal.jsx'
import FileSelectorModal from '../components/FileSelectorModal.jsx'
import NotificationToast from '../components/NotificationToast.jsx'
import { useNotification } from '../hooks/useNotification.js'

function Progress({ value }){
  return <div className="progress"><span style={{width: value+'%'}}/></div>
}

function Modal({ open, onClose, children, style }){
  if(!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose} style={{zIndex: 9998}}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={style}>
        {children}
      </div>
    </div>
  )
}

export default function ObjectDetail(){
  const { id } = useParams()
  const { user } = useAuth()
  const { notification, showSuccess, showError, hide } = useNotification()
  const [obj, setObj] = useState(null)
  const [loading, setLoading] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [foremen, setForemen] = useState([])
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [workPlans, setWorkPlans] = useState([])
  const [workPlansLoading, setWorkPlansLoading] = useState(false)
  const [workPlanDetails, setWorkPlanDetails] = useState(null)
  const [updatingItems, setUpdatingItems] = useState(new Set())
  const [areaModalOpen, setAreaModalOpen] = useState(false)
  const [areaName, setAreaName] = useState('Строительный участок')
  const [areaGeometryText, setAreaGeometryText] = useState('')
  const [areaSaving, setAreaSaving] = useState(false)
  const [activationModalOpen, setActivationModalOpen] = useState(false)
  const [checklistData, setChecklistData] = useState({})
  const [activationSaving, setActivationSaving] = useState(false)
  const [violationModalOpen, setViolationModalOpen] = useState(false)
  const [violationData, setViolationData] = useState({
    title: '',
    description: ''
  })
  const [violationSaving, setViolationSaving] = useState(false)
  const [fileSelectorOpen, setFileSelectorOpen] = useState(false)
  const [selectedStorageFiles, setSelectedStorageFiles] = useState([])
  const [visibleSubAreas, setVisibleSubAreas] = useState(new Set())
  const [violations, setViolations] = useState([])
  const [violationsLoading, setViolationsLoading] = useState(false)
  const [selectedViolation, setSelectedViolation] = useState(null)
  const [violationDetailModalOpen, setViolationDetailModalOpen] = useState(false)
  
  // Состояние для запросов на изменение
  const [changeRequests, setChangeRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [requestDetailModalOpen, setRequestDetailModalOpen] = useState(false)
  const [decisionModalOpen, setDecisionModalOpen] = useState(false)
  const [decision, setDecision] = useState('')
  const [decisionComment, setDecisionComment] = useState('')
  const [editedItems, setEditedItems] = useState([])
  const [processing, setProcessing] = useState(false)
  
  // Состояние для детального просмотра работы
  const [workItemDetailModalOpen, setWorkItemDetailModalOpen] = useState(false)
  const [selectedWorkItem, setSelectedWorkItem] = useState(null)
  const [workItemDetails, setWorkItemDetails] = useState(null)
  const [workItemDetailsLoading, setWorkItemDetailsLoading] = useState(false)
  const [expandedDeliveries, setExpandedDeliveries] = useState(new Set())

  // Инициализация видимых подполигонов
  useEffect(() => {
    if (workPlanDetails?.work_items) {
      const allSubAreaIds = workPlanDetails.work_items
        .flatMap(item => item.sub_areas?.map(subArea => subArea.id) || [])
      setVisibleSubAreas(new Set(allSubAreaIds))
    }
  }, [workPlanDetails])

  const ChecklistItem = ({ id, text }) => (
    <div className="row" style={{gap:8, alignItems:'center', padding:'8px 12px', borderRadius:'6px', backgroundColor: checklistData[id] ? 'var(--bg-light)' : 'transparent', border: checklistData[id] ? '1px solid var(--border)' : '1px solid transparent'}}>
      <span style={{flex:1}}>{text}</span>
      <div className="row" style={{gap:12}}>
        <label style={{display:'flex', alignItems:'center', gap:4, cursor:'pointer'}}>
          <input type="radio" name={id} value="true" checked={checklistData[id] === 'true'} onChange={e=>setChecklistData(prev=>({...prev, [id]: e.target.value}))} />
          <span>Да</span>
        </label>
        <label style={{display:'flex', alignItems:'center', gap:4, cursor:'pointer'}}>
          <input type="radio" name={id} value="false" checked={checklistData[id] === 'false'} onChange={e=>setChecklistData(prev=>({...prev, [id]: e.target.value}))} />
          <span>Нет</span>
        </label>
        <label style={{display:'flex', alignItems:'center', gap:4, cursor:'pointer'}}>
          <input type="radio" name={id} value="not_required" checked={checklistData[id] === 'not_required'} onChange={e=>setChecklistData(prev=>({...prev, [id]: e.target.value}))} />
          <span>Не требуется</span>
        </label>
      </div>
    </div>
  )

  useEffect(()=>{
    getObject(id).then(o=>{ console.log('[ui object-detail] loaded', o); setObj(o) }).catch(e=>{ console.warn('[ui object-detail] error', e); setObj(null) }).finally(()=>setLoading(false))
  }, [id])

  useEffect(()=>{
    if(!obj) return
    setWorkPlansLoading(true)
    getWorkPlans({ object_id: obj.id }).then(plans=>{
      console.log('[ui object-detail] work plans loaded', plans)
      setWorkPlans(plans.items || [])
      // Загружаем детали первого плана, если есть
      if(plans.items && plans.items.length > 0) {
        getWorkPlan(plans.items[0].id).then(details => {
          console.log('[ui object-detail] work plan details loaded', details)
          setWorkPlanDetails(details)
        }).catch(e => {
          console.warn('[ui object-detail] work plan details error', e)
          setWorkPlanDetails(null)
        })
      } else {
        setWorkPlanDetails(null)
      }
    }).catch(e=>{
      console.warn('[ui object-detail] work plans error', e)
      setWorkPlans([])
      setWorkPlanDetails(null)
    }).finally(()=>setWorkPlansLoading(false))
  }, [obj])

  // Загрузка нарушений для объекта
  useEffect(()=>{
    if(!obj) return
    setViolationsLoading(true)
    getViolations({ object_id: obj.id }).then(res=>{
      console.log('[ui object-detail] violations loaded', res)
      setViolations(res.items || [])
    }).catch(e=>{
      console.warn('[ui object-detail] violations error', e)
      setViolations([])
    }).finally(()=>setViolationsLoading(false))
  }, [obj])

  // Загрузка запросов на изменение для ССК
  useEffect(()=>{
    if(!obj || user?.role !== 'ssk') return
    loadChangeRequests()
  }, [obj, user])

  const openAssign = async () => {
    const res = await getForemen()
    setForemen(res.items)
    setAssignOpen(true)
  }

  const assign = async () => {
    if(!selected) return
    setSaving(true)
    const updated = await patchObject(obj.id, { foreman_id: selected.id })
    setObj(updated)
    setSaving(false)
    setAssignOpen(false)
  }

  function AreasPreview({ areas = [] }){
    if (!areas.length) return <div className="muted">Полигоны не заданы</div>
    // Соберём все координаты, чтобы нормировать в SVG 200x200
    const coords = []
    areas.forEach(a => {
      const g = a.geometry
      if (!g) return
      if (g.type === 'Polygon') {
        g.coordinates[0].forEach(([x,y]) => coords.push({ x, y }))
      } else if (g.type === 'MultiPolygon') {
        g.coordinates.forEach(poly => poly[0].forEach(([x,y]) => coords.push({ x, y })))
      }
    })
    if (!coords.length) return <div className="muted">Нет координат для отображения</div>
    const minX = Math.min(...coords.map(c=>c.x))
    const maxX = Math.max(...coords.map(c=>c.x))
    const minY = Math.min(...coords.map(c=>c.y))
    const maxY = Math.max(...coords.map(c=>c.y))
    const w = 220, h = 220, pad = 10
    const scaleX = (w - pad*2) / Math.max(1e-9, (maxX - minX))
    const scaleY = (h - pad*2) / Math.max(1e-9, (maxY - minY))
    const s = Math.min(scaleX, scaleY)
    const toSvg = ([x,y]) => {
      const sx = pad + (x - minX) * s
      const sy = pad + (maxY - y) * s // инвертируем Y для SVG
      return `${sx},${sy}`
    }
    return (
      <div className="row" style={{gap:12, flexWrap:'wrap'}}>
        {areas.map(a => (
          <div key={a.id || a.uuid_area} className="card" style={{padding:8}}>
            <div className="row" style={{justifyContent:'space-between', marginBottom:6}}>
              <strong>{a.name || `Area #${a.id}`}</strong>
              {(a.uuid_area||a.id) && <span className="pill" style={{fontSize:12}}>{a.uuid_area||a.id}</span>}
            </div>
            <svg width={w} height={h} style={{border:'1px solid var(--border)', borderRadius:6}}>
              {a.geometry?.type === 'Polygon' && (
                <polygon
                  points={a.geometry.coordinates[0].map(pt=>toSvg(pt)).join(' ')}
                  fill="#22c55e22" stroke="#16a34a" strokeWidth="2" />
              )}
              {a.geometry?.type === 'MultiPolygon' && a.geometry.coordinates.map((poly, idx)=>(
                <polygon key={idx}
                  points={poly[0].map(pt=>toSvg(pt)).join(' ')}
                  fill="#22c55e22" stroke="#16a34a" strokeWidth="2" />
              ))}
            </svg>
          </div>
        ))}
      </div>
    )
  }

  if(loading) return <div className="card">Загрузка…</div>
  if(!obj) return <div className="card">Объект не найден</div>

  function getStatusInfo(status) {
    const statusMap = {
      'draft': { label: 'Новый', color: '#ea580c', bgColor: '#fff7ed' },
      'activation_pending': { 
        label: obj?.iko ? 'Ожидает подтверждения активации' : 'Ожидает активации', 
        color: '#ca8a04', 
        bgColor: '#fefce8' 
      },
      'active': { label: 'Активен', color: '#15803d', bgColor: '#f0fdf4' },
      'suspended': { label: 'Приостановлен', color: '#ca8a04', bgColor: '#fefce8' },
      'completed_by_ssk': { label: 'Завершён ССК', color: '#7c3aed', bgColor: '#f3e8ff' },
      'completed': { label: 'Завершён', color: '#6b7280', bgColor: '#f9fafb' }
    }
    return statusMap[status] || { label: status || '—', color: '#6b7280', bgColor: '#f9fafb' }
  }

  function getViolationStatusInfo(status) {
    const statusMap = {
      'open': { label: 'Открыто', color: '#ef4444' },
      'fixed': { label: 'Исправлено', color: '#f59e0b' },
      'awaiting_verification': { label: 'Ожидает проверки', color: '#f59e0b' },
      'verified': { label: 'Проверено', color: '#10b981' },
      'closed': { label: 'Закрыто', color: '#6b7280' }
    }
    return statusMap[status] || { label: status, color: '#6b7280' }
  }

  const openViolationDetailModal = (violation) => {
    setSelectedViolation(violation)
    setViolationDetailModalOpen(true)
  }

  const closeViolationDetailModal = () => {
    setSelectedViolation(null)
    setViolationDetailModalOpen(false)
  }

  // Функции для работы с запросами на изменение
  const loadChangeRequests = async () => {
    if (user?.role !== 'ssk') return
    
    setRequestsLoading(true)
    try {
      const response = await getChangeRequests({ object_id: id })
      setChangeRequests(response.items || [])
    } catch (error) {
      console.error('Ошибка загрузки запросов:', error)
      showError('Ошибка загрузки запросов: ' + (error?.message || ''))
    } finally {
      setRequestsLoading(false)
    }
  }

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
      setRequestDetailModalOpen(false)
      setDecisionComment('')
      setEditedItems([])
      loadChangeRequests() // Перезагружаем список
      
      // Обновляем рабочий план после принятия решения
      if (workPlanDetails && decisionType === 'approve') {
        try {
          const updated = await getWorkPlan(workPlanDetails.id)
          setWorkPlanDetails(updated)
        } catch (e) {
          console.warn('Ошибка обновления плана работ:', e)
        }
      }
    } catch (error) {
      console.error('Ошибка принятия решения:', error)
      showError('Ошибка принятия решения: ' + (error?.message || ''))
    } finally {
      setProcessing(false)
    }
  }

  const openDecisionModal = (request) => {
    setSelectedRequest(request)
    setDecisionComment('')
    setEditedItems(request.new_items_data || [])
    setDecisionModalOpen(true)
  }

  const openRequestDetailModal = (request) => {
    setSelectedRequest(request)
    setRequestDetailModalOpen(true)
  }

  // Открытие модалки детального просмотра работы
  const openWorkItemDetailModal = async (workItem) => {
    setSelectedWorkItem(workItem)
    setWorkItemDetailModalOpen(true)
    setWorkItemDetailsLoading(true)
    setExpandedDeliveries(new Set()) // Сбрасываем раскрытые поставки
    
    try {
      const details = await getWorkItemDetails(workItem.id)
      setWorkItemDetails(details)
    } catch (error) {
      console.error('Ошибка загрузки деталей работы:', error)
      showError('Ошибка загрузки деталей работы: ' + (error?.message || ''))
    } finally {
      setWorkItemDetailsLoading(false)
    }
  }

  // Переключение раскрытия поставки
  const toggleDeliveryExpansion = (deliveryId) => {
    setExpandedDeliveries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(deliveryId)) {
        newSet.delete(deliveryId)
      } else {
        newSet.add(deliveryId)
      }
      return newSet
    })
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

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает решения',
      'approved': 'Одобрено',
      'rejected': 'Отклонено',
      'edited': 'Отредактировано'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#f59e0b',
      'approved': '#10b981',
      'rejected': '#ef4444',
      'edited': '#3b82f6'
    }
    return colorMap[status] || '#6b7280'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusInfo = getStatusInfo(obj?.status)

  return (
    <div className="page">
      <NotificationToast 
        notification={notification} 
        onClose={hide} 
      />
      {/* Заголовок и основная информация */}
      <div style={{marginBottom: '32px'}}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '8px'
            }}>
              <h1 style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '700',
                color: 'var(--text)'
              }}>
                {obj.name}
              </h1>
              <div style={{
                padding: '8px 16px',
                backgroundColor: statusInfo.bgColor,
                color: statusInfo.color,
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                border: `1px solid ${statusInfo.color}30`
              }}>
                {statusInfo.label}
              </div>
            </div>
            <p style={{
              margin: 0,
              color: 'var(--muted)',
              fontSize: '16px'
            }}>
              {obj.address}
            </p>
          </div>
        </div>

        {/* Панель действий */}
        {(user?.role === 'ssk' || user?.role === 'iko') && (
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              {/* Заголовок */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text)',
                fontWeight: '600',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Действия {user?.role === 'ssk' ? 'ССК' : 'ИКО'}:
              </div>

              {/* Кнопки действий */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
                flexWrap: 'wrap'
              }}>
                {/* Действия ССК */}
                {user?.role === 'ssk' && (
                  <>
                    {!obj.ssk ? (
                      <button 
                        className="btn small" 
                        onClick={async()=>{ 
                          try{
                            const u = await patchObject(obj.id, { ssk_id: user.id }); 
                            setObj(u);
                            showSuccess('Вы стали ответственным за объект')
                          }catch(e){
                            showError('Ошибка: ' + (e?.message || ''))
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          borderRadius: '6px',
                          boxShadow: 'none'
                        }}
                      >
                        Стать ответственным
                      </button>
                    ) : obj.ssk.id === user.id ? (
                      <>
                    {!obj.foreman && (
                      <button 
                        className="btn small" 
                        onClick={openAssign}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          borderRadius: '6px',
                          boxShadow: 'none'
                        }}
                      >
                        Назначить прораба
                      </button>
                    )}
                     {workPlans.length === 0 && (obj.areas?.length||0) > 0 && (
                      <button 
                        className="btn small" 
                        onClick={()=>location.assign(`/work-plans/new/${id}`)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          borderRadius: '6px',
                          boxShadow: 'none'
                        }}
                      >
                        Добавить график работ
                      </button>
                    )}
                    {(obj.areas?.length||0) === 0 && (
                      <button 
                        className="btn small" 
                        onClick={()=>setAreaModalOpen(true)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          borderRadius: '6px',
                          boxShadow: 'none'
                        }}
                      >
                        Создать полигон
                      </button>
                    )}
                    {obj.ssk && obj.foreman && workPlans.length > 0 && (obj.areas?.length||0) > 0 && !obj.iko && (
                      <button 
                        className="btn small" 
                        onClick={async()=>{ 
                          try{
                            await requestActivation(obj.id);
                            showSuccess('Запрос на активацию отправлен')
                            const updated = await getObject(id);
                            setObj(updated);
                          }catch(e){
                            showError('Ошибка активации: ' + (e?.message || ''))
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          boxShadow: 'none'
                        }}
                      >
                        Запросить активацию
                      </button>
                    )}
                    {obj.status === 'active' && Number(obj.work_progress ?? 0) === 100 && (
                      <button 
                        className="btn small" 
                        onClick={async()=>{ 
                          try{
                            await completeObjectBySSK(obj.id);
                            showSuccess('Объект завершён ССК')
                            const updated = await getObject(id);
                            setObj(updated);
                          }catch(e){
                            showError('Ошибка завершения: ' + (e?.message || ''))
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: '#7c3aed',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          boxShadow: 'none'
                        }}
                      >
                        Завершить объект
                      </button>
                    )}
                     {obj.status === 'active' && (
                       <button 
                         className="btn small" 
                         onClick={()=>setViolationModalOpen(true)}
                         style={{
                           padding: '6px 12px',
                           fontSize: '12px',
                           fontWeight: '500',
                           borderRadius: '6px',
                           boxShadow: 'none'
                         }}
                       >
                         Выписать нарушение
                      </button>
                     )}
                      </>
                    ) : (
                      <div style={{
                        color: 'var(--muted)',
                        fontSize: '12px',
                        fontStyle: 'italic'
                      }}>
                        Объект уже назначен другому ССК
                      </div>
                    )}
                  </>
                )}

                {/* Действия ИКО */}
                {user?.role === 'iko' && (
                  <>
                    {obj.status === 'activation_pending' && (
                      <button 
                        className="btn small" 
                        onClick={()=>setActivationModalOpen(true)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          boxShadow: 'none'
                        }}
                      >
                        Подтвердить активацию
                      </button>
                    )}
                    {obj.status === 'completed_by_ssk' && (
                      <button 
                        className="btn small" 
                        onClick={async()=>{ 
                          try{
                            await completeObjectByIKO(obj.id);
                            showSuccess('Объект полностью завершён')
                            const updated = await getObject(id);
                            setObj(updated);
                          }catch(e){
                            showError('Ошибка завершения: ' + (e?.message || ''))
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: '#1d4ed8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          boxShadow: 'none'
                        }}
                      >
                        Завершить
                      </button>
                    )}
                  </>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
      
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '20px',
          fontWeight: '600',
          color: 'var(--text)'
        }}>
          Информация об объекте
        </h3>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              padding: '8px 12px',
              backgroundColor: obj.iko ? '#f0fdf4' : '#fefce8',
              border: `1px solid ${obj.iko ? '#22c55e' : '#eab308'}`,
              borderRadius: '8px',
              fontSize: '14px',
              color: obj.iko ? '#15803d' : '#a16207',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span style={{fontWeight: '600'}}>ИКО:</span>
              {obj.iko?.full_name || obj.iko?.email || '—'}
            </div>
            <div style={{
              padding: '8px 12px',
              backgroundColor: obj.ssk ? '#f0fdf4' : '#fefce8',
              border: `1px solid ${obj.ssk ? '#22c55e' : '#eab308'}`,
              borderRadius: '8px',
              fontSize: '14px',
              color: obj.ssk ? '#15803d' : '#a16207',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span style={{fontWeight: '600'}}>ССК:</span>
              {obj.ssk?.full_name || obj.ssk?.email || '—'}
            </div>
            <div style={{
              padding: '8px 12px',
              backgroundColor: obj.foreman ? '#f0fdf4' : '#fefce8',
              border: `1px solid ${obj.foreman ? '#22c55e' : '#eab308'}`,
              borderRadius: '8px',
              fontSize: '14px',
              color: obj.foreman ? '#15803d' : '#a16207',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span style={{fontWeight: '600'}}>Прораб:</span>
              {obj.foreman?.full_name || obj.foreman?.email || '—'}
            </div>
          </div>
          
          <div style={{
            background: 'var(--bg-light)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text)'
              }}>
                Прогресс выполнения
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--brand)'
              }}>
                {obj.work_progress ?? 0}%
          </span>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${obj.work_progress ?? 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--brand), #ffb454)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '20px',
          flexWrap: 'wrap'
        }}>
          {obj.visits && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--text)',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              <span style={{fontWeight: '600'}}>Посещения:</span>
              ССК: {obj.visits?.ssk ?? 0} | ИКО: {obj.visits?.iko ?? 0} | Прораб: {obj.visits?.foreman ?? 0}
            </div>
          )}
          {obj.deliveries_today != null && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--text)',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 3h5v5"/>
                <path d="M8 3H3v5"/>
                <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/>
                <path d="M21 3l-7.828 7.828A4 4 0 0 0 12 13.172V22"/>
              </svg>
              <span style={{fontWeight: '600'}}>Поставки сегодня:</span>
              {obj.deliveries_today}
            </div>
          )}
        </div>
      </div>

      {(obj.areas && obj.areas.length > 0) && (
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
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--text)'
            }}>
              Геозона объекта
            </h3>
            <div style={{
              padding: '6px 12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--muted)',
              fontWeight: '500'
            }}>
              Просмотр полигона
            </div>
          </div>
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <AreaMap
              readOnly
              disableScrollZoom={true}
              polygons={(() => {
                const mainPolygons = (obj.areas||[]).map(a=>({ geometry: a.geometry, name: a.name, color: '#3b82f6' }))
                const subPolygons = (workPlanDetails?.work_items?.flatMap(item => 
                  item.sub_areas?.filter(subArea => visibleSubAreas.has(subArea.id))
                    .map(subArea => ({
                      geometry: subArea.geometry,
                      name: subArea.name,
                      color: subArea.color || '#6b7280'
                    })) || []
                ) || [])
                
                return [...mainPolygons, ...subPolygons]
              })()}
            />
            
            {/* Селекторы подполигонов */}
            {workPlanDetails?.work_items && workPlanDetails.work_items.some(item => item.sub_areas?.length > 0) && (
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--muted)',
                    whiteSpace: 'nowrap'
                  }}>
                    Управление подполигонами:
                  </span>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                  {workPlanDetails.work_items.flatMap(item => 
                    item.sub_areas?.map(subArea => (
                      <label key={subArea.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        border: `2px solid ${visibleSubAreas.has(subArea.id) ? (subArea.color || '#6b7280') : 'var(--border)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        userSelect: 'none',
                        fontSize: '13px',
                        fontWeight: '500',
                        boxShadow: visibleSubAreas.has(subArea.id) ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: visibleSubAreas.has(subArea.id) ? 'white' : (subArea.color || '#6b7280'),
                          border: visibleSubAreas.has(subArea.id) ? `2px solid ${subArea.color || '#6b7280'}` : '2px solid white',
                          boxShadow: '0 0 0 1px var(--border)'
                        }} />
                        <span>
                          {subArea.name}
                        </span>
                        <input
                          type="checkbox"
                          checked={visibleSubAreas.has(subArea.id)}
                          onChange={(e) => {
                            const newVisible = new Set(visibleSubAreas)
                            if (e.target.checked) {
                              newVisible.add(subArea.id)
                            } else {
                              newVisible.delete(subArea.id)
                            }
                            setVisibleSubAreas(newVisible)
                          }}
                          style={{ 
                            position: 'absolute',
                            opacity: 0,
                            pointerEvents: 'none'
                          }}
                        />
                      </label>
                    )) || []
                  )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '20px',
          fontWeight: '600',
          color: 'var(--text)'
        }}>
          Рабочий план
        </h3>
        
        {workPlansLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
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
            Загрузка плана...
          </div>
        ) : workPlans.length > 0 && workPlanDetails ? (
          <>
            {/* Информация о плане - компактная */}
            <div style={{
              background: 'var(--bg-light)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px 12px',
              marginBottom: '16px',
                display: 'flex',
              alignItems: 'center',
                justifyContent: 'space-between',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text)'
                  }}>
                    {workPlans[0].title || `План #${workPlans[0].id}`}
                </span>
                    <span style={{
                  padding: '2px 6px',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--muted)',
                  borderRadius: '4px',
                  fontSize: '11px',
                      fontWeight: '500',
                      border: '1px solid var(--border)'
                    }}>
                      ID: {workPlans[0].id}
                    </span>
                    <span style={{
                  padding: '2px 6px',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--muted)',
                  borderRadius: '4px',
                  fontSize: '11px',
                      fontWeight: '500',
                      border: '1px solid var(--border)'
                    }}>
                  {new Date(workPlans[0].created_at).toLocaleDateString('ru-RU')}
                    </span>
                    {workPlans[0].versions && workPlans[0].versions.length > 0 && (
                      <span style={{
                    padding: '2px 6px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--muted)',
                    borderRadius: '4px',
                    fontSize: '11px',
                        fontWeight: '500',
                        border: '1px solid var(--border)'
                      }}>
                    📝 {workPlans[0].versions.length} версий
                      </span>
                    )}
                  </div>
              
              {/* Кнопка редактирования плана */}
              {(user?.role === 'ssk' || user?.role === 'foreman') && (
                <button
                  className="btn small"
                  onClick={() => {
                    // Переходим на страницу создания плана с параметрами редактирования
                    const editParams = new URLSearchParams({
                      edit: 'true',
                      planId: workPlans[0].id,
                      objectId: id
                    })
                    window.location.href = `/work-plans/new/${id}?${editParams.toString()}`
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    background: 'var(--brand)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#e67e00'
                    e.target.style.transform = 'translateY(-1px)'
                    e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--brand)'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                  }}
         >
           Редактировать план
         </button>
              )}
            </div>

            {/* Таблица элементов работ */}
            {workPlanDetails.work_items && workPlanDetails.work_items.length > 0 ? (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text)'
                  }}>
                    Элементы работ ({workPlanDetails.work_items.length})
                  </h4>
                </div>
                
                <div style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '20px'
                }}>
                  {/* Заголовок таблицы */}
                  <div style={{
                    background: 'linear-gradient(135deg, var(--brand) 0%, #1f2937 100%)',
                    padding: '16px 20px',
                        borderBottom: '1px solid var(--border)'
                      }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: (user?.role === 'ssk' || user?.role === 'foreman') ? '2fr 100px 100px 150px 150px 200px 280px' : '2fr 100px 100px 150px 150px 200px',
                      gap: '12px',
                      alignItems: 'center',
                          fontWeight: '600',
                      fontSize: '14px',
                      color: 'white',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      <div>Название работы</div>
                      <div>Кол-во</div>
                      <div>Единица</div>
                      <div>Период</div>
                      <div>Статус</div>
                      <div>Подполигоны</div>
                        {(user?.role === 'ssk' || user?.role === 'foreman') && (
                        <div>Действия</div>
                      )}
                    </div>
                  </div>
                  {/* Строки таблицы */}
                      {workPlanDetails.work_items.map((item, idx) => (
                    <div key={item.id || idx} 
                      onClick={() => openWorkItemDetailModal(item)}
                      style={{
                        padding: '16px 20px',
                        borderBottom: idx < workPlanDetails.work_items.length - 1 ? '1px solid var(--border)' : 'none',
                        background: idx % 2 === 0 ? 'var(--panel)' : 'rgba(0, 0, 0, 0.15)',
                        transition: 'background-color 0.2s ease',
                        cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                        e.target.style.background = 'var(--bg-secondary)'
                        }}
                        onMouseLeave={(e) => {
                      e.target.style.background = idx % 2 === 0 ? 'var(--panel)' : 'rgba(0, 0, 0, 0.15)'
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: (user?.role === 'ssk' || user?.role === 'foreman') ? '2fr 100px 100px 150px 150px 200px 280px' : '2fr 100px 100px 150px 150px 200px',
                        gap: '12px',
                        alignItems: 'center'
                      }}>
                        <div style={{
                            color: 'var(--text)',
                            fontWeight: '500'
                          }}>
                            {item.name}
                        </div>
                        <div style={{
                            color: 'var(--text)'
                          }}>
                            {item.quantity || '—'}
                        </div>
                        <div style={{
                            color: 'var(--muted)',
                            fontSize: '13px'
                          }}>
                            {item.unit || '—'}
                        </div>
                        <div style={{
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
                        </div>
                        <div>
                            <span style={{
                              background: (item.status === 'pending' || item.status === 'planned') ? '#fef3c7' : 
                                         item.status === 'in_progress' ? '#dbeafe' : 
                                         item.status === 'completed_foreman' ? '#fef3c7' : 
                                         item.status === 'completed_ssk' ? '#d1fae5' : 
                                         item.status === 'done' ? '#d1fae5' : 'var(--bg-secondary)',
                              color: (item.status === 'pending' || item.status === 'planned') ? '#92400e' : 
                                    item.status === 'in_progress' ? '#1e40af' : 
                                    item.status === 'completed_foreman' ? '#92400e' : 
                                    item.status === 'completed_ssk' ? '#065f46' : 
                                    item.status === 'done' ? '#065f46' : 'var(--muted)',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              {(item.status === 'pending' || item.status === 'planned') ? 'Запланировано' : 
                               item.status === 'in_progress' ? 'В работе' : 
                               item.status === 'completed_foreman' ? 'На проверке' : 
                               item.status === 'completed_ssk' ? 'Выполнено' : 
                               item.status === 'done' ? 'Готово' : item.status}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-start' }}>
                          {item.sub_areas && item.sub_areas.length > 0 ? (
                            item.sub_areas.map((subArea, subIdx) => (
                               <div key={subArea.id || subIdx} style={{
                                 display: 'inline-flex',
                                 alignItems: 'center',
                                 gap: '8px',
                                 padding: '6px 10px',
                                 background: 'var(--bg-light)',
                                 borderRadius: '6px',
                                 border: '1px solid var(--border)',
                                 whiteSpace: 'nowrap',
                                 maxWidth: 'fit-content'
                               }}>
                                 <div style={{
                                   width: '12px',
                                   height: '12px',
                                   borderRadius: '50%',
                                   background: subArea.color || '#6b7280',
                                   border: '2px solid white',
                                   boxShadow: '0 0 0 1px var(--border)',
                                   flexShrink: 0
                                 }} />
                                 <span style={{
                                  fontSize: '12px',
                                   color: 'var(--text)',
                                   fontWeight: '500',
                                   whiteSpace: 'nowrap',
                                   overflow: 'hidden',
                                   textOverflow: 'ellipsis',
                                   maxWidth: '140px'
                                 }}>
                                   {subArea.name}
                                 </span>
                               </div>
                            ))
                            ) : (
                              <span style={{color: 'var(--muted)', fontSize: '13px'}}>—</span>
                            )}
                        </div>
                          {(user?.role === 'ssk' || user?.role === 'foreman') && obj.status === 'active' && (
                          <div>
                              <div style={{display: 'flex', gap: '6px'}}>
                                {/* Начать работу - могут и прораб и ССК */}
                                {(item.status === 'pending' || item.status === 'planned') && (
                                  <button 
                                    className="btn small" 
                                    disabled={updatingItems.has(item.id)}
                                    onClick={async (e) => {
                                      e.stopPropagation() // Предотвращаем всплытие события
                                      setUpdatingItems(prev => new Set(prev).add(item.id))
                                      try {
                                        await updateWorkItemStatus(item.id, 'in_progress')
                                        const updated = await getWorkPlan(workPlanDetails.id)
                                        setWorkPlanDetails(updated)
                                      } catch (e) {
                                      showError('Ошибка обновления статуса: ' + (e?.message || ''))
                                      } finally {
                                        setUpdatingItems(prev => {
                                          const next = new Set(prev)
                                          next.delete(item.id)
                                          return next
                                        })
                                      }
                                    }}
                                    style={{
                                    padding: '6px 12px',
                                      fontSize: '12px',
                                      background: updatingItems.has(item.id) ? '#6b7280' : '#ff8a00',
                                      color: 'white',
                                      border: 'none',
                                    borderRadius: '6px',
                                      cursor: updatingItems.has(item.id) ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                      transition: 'all 0.2s ease',
                                      opacity: updatingItems.has(item.id) ? 0.7 : 1,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    minWidth: '70px',
                                    whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!updatingItems.has(item.id)) {
                                        e.target.style.background = '#e67e00'
                                        e.target.style.transform = 'translateY(-1px)'
                                        e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!updatingItems.has(item.id)) {
                                        e.target.style.background = '#ff8a00'
                                        e.target.style.transform = 'translateY(0)'
                                        e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                                      }
                                    }}
                                  >
                                    {updatingItems.has(item.id) ? '...' : 'Начать'}
                                  </button>
                                )}

                                {/* Завершить работу - только прораб */}
                                {item.status === 'in_progress' && user?.role === 'foreman' && (
                                  <button 
                                    className="btn small" 
                                    disabled={updatingItems.has(item.id)}
                                    onClick={async (e) => {
                                      e.stopPropagation() // Предотвращаем всплытие события
                                      setUpdatingItems(prev => new Set(prev).add(item.id))
                                      try {
                                        await updateWorkItemStatus(item.id, 'completed_foreman')
                                        const updated = await getWorkPlan(workPlanDetails.id)
                                        setWorkPlanDetails(updated)
                                      } catch (e) {
                                      showError('Ошибка обновления статуса: ' + (e?.message || ''))
                                      } finally {
                                        setUpdatingItems(prev => {
                                          const next = new Set(prev)
                                          next.delete(item.id)
                                          return next
                                        })
                                      }
                                    }}
                                    style={{
                                    padding: '6px 12px',
                                      fontSize: '12px',
                                      background: updatingItems.has(item.id) ? '#6b7280' : '#22c55e',
                                      color: 'white',
                                      border: 'none',
                                    borderRadius: '6px',
                                      cursor: updatingItems.has(item.id) ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                      transition: 'all 0.2s ease',
                                      opacity: updatingItems.has(item.id) ? 0.7 : 1,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    minWidth: '70px',
                                    whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!updatingItems.has(item.id)) {
                                        e.target.style.background = '#16a34a'
                                        e.target.style.transform = 'translateY(-1px)'
                                        e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!updatingItems.has(item.id)) {
                                        e.target.style.background = '#22c55e'
                                        e.target.style.transform = 'translateY(0)'
                                        e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                                      }
                                    }}
                                  >
                                    {updatingItems.has(item.id) ? '...' : 'Завершить'}
                                  </button>
                                )}

                                {/* Действия ССК для проверки */}
                                {item.status === 'completed_foreman' && user?.role === 'ssk' && (
                                  <>
                                    <button 
                                      className="btn small" 
                                      disabled={updatingItems.has(item.id)}
                                      onClick={async (e) => {
                                        e.stopPropagation() // Предотвращаем всплытие события
                                        setUpdatingItems(prev => new Set(prev).add(item.id))
                                        try {
                                          await updateWorkItemStatus(item.id, 'in_progress')
                                          const updated = await getWorkPlan(workPlanDetails.id)
                                          setWorkPlanDetails(updated)
                                        } catch (e) {
                                        showError('Ошибка обновления статуса: ' + (e?.message || ''))
                                        } finally {
                                          setUpdatingItems(prev => {
                                            const next = new Set(prev)
                                            next.delete(item.id)
                                            return next
                                          })
                                        }
                                      }}
                                      style={{
                                      padding: '6px 10px',
                                      fontSize: '11px',
                                        background: updatingItems.has(item.id) ? '#6b7280' : '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                    borderRadius: '6px',
                                        cursor: updatingItems.has(item.id) ? 'not-allowed' : 'pointer',
                                      fontWeight: '600',
                                        transition: 'all 0.2s ease',
                                        opacity: updatingItems.has(item.id) ? 0.7 : 1,
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                      minWidth: '60px',
                                      whiteSpace: 'nowrap'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!updatingItems.has(item.id)) {
                                          e.target.style.background = '#dc2626'
                                          e.target.style.transform = 'translateY(-1px)'
                                          e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!updatingItems.has(item.id)) {
                                          e.target.style.background = '#ef4444'
                                          e.target.style.transform = 'translateY(0)'
                                          e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                                        }
                                      }}
                                    >
                                      {updatingItems.has(item.id) ? '...' : 'На доработку'}
                                    </button>
                                    <button 
                                      className="btn small" 
                                      disabled={updatingItems.has(item.id)}
                                      onClick={async (e) => {
                                        e.stopPropagation() // Предотвращаем всплытие события
                                        setUpdatingItems(prev => new Set(prev).add(item.id))
                                        try {
                                          await updateWorkItemStatus(item.id, 'completed_ssk')
                                          const updated = await getWorkPlan(workPlanDetails.id)
                                          setWorkPlanDetails(updated)
                                        } catch (e) {
                                        showError('Ошибка обновления статуса: ' + (e?.message || ''))
                                        } finally {
                                          setUpdatingItems(prev => {
                                            const next = new Set(prev)
                                            next.delete(item.id)
                                            return next
                                          })
                                        }
                                      }}
                                      style={{
                                      padding: '6px 10px',
                                      fontSize: '11px',
                                        background: updatingItems.has(item.id) ? '#6b7280' : '#22c55e',
                                        color: 'white',
                                        border: 'none',
                                      borderRadius: '6px',
                                        cursor: updatingItems.has(item.id) ? 'not-allowed' : 'pointer',
                                      fontWeight: '600',
                                        transition: 'all 0.2s ease',
                                        opacity: updatingItems.has(item.id) ? 0.7 : 1,
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                      minWidth: '60px',
                                      whiteSpace: 'nowrap'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!updatingItems.has(item.id)) {
                                          e.target.style.background = '#16a34a'
                                          e.target.style.transform = 'translateY(-1px)'
                                          e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!updatingItems.has(item.id)) {
                                          e.target.style.background = '#22c55e'
                                          e.target.style.transform = 'translateY(0)'
                                          e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                                        }
                                      }}
                                    >
                                      {updatingItems.has(item.id) ? '...' : 'Подтвердить'}
                                    </button>
                                  </>
                                )}

                                {/* Статус "Выполнено" - только в столбце статуса, не в действиях */}
                                {(item.status === 'completed_ssk' || item.status === 'done') && (
                                  <span style={{
                                    color: 'var(--muted)',
                                    fontSize: '13px',
                                    fontStyle: 'italic'
                                  }}>
                                    Нет действий
                                  </span>
                                )}
                              </div>
                          </div>
                          )}
                          {(user?.role === 'ssk' || user?.role === 'foreman') && obj.status !== 'active' && (
                          <div>
                              <span style={{
                                color: 'var(--muted)',
                                fontSize: '13px',
                                fontStyle: 'italic'
                              }}>
                                Объект не активирован
                              </span>
                          </div>
                          )}
                      </div>
                    </div>
                      ))}
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: 'var(--muted)',
                background: 'var(--bg-light)',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  В плане пока нет элементов работ
                </p>
              </div>
            )}
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--muted)'
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
              Рабочий план не найден
            </h4>
            <p style={{
              margin: 0,
              fontSize: '14px'
            }}>
              Для этого объекта пока нет созданного рабочего плана
            </p>
          </div>
        )}
      </div>

      {/* Блок запросов на изменение (только для ССК) */}
      {user?.role === 'ssk' && (
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text)'
          }}>
            Запросы на изменение плана
          </h3>
          
          {requestsLoading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              color: 'var(--muted)'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid var(--border)',
                borderTop: '2px solid var(--brand)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '12px'
              }} />
              Загрузка запросов...
            </div>
          ) : changeRequests.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: 'var(--muted)',
              background: 'var(--bg-light)',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Запросы на изменение отсутствуют
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {changeRequests.map((request) => (
                <div
                  key={request.id}
                  style={{
                    background: 'var(--bg-light)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                    e.currentTarget.style.borderColor = 'var(--brand)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-light)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                  onClick={() => openRequestDetailModal(request)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
                        Запрос #{request.id}
                      </h4>
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
        </div>
      )}

      {/* Блок нарушений */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '20px',
          fontWeight: '600',
          color: 'var(--text)'
        }}>
          Нарушения
        </h3>
        
        {violationsLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
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
            Загрузка нарушений...
          </div>
        ) : violations.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {violations.slice(0, 5).map(violation => {
              const statusInfo = getViolationStatusInfo(violation.status)
              const isAuthor = violation.author === user?.id
              const needsMyReview = (violation.status === 'fixed' || violation.status === 'awaiting_verification') && isAuthor
              const cannotReview = (violation.status === 'fixed' || violation.status === 'awaiting_verification') && !isAuthor
              
              return (
                <div 
                  key={violation.id} 
                  onClick={() => openViolationDetailModal(violation)}
                  style={{
                    background: needsMyReview ? 'var(--brand)05' : 'var(--bg-light)',
                    border: needsMyReview ? `1px solid var(--brand)30` : '1px solid var(--border)',
                    borderLeft: `4px solid ${statusInfo.color}`,
                    borderRadius: '8px',
                    padding: '16px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    boxShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = statusInfo.color
                    e.target.style.boxShadow = `0 2px 8px ${statusInfo.color}20`
                    e.target.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--border)'
                    e.target.style.borderLeftColor = statusInfo.color
                    e.target.style.boxShadow = 'none'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px'
                    }}>
                      <div style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: `${statusInfo.color}15`,
                        color: statusInfo.color,
                        fontSize: '11px',
                        fontWeight: '600',
                        border: `1px solid ${statusInfo.color}30`
                      }}>
                        {statusInfo.label}
                      </div>
                      {needsMyReview && (
                        <div style={{
                          padding: '2px 6px',
                          borderRadius: '8px',
                          background: 'var(--brand)',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          Ваша проверка
                        </div>
                      )}
                      {cannotReview && (
                        <div style={{
                          padding: '2px 6px',
                          borderRadius: '8px',
                          background: 'var(--muted)',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          🚫 Не ваше
                        </div>
                      )}
                      <h4 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'var(--text)'
                      }}>
                        {violation.title}
                      </h4>
                    </div>
                    
                    {violation.description && (
                      <p style={{
                        margin: '0 0 8px 0',
                        color: 'var(--text)',
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}>
                        {violation.description.length > 100 ? 
                          `${violation.description.substring(0, 100)}...` : 
                          violation.description
                        }
                      </p>
                    )}
                    
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      fontSize: '12px',
                      color: 'var(--muted)',
                      alignItems: 'center'
                    }}>
                      <span>{new Date(violation.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {violations.length > 5 && (
              <div style={{
                textAlign: 'center',
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <a 
                  href="/violations"
                  style={{
                    color: 'var(--brand)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Показать все нарушения ({violations.length})
                </a>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--muted)'
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
              color: '#10b981'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
              </svg>
            </div>
            <h4 style={{
              margin: '0 0 8px 0',
              color: 'var(--text)',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Нарушений не найдено
            </h4>
            <p style={{
              margin: 0,
              fontSize: '14px'
            }}>
              На этом объекте пока нет зарегистрированных нарушений
            </p>
          </div>
        )}
      </div>



      <Modal open={areaModalOpen} onClose={()=>setAreaModalOpen(false)} style={{ width:'95vw', maxWidth:'95vw' }}>
        <div style={{ width:'100%' }}> 
          <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
            <h3 style={{marginTop:0}}>Создать полигон</h3>
            <button className="btn ghost" onClick={()=>setAreaModalOpen(false)}>✕</button>
          </div>
          <div className="form">
            <div className="row" style={{gap:8, alignItems:'center'}}>
              <label style={{width:140}}>Название</label>
              <input className="input" placeholder="Строительный участок" value={areaName} onChange={e=>setAreaName(e.target.value)} />
            </div>
            <div style={{marginTop:8}}>
              <AreaMap
                polygons={[]}
                height={'75vh'}
                onPolygonCreated={async (geometry)=>{
                  try{
                    setAreaSaving(true)
                    await createArea({ name: areaName || 'Строительный участок', geometry, object: Number(id) })
                    const fresh = await getObject(id)
                    setObj(fresh)
                    setAreaModalOpen(false)
                  }catch(e){
                    showError('Ошибка сохранения: '+(e?.message||''))
                  }finally{
                    setAreaSaving(false)
                  }
                }}
              />
            </div>
            <div className="row" style={{justifyContent:'flex-end', gap:8, marginTop:8}}>
              <button className="btn ghost" onClick={()=>setAreaModalOpen(false)} disabled={areaSaving}>Отмена</button>
            </div>
          </div>
        </div>
      </Modal>
      <Modal open={assignOpen} onClose={()=>setAssignOpen(false)}>
        <h3 style={{marginTop:0}}>Назначить прораба</h3>
        <div className="form">
          <select className="input" onChange={e=>setSelected(foremen.find(f=>f.id===e.target.value))} defaultValue="">
            <option value="" disabled>Выберите прораба…</option>
            {foremen.map(f => <option key={f.id} value={f.id}>{f.full_name} — {f.phone}</option>)}
          </select>
          <div className="row" style={{justifyContent:'flex-end', gap:8}}>
            <button className="btn ghost" onClick={()=>setAssignOpen(false)}>Отмена</button>
            <button className="btn" onClick={assign} disabled={!selected || saving}>{saving?'Сохраняем…':'Назначить'}</button>
          </div>
        </div>
      </Modal>
      
      {/* Модалка активации объекта ИКО */}
      <Modal open={activationModalOpen} onClose={()=>setActivationModalOpen(false)} style={{ width:'90vw', maxWidth:'90vw', zIndex: 9999 }}>
        <div style={{ width:'100%' }}>
          <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
            <h3 style={{marginTop:0}}>Чек-лист активации объекта</h3>
            <button className="btn ghost" onClick={()=>setActivationModalOpen(false)}>✕</button>
          </div>
          <div className="form" style={{maxHeight:'70vh', overflow:'auto'}}>
            <div style={{marginBottom:20}}>
              <h4>1. Наличие разрешительной, организационно-технологической, рабочей документации</h4>
              <div style={{marginLeft:20, display:'flex', flexDirection:'column', gap:8}}>
                <ChecklistItem id="1.1" text="1.1. Наличие приказа на ответственное лицо, осуществляющего строительство (производство работ)" />
                <ChecklistItem id="1.2" text="1.2. Наличие приказа на ответственное лицо, осуществляющее строительный контроль" />
                <ChecklistItem id="1.3" text="1.3. Наличие приказа на ответственное лицо, осуществляющее подготовку проектной документации, авторский надзор" />
                <ChecklistItem id="1.4" text="1.4. Наличие проектной документации со штампом «В производство работ»" />
                <ChecklistItem id="1.5" text="1.5. Наличие проекта производства работ (утвержденного руководителем подрядной организации)" />
              </div>
            </div>
            
            <div style={{marginBottom:20}}>
              <h4>2. Инженерная подготовка строительной площадки</h4>
              <div style={{marginLeft:20, display:'flex', flexDirection:'column', gap:8}}>
                <ChecklistItem id="2.1" text="2.1. Наличие акта геодезической разбивочной основы, принятых знаков (реперов)" />
                <ChecklistItem id="2.2" text="2.2. Наличие генерального плана (ситуационного плана)" />
                <ChecklistItem id="2.3" text="2.3. Фактическое размещение временной инженерной и бытовой инфраструктуры площадки" />
                <ChecklistItem id="2.4" text="2.4. Наличие пунктов очистки или мойки колес транспортных средств на выездах со строительной площадки" />
                <ChecklistItem id="2.5" text="2.5. Наличие бункеров или контейнеров для сбора отдельно бытового и отдельно строительного мусора" />
                <ChecklistItem id="2.6" text="2.6. Наличие информационных щитов (знаков) с указанием всех необходимых данных" />
                <ChecklistItem id="2.7" text="2.7. Наличие стендов пожарной безопасности с указанием на схеме мест источников воды, средств пожаротушения" />
              </div>
            </div>
            
            <div className="row" style={{justifyContent:'flex-end', gap:8, marginTop:20}}>
              <button className="btn ghost" onClick={()=>setActivationModalOpen(false)} disabled={activationSaving}>Отмена</button>
              <button className="btn" onClick={async()=>{
                try{
                  setActivationSaving(true)
                  // Фильтруем только те пункты, которые не "не требуется"
                  const filteredData = Object.fromEntries(
                    Object.entries(checklistData).filter(([key, value]) => value !== 'not_required' && value !== '')
                  )
                  // Конвертируем строки в boolean
                  const booleanData = Object.fromEntries(
                    Object.entries(filteredData).map(([key, value]) => [key, value === 'true'])
                  )
                  await ikoActivationCheck(obj.id, booleanData)
                  showSuccess('Объект успешно активирован')
                  const updated = await getObject(id)
                  setObj(updated)
                  setActivationModalOpen(false)
                }catch(e){
                  showError('Ошибка активации: ' + (e?.message || ''))
                }finally{
                  setActivationSaving(false)
                }
              }} disabled={activationSaving}>
                {activationSaving ? 'Подтверждаем...' : 'Подтвердить активацию'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Модальное окно создания нарушения */}
      <Modal open={violationModalOpen} onClose={()=>setViolationModalOpen(false)} style={{width:'90vw', maxWidth:'90vw', zIndex: 9999}}>
        <div style={{padding: 20, maxHeight: '90vh', overflow: 'auto'}}>
          <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
            <h2>Выписать нарушение</h2>
            <button onClick={()=>setViolationModalOpen(false)} style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer'}}>✕</button>
          </div>
          
          <form onSubmit={async(e)=>{
            e.preventDefault()
            if(!violationData.title.trim()) return showError('Заголовок обязателен')
            setViolationSaving(true)
            try{
              // Подготавливаем фотографии из хранилища
              const photoUrls = []
              
              // Добавляем файлы из хранилища (ссылки)
              if (selectedStorageFiles.length > 0) {
                selectedStorageFiles.forEach(file => {
                  photoUrls.push(file.presigned_url || file.url)
                })
              }
              
              // Создаем нарушение с фотографиями
              const payload = {
                object: obj.id,
                title: violationData.title
              }
              
              // Добавляем фотографии из хранилища
              if (photoUrls.length > 0) {
                payload.violation_photos_urls = photoUrls
              }
              
              // Добавляем description только если он не пустой
              if (violationData.description && violationData.description.trim()) {
                payload.description = violationData.description.trim()
              }
              
              console.log('Отправляем данные нарушения:', payload)
              await createViolationWithPhotos(payload)
              showSuccess('Нарушение создано')
              setViolationModalOpen(false)
              setViolationData({
                title: '',
                description: ''
              })
              setSelectedStorageFiles([])
              
              // Обновляем список нарушений
              try {
                const violationsRes = await getViolations({ object_id: obj.id })
                setViolations(violationsRes.items || [])
              } catch (e) {
                console.warn('[object detail] error reloading violations:', e)
              }
            }catch(e){
              showError('Ошибка создания нарушения: ' + (e?.message || ''))
            }finally{
              setViolationSaving(false)
            }
          }}>
            <div style={{marginBottom: 16}}>
              <label style={{display:'block', marginBottom: 8, fontWeight: 600}}>Заголовок *</label>
              <input 
                type="text" 
                value={violationData.title}
                onChange={e=>setViolationData(prev=>({...prev, title: e.target.value}))}
                placeholder="Введите заголовок нарушения"
                style={{width:'100%', padding:'8px 12px', border:'1px solid var(--border)', borderRadius:'6px', backgroundColor:'var(--bg)'}}
                required
              />
            </div>

            <div style={{marginBottom: 16}}>
              <label style={{display:'block', marginBottom: 8, fontWeight: 600}}>Описание</label>
              <textarea 
                value={violationData.description}
                onChange={e=>setViolationData(prev=>({...prev, description: e.target.value}))}
                placeholder="Опишите нарушение"
                rows={4}
                style={{width:'100%', padding:'8px 12px', border:'1px solid var(--border)', borderRadius:'6px', backgroundColor:'var(--bg)', resize:'vertical'}}
              />
            </div>




            <div style={{marginBottom: 20}}>
              <label style={{display:'block', marginBottom: 8, fontWeight: 600}}>Фотографии нарушения</label>
              
              {/* Кнопка выбора файлов из хранилища */}
              <div style={{marginBottom: '16px'}}>
                <button
                  type="button"
                  onClick={() => setFileSelectorOpen(true)}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--brand)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                  Выбрать из хранилища
                </button>
              </div>
              
              {/* Выбранные файлы из хранилища */}
              {selectedStorageFiles.length > 0 && (
                <div style={{marginBottom: '16px'}}>
                  <h4 style={{fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', color: 'var(--text)'}}>
                    Файлы из хранилища ({selectedStorageFiles.length})
                  </h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    {selectedStorageFiles.map((file, index) => (
                      <div key={index} className="row" style={{gap: 8, alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px'}}>
                        <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: 8}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                          </svg>
                          <span style={{fontSize: '14px'}}>{file.name}</span>
                          <span style={{fontSize: '12px', color: 'var(--muted)'}}>
                            (из хранилища)
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            const newFiles = selectedStorageFiles.filter((_, i) => i !== index)
                            setSelectedStorageFiles(newFiles)
                          }}
                          style={{padding:'4px 8px', backgroundColor:'var(--red)', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize: '12px'}}
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{fontSize: '12px', color: 'var(--muted)'}}>
                Выберите файлы из хранилища. Поддерживаются форматы: JPG, PNG, GIF, WebP
              </div>
            </div>

            <div className="row" style={{gap: 12, justifyContent:'flex-end'}}>
              <button type="button" onClick={()=>setViolationModalOpen(false)} className="btn ghost">
                Отмена
              </button>
              <button type="submit" className="btn" disabled={violationSaving || !violationData.title.trim()}>
                {violationSaving ? 'Создаём...' : 'Создать нарушение'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Модальное окно для просмотра деталей нарушения */}
      <ViolationModal
        open={violationDetailModalOpen}
        onClose={closeViolationDetailModal}
        violation={selectedViolation}
        getStatusInfo={getViolationStatusInfo}
        getObjectName={() => `${obj.name} (${obj.address})`}
        user={user}
        onViolationUpdate={() => {
          // Перезагружаем нарушения для этого объекта
          if (obj) {
            setViolationsLoading(true)
            getViolations({ object_id: obj.id }).then(res=>{
              console.log('[ui object-detail] violations reloaded', res)
              setViolations(res.items || [])
            }).catch(e=>{
              console.error('[ui object-detail] error reloading violations', e)
              setViolations([])
            }).finally(()=>{
              setViolationsLoading(false)
            })
          }
        }}
      />

      {/* Модальное окно просмотра деталей запроса на изменение */}
      {requestDetailModalOpen && selectedRequest && (
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
                onClick={() => setRequestDetailModalOpen(false)}
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

      {/* Модалка детального просмотра работы */}
      {workItemDetailModalOpen && selectedWorkItem && (
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
            maxWidth: '1000px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: 'var(--text)' }}>
                Детали работы: {selectedWorkItem.name}
              </h2>
              <button
                className="btn ghost"
                onClick={() => setWorkItemDetailModalOpen(false)}
                style={{ padding: '8px' }}
              >
                ✕
              </button>
            </div>

            {workItemDetailsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ 
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  border: '3px solid var(--border)',
                  borderTop: '3px solid var(--brand)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ margin: '16px 0 0 0', color: 'var(--muted)' }}>Загрузка деталей...</p>
              </div>
            ) : workItemDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Основная информация о работе */}
                <div style={{
                  background: 'var(--bg-light)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
                    Основная информация
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Название:</span>
                      <div style={{ fontWeight: '500', color: 'var(--text)' }}>{workItemDetails.name}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Количество:</span>
                      <div style={{ fontWeight: '500', color: 'var(--text)' }}>{workItemDetails.quantity} {workItemDetails.unit}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Дата начала:</span>
                      <div style={{ fontWeight: '500', color: 'var(--text)' }}>{workItemDetails.start_date}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Дата окончания:</span>
                      <div style={{ fontWeight: '500', color: 'var(--text)' }}>{workItemDetails.end_date}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Статус:</span>
                      <div style={{ fontWeight: '500', color: 'var(--text)' }}>
                        {workItemDetails.status === 'planned' ? 'Запланировано' :
                         workItemDetails.status === 'in_progress' ? 'В работе' :
                         workItemDetails.status === 'completed_foreman' ? 'Завершено прорабом' :
                         workItemDetails.status === 'completed_ssk' ? 'Выполнено' :
                         workItemDetails.status === 'done' ? 'Готово' : workItemDetails.status}
                      </div>
                    </div>
                    {workItemDetails.document_url && (
                      <div>
                        <span style={{ color: 'var(--muted)' }}>Документ:</span>
                        <div>
                          <a 
                            href={workItemDetails.document_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: 'var(--brand)', textDecoration: 'none' }}
                          >
                            Открыть документ
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Подполигоны */}
                {workItemDetails.sub_areas && workItemDetails.sub_areas.length > 0 && (
                  <div style={{
                    background: 'var(--bg-light)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
                      Подполигоны ({workItemDetails.sub_areas.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {workItemDetails.sub_areas.map((subArea, idx) => (
                        <div key={idx} style={{
                          background: 'var(--panel)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: subArea.color || '#6366f1'
                          }}></div>
                          <div style={{ fontWeight: '500', color: 'var(--text)' }}>{subArea.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Поставки */}
                {workItemDetails.deliveries && workItemDetails.deliveries.length > 0 && (
                  <div style={{
                    background: 'var(--bg-light)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
                      Поставки ({workItemDetails.deliveries.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {workItemDetails.deliveries.map((delivery, idx) => (
                        <div key={idx} style={{
                          background: 'var(--panel)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '16px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <div style={{ fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
                                Поставка #{delivery.id}
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                Планируемая дата: {delivery.planned_date}
                              </div>
                            </div>
                            <div style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              background: delivery.status === 'received' ? '#dcfce7' : '#fef3c7',
                              color: delivery.status === 'received' ? '#166534' : '#92400e'
                            }}>
                              {delivery.status === 'received' ? 'Получено' : 'Запланировано'}
                            </div>
                          </div>
                          
                          {delivery.notes && (
                            <div style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--muted)' }}>
                              {delivery.notes}
                            </div>
                          )}

                          {/* Материалы - раскрывающийся список */}
                          {delivery.materials && delivery.materials.length > 0 && (
                            <div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleDeliveryExpansion(delivery.id)
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0',
                                  margin: '0 0 6px 0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: 'var(--text)',
                                  width: '100%',
                                  textAlign: 'left'
                                }}
                              >
                                <span style={{
                                  transform: expandedDeliveries.has(delivery.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s ease',
                                  fontSize: '12px'
                                }}>
                                  ▶
                                </span>
                                Материалы ({delivery.materials.length}):
                              </button>
                              
                              {expandedDeliveries.has(delivery.id) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '18px' }}>
                                  {delivery.materials.map((material, matIdx) => (
                                    <div key={matIdx} style={{
                                      background: 'var(--bg-light)',
                                      border: '1px solid var(--border)',
                                      borderRadius: '4px',
                                      padding: '8px',
                                      fontSize: '12px'
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: '500', color: 'var(--text)' }}>
                                          {material.material_name}
                                        </div>
                                        <div style={{
                                          padding: '2px 6px',
                                          borderRadius: '3px',
                                          fontSize: '10px',
                                          fontWeight: '500',
                                          background: material.is_confirmed ? '#dcfce7' : '#fef3c7',
                                          color: material.is_confirmed ? '#166534' : '#92400e'
                                        }}>
                                          {material.is_confirmed ? 'Подтверждено' : 'Ожидает'}
                                        </div>
                                      </div>
                                      <div style={{ color: 'var(--muted)', marginTop: '2px' }}>
                                        {material.material_quantity}
                                        {material.material_size && ` • ${material.material_size}`}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Фото накладных */}
                          {delivery.invoice_photos_folder_url && delivery.invoice_photos_folder_url.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>
                                Фото накладных:
                              </div>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {delivery.invoice_photos_folder_url.map((photoUrl, photoIdx) => (
                                  <a
                                    key={photoIdx}
                                    href={photoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-block',
                                      padding: '4px 8px',
                                      background: 'var(--brand)',
                                      color: 'white',
                                      textDecoration: 'none',
                                      borderRadius: '4px',
                                      fontSize: '11px'
                                    }}
                                  >
                                    Фото {photoIdx + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                <p>Ошибка загрузки деталей работы</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно выбора файлов из хранилища */}
      <FileSelectorModal
        open={fileSelectorOpen}
        onClose={() => setFileSelectorOpen(false)}
        onSelectFiles={(files) => {
          setSelectedStorageFiles(files)
          setFileSelectorOpen(false)
        }}
        allowedTypes={['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']}
        multiple={true}
      />

    </div>
  )
}
