import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getObject, getForemen, patchObject, requestActivation, getWorkPlans } from '../api/mock.js'
import { useAuth } from '../auth/AuthContext.jsx'

function Progress({ value }){
  return <div className="progress"><span style={{width: value+'%'}}/></div>
}

function Modal({ open, onClose, children }){
  if(!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
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

  useEffect(()=>{
    getObject(id).then(o=>{ console.log('[ui object-detail] loaded', o); setObj(o) }).catch(e=>{ console.warn('[ui object-detail] error', e); setObj(null) }).finally(()=>setLoading(false))
  }, [id])

  useEffect(()=>{
    if(!obj) return
    setWorkPlansLoading(true)
    getWorkPlans({ object_id: obj.id }).then(plans=>{
      console.log('[ui object-detail] work plans loaded', plans)
      setWorkPlans(plans.items || [])
    }).catch(e=>{
      console.warn('[ui object-detail] work plans error', e)
      setWorkPlans([])
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
                <span style={{fontSize:'14px', fontWeight:'600', color:'var(--text)'}}>{obj.progress ?? 0}%</span>
              </div>
              <Progress value={obj.progress ?? 0} />
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

      <section className="card">
        <h3 style={{marginTop:0}}>Исполнительная документация</h3>
        <div className="row" style={{gap:8}}>
          <span className="pill">акты: 12</span>
          <span className="pill">чертежи: 5</span>
          <span className="pill">сертификаты: 9</span>
        </div>
      </section>

      {user?.role === 'ssk' && (
        <section className="card">
          <h3 style={{marginTop:0}}>Действия ССК</h3>
          <div className="row" style={{gap:8}}>
            {!obj.ssk && <button className="btn" onClick={async()=>{ 
              try{
                const u = await patchObject(obj.id, { ssk_id: user.id }); 
                setObj(u);
                alert('Вы стали ответственным за объект')
              }catch(e){
                alert('Ошибка: ' + (e?.message || ''))
              }
            }}>Стать ответственным (ССК)</button>}
            {!obj.foreman && <button className="btn" onClick={openAssign}>Назначить прораба</button>}
            {workPlans.length === 0 && <button className="btn ghost" onClick={()=>location.assign('/work-plans/new')}>Добавить график работ</button>}
          </div>
        </section>
      )}

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
    </div>
  )
}
