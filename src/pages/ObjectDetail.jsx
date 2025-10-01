import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getObject, getForemen, patchObject, requestActivation, getWorkPlans, createArea, getWorkPlan, updateWorkItemStatus, ikoActivationCheck } from '../api/mock.js'
import AreaMap from './AreaMap.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

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
      'draft': { label: 'Черновик', color: '#ea580c', bgColor: '#fff7ed' },
      'activation_pending': { label: 'Ожидает активации', color: '#ca8a04', bgColor: '#fefce8' },
      'active': { label: 'Активен', color: '#15803d', bgColor: '#f0fdf4' },
      'suspended': { label: 'Приостановлен', color: '#ca8a04', bgColor: '#fefce8' },
      'completed': { label: 'Завершён', color: '#1d4ed8', bgColor: '#eff6ff' }
    }
    return statusMap[status] || { label: status || '—', color: '#6b7280', bgColor: '#f9fafb' }
  }

  const statusInfo = getStatusInfo(obj?.status)

  return (
    <div className="grid">
      <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
        <h2 style={{margin:0}}>{obj.name}</h2>
        <div className="row" style={{gap:8, alignItems:'center'}}>
          <div style={{
            padding:'6px 12px',
            backgroundColor: statusInfo.bgColor,
            color: statusInfo.color,
            borderRadius:'8px',
            fontSize:'14px',
            fontWeight:'600',
            border: `1px solid ${statusInfo.color}30`
          }}>
            {statusInfo.label}
          </div>
          {user?.role === 'ssk' && (!obj.ssk || !obj.foreman || workPlans.length === 0 || (obj.areas?.length||0) === 0 || (obj.ssk && obj.foreman && workPlans.length > 0 && (obj.areas?.length||0) > 0 && !obj.iko)) && (
            <div style={{padding:'8px 12px', backgroundColor:'var(--panel)', border:'1px solid var(--border)', borderRadius:'8px'}}>
              <div className="row" style={{gap:6}}>
                {!obj.ssk && <button className="btn small" onClick={async()=>{ 
                  try{
                    const u = await patchObject(obj.id, { ssk_id: user.id }); 
                    setObj(u);
                    alert('Вы стали ответственным за объект')
                  }catch(e){
                    alert('Ошибка: ' + (e?.message || ''))
                  }
                }}>Стать ответственным</button>}
                {!obj.foreman && <button className="btn small" onClick={openAssign}>Назначить прораба</button>}
                {workPlans.length === 0 && <button className="btn small" onClick={()=>location.assign(`/work-plans/new/${id}`)}>Добавить график работ</button>}
                {(obj.areas?.length||0) === 0 && <button className="btn small" onClick={()=>setAreaModalOpen(true)}>Создать полигон</button>}
                {obj.ssk && obj.foreman && workPlans.length > 0 && (obj.areas?.length||0) > 0 && !obj.iko && (
                  <button className="btn small" onClick={async()=>{ 
                    try{
                      await requestActivation(obj.id);
                      alert('Запрос на активацию отправлен')
                      // Обновляем объект после активации
                      const updated = await getObject(id);
                      setObj(updated);
                    }catch(e){
                      alert('Ошибка активации: ' + (e?.message || ''))
                    }
                  }}>Активировать</button>
                )}
              </div>
            </div>
          )}
          {user?.role === 'iko' && obj.status === 'activation_pending' && (
            <div style={{padding:'8px 12px', backgroundColor:'var(--panel)', border:'1px solid var(--border)', borderRadius:'8px'}}>
              <div className="row" style={{gap:6}}>
                <button className="btn small" onClick={()=>setActivationModalOpen(true)}>Активировать объект</button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <section className="card">
        <div className="row" style={{justifyContent:'space-between', alignItems:'flex-start', marginBottom:16}}>
          <div style={{display:'flex', flexDirection:'column', gap:12, flex:1}}>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <div style={{padding:'6px 10px', backgroundColor:'var(--bg-light)', border:'1px solid var(--border)', borderRadius:'6px', fontSize:'14px', color:'var(--text)', fontWeight:'500'}}>
                📍 {obj.address}
              </div>
              <div className="row" style={{gap:8, flexWrap:'wrap'}}>
                <div style={{
                  padding:'4px 8px', 
                  backgroundColor: obj.iko ? '#f0fdf4' : '#fefce8', 
                  border: `1px solid ${obj.iko ? '#22c55e' : '#eab308'}`, 
                  borderRadius:'6px', 
                  fontSize:'13px', 
                  color: obj.iko ? '#15803d' : '#a16207', 
                  fontWeight:'500'
                }}>
                  ИКО: {obj.iko?.full_name || obj.iko?.email || '—'}
                </div>
                <div style={{
                  padding:'4px 8px', 
                  backgroundColor: obj.ssk ? '#f0fdf4' : '#fefce8', 
                  border: `1px solid ${obj.ssk ? '#22c55e' : '#eab308'}`, 
                  borderRadius:'6px', 
                  fontSize:'13px', 
                  color: obj.ssk ? '#15803d' : '#a16207', 
                  fontWeight:'500'
                }}>
                  ССК: {obj.ssk?.full_name || obj.ssk?.email || '—'}
                </div>
                <div style={{
                  padding:'4px 8px', 
                  backgroundColor: obj.foreman ? '#f0fdf4' : '#fefce8', 
                  border: `1px solid ${obj.foreman ? '#22c55e' : '#eab308'}`, 
                  borderRadius:'6px', 
                  fontSize:'13px', 
                  color: obj.foreman ? '#15803d' : '#a16207', 
                  fontWeight:'500'
                }}>
                  Прораб: {obj.foreman?.full_name || obj.foreman?.email || '—'}
                </div>
              </div>
            </div>
            
            <div style={{marginTop:8}}>
              <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
                <span style={{fontSize:'14px', fontWeight:'500', color:'var(--text)'}}>Прогресс выполнения</span>
                <span style={{fontSize:'14px', fontWeight:'600', color:'var(--text)'}}>{obj.work_progress ?? 0}%</span>
              </div>
              <Progress value={obj.work_progress ?? 0} />
            </div>
          </div>
          
        </div>
        
        <div className="row" style={{gap:8, marginTop:16, flexWrap:'wrap'}}>
          <span className={'status '+((obj.violations_open||0)>0?'red':'green')}>
            Нарушения: {obj.violations_open ?? 0} активных из {obj.violations_total ?? 0}
          </span>
          {obj.visits && <span className="pill">Посещения ССК/ИКО/прораб: {obj.visits?.ssk ?? 0}/{obj.visits?.iko ?? 0}/{obj.visits?.foreman ?? 0}</span>}
          {obj.deliveries_today!=null && <span className="pill">Поставки сегодня: {obj.deliveries_today}</span>}
        </div>
        <div className="row" style={{gap:8, marginTop:8, flexWrap:'wrap'}}>
          {obj.polygonId!=null && <span className="pill">Полигон: {obj.polygonId}</span>}
          {obj.ai_flag!=null && <span className="pill">AI: {obj.ai_flag}</span>}
        </div>
      </section>

      {(obj.areas && obj.areas.length > 0) && (
        <section className="card">
          <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
            <h3 style={{marginTop:0}}>Геозона объекта</h3>
            <span className="muted">Просмотр полигона</span>
          </div>
          <div style={{marginTop:8}}>
            <AreaMap
              readOnly
              polygons={(obj.areas||[]).map(a=>({ geometry: a.geometry, name: a.name }))}
            />
          </div>
        </section>
      )}

      <section className="card">
        <h3 style={{marginTop:0}}>Рабочие планы</h3>
        {workPlansLoading ? (
          <div className="muted">Загрузка планов...</div>
        ) : workPlans.length > 0 ? (
          <div style={{display:'flex', flexDirection:'column', gap:12}}>
            {workPlans.map(plan => (
              <div key={plan.id} style={{padding:12, border:'1px solid var(--border)', borderRadius:8, backgroundColor:'var(--bg-light)'}}>
                <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                  <h4 style={{margin:0, fontSize:'16px'}}>{plan.title || `План #${plan.id}`}</h4>
                  <span className="pill" style={{fontSize:'12px'}}>
                    {new Date(plan.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="row" style={{gap:8, flexWrap:'wrap'}}>
                  <span className="pill">ID: {plan.id}</span>
                  <span className="pill">UUID: {plan.uuid_wp}</span>
                  {plan.versions && plan.versions.length > 0 && (
                    <span className="pill">Версий: {plan.versions.length}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">Рабочие планы не найдены</div>
        )}
      </section>

      {/* Элементы работ */}
      {workPlanDetails && workPlanDetails.work_items && workPlanDetails.work_items.length > 0 && (
        <section className="card">
          <h3 style={{marginTop:0}}>Элементы работ ({workPlanDetails.work_items.length})</h3>
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
              {workPlanDetails.work_items.map((item, idx) => (
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
                                const updated = await getWorkPlan(workPlanDetails.id)
                                setWorkPlanDetails(updated)
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
                                const updated = await getWorkPlan(workPlanDetails.id)
                                setWorkPlanDetails(updated)
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
        </section>
      )}

      <section className="card">
        <h3 style={{marginTop:0}}>Исполнительная документация</h3>
        <div className="row" style={{gap:8}}>
          <span className="pill">акты: 12</span>
          <span className="pill">чертежи: 5</span>
          <span className="pill">сертификаты: 9</span>
        </div>
      </section>


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
                    alert('Ошибка сохранения: '+(e?.message||''))
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
                  alert('Объект успешно активирован')
                  const updated = await getObject(id)
                  setObj(updated)
                  setActivationModalOpen(false)
                }catch(e){
                  alert('Ошибка активации: ' + (e?.message || ''))
                }finally{
                  setActivationSaving(false)
                }
              }} disabled={activationSaving}>
                {activationSaving ? 'Активируем...' : 'Активировать объект'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
