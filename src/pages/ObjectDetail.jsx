import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getObject, getForemen, patchObject, requestActivation, getWorkPlans, createArea, getWorkPlan, updateWorkItemStatus, ikoActivationCheck, createViolation, createViolationWithPhotos, completeObjectBySSK, completeObjectByIKO } from '../api/api.js'
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
  const [violationModalOpen, setViolationModalOpen] = useState(false)
  const [violationData, setViolationData] = useState({
    title: '',
    description: '',
    requires_stop: false,
    requires_personal_recheck: false,
    attachments: []
  })
  const [violationPhotos, setViolationPhotos] = useState([])
  const [violationSaving, setViolationSaving] = useState(false)

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
      'completed_by_ssk': { label: 'Завершён ССК', color: '#7c3aed', bgColor: '#f3e8ff' },
      'completed': { label: 'Завершён', color: '#1d4ed8', bgColor: '#eff6ff' }
    }
    return statusMap[status] || { label: status || '—', color: '#6b7280', bgColor: '#f9fafb' }
  }

  const statusInfo = getStatusInfo(obj?.status)

  return (
    <div className="page">
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
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '24px'
        }}>
          {/* Действия ССК */}
          {user?.role === 'ssk' && (!obj.ssk || !obj.foreman || workPlans.length === 0 || (obj.areas?.length||0) === 0 || (obj.ssk && obj.foreman && workPlans.length > 0 && (obj.areas?.length||0) > 0 && !obj.iko)) && (
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              minWidth: '200px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Действия ССК
                </h4>
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap'
                }}>
                {!obj.ssk && (
                  <button 
                    className="btn small" 
                    onClick={async()=>{ 
                      try{
                        const u = await patchObject(obj.id, { ssk_id: user.id }); 
                        setObj(u);
                        alert('Вы стали ответственным за объект')
                      }catch(e){
                        alert('Ошибка: ' + (e?.message || ''))
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    Стать ответственным
                  </button>
                )}
          {!obj.foreman && (
                  <button 
                    className="btn small" 
                    onClick={openAssign}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    Назначить прораба
                  </button>
                )}
                {workPlans.length === 0 && (
                  <button 
                    className="btn small" 
                    onClick={()=>location.assign(`/work-plans/new/${id}`)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500'
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
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500'
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
                        alert('Запрос на активацию отправлен')
                        // Обновляем объект после активации
                        const updated = await getObject(id);
                        setObj(updated);
                      }catch(e){
                        alert('Ошибка активации: ' + (e?.message || ''))
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    Активировать
                  </button>
                )}
                <button 
                  className="btn small" 
                  onClick={()=>setViolationModalOpen(true)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  Выписать нарушение
                </button>
                </div>
              </div>
            </div>
          )}
          {/* Кнопка завершения для ССК */}
          {console.log('ССК завершение - роль:', user?.role, 'статус:', obj.status, 'прогресс:', obj.work_progress, 'тип прогресса:', typeof obj.work_progress) || user?.role === 'ssk' && obj.status === 'active' && Number(obj.work_progress ?? 0) === 100 && (
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.07.74 5.61 1.98"/>
                  </svg>
                  Завершение объекта
                </h4>
                <button 
                  className="btn small" 
                  onClick={async()=>{ 
                    try{
                      await completeObjectBySSK(obj.id);
                      alert('Объект завершён ССК')
                      // Обновляем объект после завершения
                      const updated = await getObject(id);
                      setObj(updated);
                    }catch(e){
                      alert('Ошибка завершения: ' + (e?.message || ''))
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    background: '#7c3aed',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Завершить объект
                </button>
              </div>
            </div>
          )}
          {user?.role === 'iko' && obj.status === 'activation_pending' && (
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
            }}>
              <button 
                className="btn small" 
                onClick={()=>setActivationModalOpen(true)}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none'
                }}
              >
                Активировать объект
              </button>
            </div>
          )}
          {user?.role === 'iko' && obj.status === 'completed_by_ssk' && (
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
            }}>
              <button 
                className="btn small" 
                onClick={async()=>{ 
                  try{
                    await completeObjectByIKO(obj.id);
                    alert('Объект полностью завершён')
                    // Обновляем объект после завершения
                    const updated = await getObject(id);
                    setObj(updated);
                  }catch(e){
                    alert('Ошибка завершения: ' + (e?.message || ''))
                  }
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  background: '#1d4ed8',
                  color: 'white',
                  border: 'none'
                }}
              >
                Завершить
              </button>
            </div>
          )}
          {(user?.role === 'ssk' || user?.role === 'iko') && (
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              marginTop: '8px'
            }}>
              <button 
                className="btn" 
                onClick={()=>setViolationModalOpen(true)}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                Выписать нарушение
              </button>
            </div>
          )}
        </div>
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
          <div style={{
            padding: '8px 12px',
            backgroundColor: (obj.violations_open||0) > 0 ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${(obj.violations_open||0) > 0 ? '#fecaca' : '#bbf7d0'}`,
            borderRadius: '8px',
            fontSize: '14px',
            color: (obj.violations_open||0) > 0 ? '#dc2626' : '#16a34a',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <span style={{fontWeight: '600'}}>Нарушения:</span>
            {obj.violations_open ?? 0} активных из {obj.violations_total ?? 0}
          </div>
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
              polygons={(obj.areas||[]).map(a=>({ geometry: a.geometry, name: a.name }))}
            />
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
          Рабочие планы
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
            Загрузка планов...
          </div>
        ) : workPlans.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {workPlans.map(plan => (
              <div key={plan.id} style={{
                padding: '16px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-light)',
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
                  marginBottom: '12px'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text)'
                  }}>
                    {plan.title || `План #${plan.id}`}
                  </h4>
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'var(--muted)',
                    fontWeight: '500'
                  }}>
                    {new Date(plan.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--muted)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    ID: {plan.id}
                  </span>
                  {plan.versions && plan.versions.length > 0 && (
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--muted)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      Версий: {plan.versions.length}
                    </span>
                  )}
                </div>
              </div>
            ))}
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
              fontSize: '24px'
            }}>
              📋
            </div>
            <h4 style={{
              margin: '0 0 8px 0',
              color: 'var(--text)',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Рабочие планы не найдены
            </h4>
            <p style={{
              margin: 0,
              fontSize: '14px'
            }}>
              Для этого объекта пока нет созданных рабочих планов
            </p>
          </div>
        )}
      </div>

      {/* Элементы работ */}
      {workPlanDetails && workPlanDetails.work_items && workPlanDetails.work_items.length > 0 && (
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
            Элементы работ ({workPlanDetails.work_items.length})
          </h3>
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
                {workPlanDetails.work_items.map((item, idx) => (
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

      {/* Модальное окно создания нарушения */}
      <Modal open={violationModalOpen} onClose={()=>setViolationModalOpen(false)} style={{width:'90vw', maxWidth:'90vw', zIndex: 9999}}>
        <div style={{padding: 20, maxHeight: '90vh', overflow: 'auto'}}>
          <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
            <h2>Выписать нарушение</h2>
            <button onClick={()=>setViolationModalOpen(false)} style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer'}}>✕</button>
          </div>
          
          <form onSubmit={async(e)=>{
            e.preventDefault()
            if(!violationData.title.trim()) return alert('Заголовок обязателен')
            setViolationSaving(true)
            try{
              // Конвертируем фотографии в base64
              const photoAttachments = []
              if (violationPhotos.length > 0) {
                for (const photo of violationPhotos) {
                  const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result)
                    reader.onerror = reject
                    reader.readAsDataURL(photo)
                  })
                  photoAttachments.push(base64)
                }
              }
              
              // Создаем нарушение с фотографиями
              const payload = {
                object: obj.id,
                title: violationData.title,
                requires_stop: violationData.requires_stop,
                requires_personal_recheck: violationData.requires_personal_recheck,
                violation_photos: photoAttachments
              }
              
              // Добавляем description только если он не пустой
              if (violationData.description && violationData.description.trim()) {
                payload.description = violationData.description.trim()
              }
              
              console.log('Отправляем данные нарушения:', payload)
              await createViolationWithPhotos(payload)
              alert('Нарушение создано')
              setViolationModalOpen(false)
              setViolationData({
                title: '',
                description: '',
                requires_stop: false,
                requires_personal_recheck: false,
                attachments: []
              })
              setViolationPhotos([])
            }catch(e){
              alert('Ошибка создания нарушения: ' + (e?.message || ''))
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

            <div style={{marginBottom: 16}}>
              <label style={{display:'flex', alignItems:'center', gap: 8, cursor:'pointer'}}>
                <input 
                  type="checkbox" 
                  checked={violationData.requires_stop}
                  onChange={e=>setViolationData(prev=>({...prev, requires_stop: e.target.checked}))}
                />
                <span>Требуется остановка работ</span>
              </label>
            </div>

            <div style={{marginBottom: 16}}>
              <label style={{display:'flex', alignItems:'center', gap: 8, cursor:'pointer'}}>
                <input 
                  type="checkbox" 
                  checked={violationData.requires_personal_recheck}
                  onChange={e=>setViolationData(prev=>({...prev, requires_personal_recheck: e.target.checked}))}
                />
                <span>Требуется личная повторная проверка</span>
              </label>
            </div>

            <div style={{marginBottom: 20}}>
              <label style={{display:'block', marginBottom: 8, fontWeight: 600}}>Вложения (ссылки)</label>
              <div style={{display:'flex', flexDirection:'column', gap: 8}}>
                {violationData.attachments.map((attachment, index) => (
                  <div key={index} className="row" style={{gap: 8}}>
                    <input 
                      type="url" 
                      value={attachment}
                      onChange={e=>{
                        const newAttachments = [...violationData.attachments]
                        newAttachments[index] = e.target.value
                        setViolationData(prev=>({...prev, attachments: newAttachments}))
                      }}
                      placeholder="https://example.com/file.pdf"
                      style={{flex:1, padding:'8px 12px', border:'1px solid var(--border)', borderRadius:'6px', backgroundColor:'var(--bg)'}}
                    />
                    <button 
                      type="button"
                      onClick={()=>{
                        const newAttachments = violationData.attachments.filter((_, i) => i !== index)
                        setViolationData(prev=>({...prev, attachments: newAttachments}))
                      }}
                      style={{padding:'8px 12px', backgroundColor:'var(--red)', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}
                    >
                      Удалить
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={()=>setViolationData(prev=>({...prev, attachments: [...prev.attachments, '']}))}
                  style={{padding:'8px 12px', backgroundColor:'var(--brand)', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', alignSelf:'flex-start'}}
                >
                  Добавить вложение
                </button>
              </div>
            </div>

            <div style={{marginBottom: 20}}>
              <label style={{display:'block', marginBottom: 8, fontWeight: 600}}>Фотографии нарушения</label>
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={e => {
                  const files = Array.from(e.target.files)
                  setViolationPhotos(prev => [...prev, ...files])
                }}
                style={{width:'100%', padding:'8px 12px', border:'1px solid var(--border)', borderRadius:'6px', backgroundColor:'var(--bg)', marginBottom: 8}}
              />
              <div style={{fontSize: '12px', color: 'var(--muted)', marginBottom: 8}}>
                Можно выбрать несколько фотографий. Поддерживаются форматы: JPG, PNG, GIF
              </div>
              
              {violationPhotos.length > 0 && (
                <div style={{display:'flex', flexDirection:'column', gap: 8}}>
                  {violationPhotos.map((photo, index) => (
                    <div key={index} className="row" style={{gap: 8, alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px'}}>
                      <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: 8}}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                        <span style={{fontSize: '14px'}}>{photo.name}</span>
                        <span style={{fontSize: '12px', color: 'var(--muted)'}}>
                          ({(photo.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const newPhotos = violationPhotos.filter((_, i) => i !== index)
                          setViolationPhotos(newPhotos)
                        }}
                        style={{padding:'4px 8px', backgroundColor:'var(--red)', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize: '12px'}}
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
    </div>
  )
}
