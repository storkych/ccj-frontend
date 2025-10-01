
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

  const shown = (onlyMine && user?.role==='foreman') ? items.filter(i=>i.assignee===user.id) : items

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
      <h1>График работ</h1>
      <div className="row">
        <label style={{width:160}}>Объект</label>
        <select className="input" value={objectId} onChange={e=>setObjectId(e.target.value)} disabled={loading}>
          <option value="">Все мои объекты</option>
          {availableObjects.map(obj => (
            <option key={obj.id} value={obj.id}>
              {obj.name} - {obj.address}
            </option>
          ))}
        </select>
      </div>
      {loading && <div className="muted">Загрузка объектов...</div>}
      {user?.role==='foreman' && (
        <div className="row" style={{gap:8}}>
          <label className="pill">Показывать:</label>
          <button className={"btn small"+(onlyMine?"":" ghost")} onClick={()=>setOnlyMine(true)}>Только мои</button>
          <button className={"btn small"+(!onlyMine?"":" ghost")} onClick={()=>setOnlyMine(false)}>Все</button>
        </div>
      )}
      {shown.length > 0 ? (
        <table className="table">
          <thead><tr><th>Название</th><th>Объект</th><th>Адрес</th><th>Создан</th><th>Версий</th><th>Действия</th></tr></thead>
          <tbody>
            {shown.map(plan=>{
              const obj = objects.find(o => o.id === plan.object)
              return (
                <tr key={plan.id}>
                  <td>{plan.title || `План #${plan.id}`}</td>
                  <td>{obj?.name || plan.object}</td>
                  <td>{obj?.address || '—'}</td>
                  <td>{new Date(plan.created_at).toLocaleDateString('ru-RU')}</td>
                  <td>{plan.versions?.length || 0}</td>
                  <td>
                    <button 
                      className="btn small" 
                      onClick={() => openPlanDetails(plan)}
                    >
                      Открыть
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <div className="muted" style={{textAlign:'center', padding:'40px'}}>
          {objectId ? 'Графики работ для выбранного объекта не найдены' : 'У вас нет графиков работ'}
        </div>
      )}

      {/* Модальное окно с деталями плана */}
      {selectedPlan && (
        <div className="modal-backdrop" onClick={closePlanDetails}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{width:'95vw', maxWidth:'95vw', maxHeight:'90vh', overflow:'auto'}}>
            <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
              <h3 style={{margin:0}}>Детали рабочего плана</h3>
              <button className="btn ghost" onClick={closePlanDetails}>✕</button>
            </div>
            
            {planLoading ? (
              <div className="muted">Загрузка деталей...</div>
            ) : planDetails ? (
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                <div className="card">
                  <h4 style={{marginTop:0}}>Основная информация</h4>
                  <div className="row" style={{gap:8, flexWrap:'wrap'}}>
                    <span className="pill">ID: {planDetails.id}</span>
                    <span className="pill">UUID: {planDetails.uuid_wp}</span>
                    <span className="pill">Объект: {planDetails.object}</span>
                    <span className="pill">Создан: {new Date(planDetails.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  {planDetails.title && (
                    <div style={{marginTop:12}}>
                      <strong>Название:</strong> {planDetails.title}
                    </div>
                  )}
                </div>

                {/* Показываем элементы работ, если они есть */}
                {planDetails.work_items && planDetails.work_items.length > 0 && (
                  <div className="card">
                    <h4 style={{marginTop:0}}>Элементы работ ({planDetails.work_items.length})</h4>
                    <table className="table" style={{marginTop:12}}>
                      <thead>
                        <tr>
                          <th>Название</th>
                          <th>Количество</th>
                          <th>Единица</th>
                          <th>Начало</th>
                          <th>Окончание</th>
                          <th>Статус</th>
                          <th>Документ</th>
                          {user?.role === 'ssk' && <th>Действия</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {planDetails.work_items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td>{item.name}</td>
                            <td>{item.quantity || '—'}</td>
                            <td>{item.unit || '—'}</td>
                            <td>{item.start_date ? new Date(item.start_date).toLocaleDateString('ru-RU') : '—'}</td>
                            <td>{item.end_date ? new Date(item.end_date).toLocaleDateString('ru-RU') : '—'}</td>
                            <td>
                              <span className={`pill status-${item.status}`}>
                                {item.status === 'planned' ? 'Запланировано' : 
                                 item.status === 'in_progress' ? 'В работе' : 
                                 item.status === 'done' ? 'Выполнено' : item.status}
                              </span>
                            </td>
                            <td>
                              {item.document_url ? (
                                <a href={item.document_url} target="_blank" rel="noopener noreferrer" className="btn small">
                                  Открыть
                                </a>
                              ) : '—'}
                            </td>
                            {user?.role === 'ssk' && (
                              <td>
                                <div className="row" style={{gap:4}}>
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
                                    >
                                      {updatingItems.has(item.id) ? '...' : 'Завершить'}
                                    </button>
                                  )}
                                  {item.status === 'done' && (
                                    <span className="pill status-done">Выполнено</span>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {planDetails.versions && planDetails.versions.length > 0 && (
                  <div className="card">
                    <h4 style={{marginTop:0}}>Версии плана ({planDetails.versions.length})</h4>
                    <div style={{display:'flex', flexDirection:'column', gap:8}}>
                      {planDetails.versions.map((version, idx) => (
                        <div key={version.id} style={{padding:12, border:'1px solid var(--border)', borderRadius:6, backgroundColor:'var(--bg-light)'}}>
                          <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
                            <span><strong>Версия {version.version}</strong></span>
                            <span className="pill" style={{fontSize:'12px'}}>
                              {new Date(version.created_at).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          {version.doc_url && (
                            <div style={{marginTop:8}}>
                              <a href={version.doc_url} target="_blank" rel="noopener noreferrer" className="btn small">
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
                  <div className="card">
                    <h4 style={{marginTop:0}}>Информация о плане</h4>
                    <div className="muted">
                      Элементы работ не отображаются. Возможно, они хранятся в версиях плана или в отдельной системе расписания.
                    </div>
                    <details style={{marginTop:12}}>
                      <summary style={{cursor:'pointer', fontSize:'14px'}}>Техническая информация</summary>
                      <pre style={{fontSize:'12px', backgroundColor:'var(--bg-light)', padding:12, borderRadius:6, overflow:'auto', marginTop:8}}>
                        {JSON.stringify(planDetails, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ) : (
              <div className="muted">Ошибка загрузки деталей плана</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
