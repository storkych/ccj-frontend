import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getObject, getForemen, patchObject } from '../api/mock.js'

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
  const [obj, setObj] = useState(null)
  const [loading, setLoading] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [foremen, setForemen] = useState([])
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(()=>{
    getObject(id).then(o=>{ console.log('[ui object-detail] loaded', o); setObj(o) }).catch(e=>{ console.warn('[ui object-detail] error', e); setObj(null) }).finally(()=>setLoading(false))
  }, [id])

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

  return (
    <div className="grid">
      <h2 style={{margin:'0 0 8px'}}>{obj.name}</h2>
      <section className="card">
        <div className="row" style={{justifyContent:'space-between'}}>
          <div className="row" style={{gap:16}}>
            <span className="pill">Адрес: {obj.address}</span>
            <span className="pill">ИКО: {obj.iko?.full_name || obj.iko?.email || '—'}</span>
            <span className="pill">ССК: {obj.ssk?.full_name || obj.ssk?.email || '—'}</span>
            <span className="pill">Прораб: {obj.foreman?.full_name || obj.foreman?.email || '—'}</span>
          </div>
          {!obj.foreman && (
            <button className="btn" onClick={openAssign}>Назначить прораба</button>
          )}
        </div>
        <div style={{marginTop:12}}><Progress value={obj.progress ?? 0} /></div>
        <div className="row" style={{gap:8, marginTop:8}}>
          <span className={'status '+((obj.violations_open||0)>0?'red':'green')}>
            Нарушения: {obj.violations_open ?? 0} активных из {obj.violations_total ?? 0}
          </span>
          {obj.visits && <span className="pill">Посещения ССК/ИКО/прораб: {obj.visits?.ssk ?? 0}/{obj.visits?.iko ?? 0}/{obj.visits?.foreman ?? 0}</span>}
          {obj.deliveries_today!=null && <span className="pill">Поставки сегодня: {obj.deliveries_today}</span>}
        </div>
        <div className="row" style={{gap:8, marginTop:8}}>
          {obj.polygonId!=null && <span className="pill">Полигон: {obj.polygonId}</span>}
          {obj.ai_flag!=null && <span className="pill">AI: {obj.ai_flag}</span>}
        </div>
      </section>

      <section className="card">
        <h3 style={{marginTop:0}}>Исполнительная документация</h3>
        <div className="row" style={{gap:8}}>
          <span className="pill">акты: 12</span>
          <span className="pill">чертежи: 5</span>
          <span className="pill">сертификаты: 9</span>
        </div>
      </section>

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
