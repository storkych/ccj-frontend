import React, { useEffect, useMemo, useState } from 'react'
import { createWorkPlan, getObjects } from '../api/mock.js'

export default function WorkPlanForm(){
  const [objectId, setObjectId] = useState('')
  const [objects, setObjects] = useState([])
  const [title, setTitle] = useState('')
  const [rows, setRows] = useState([
    { name:'Планировка площадки', quantity:1, unit:'усл.', start_date:'2025-10-01', end_date:'2025-10-10', document_url:'' }
  ])
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  const addRow = () => setRows(r => [...r, { name:'', quantity:0, unit:'шт', start_date:'', end_date:'', document_url:'' }])
  const delRow = (idx) => setRows(r => r.filter((_,i)=>i!==idx))
  const update = (idx, field, val) => setRows(r => r.map((row,i)=> i===idx ? { ...row, [field]:val } : row))

  useEffect(()=>{
    // ССК видит все объекты, но форма общая — подтянем список без mine
    getObjects({}).then(r=>setObjects(r.items||[])).catch(()=>setObjects([]))
  }, [])

  const isValid = useMemo(()=>{
    if (!objectId) return false
    if (!rows.length) return false
    for (const it of rows){
      if (!it.name || !it.start_date || !it.end_date) return false
    }
    return true
  }, [objectId, rows])

  const submit = async (e) => {
    e.preventDefault()
    if (!isValid) return
    setSaving(true)
    try{
      const selected = objects.find(o => String(o.id) === String(objectId))
      if (!selected?.uuid_obj){
        throw new Error('Для выбранного объекта отсутствует uuid_obj')
      }
      const resUuid = await createWorkPlan({ object_id: selected.uuid_obj, items: rows, title: title||undefined })
      setResult(resUuid)
    }catch(err){
      alert('Ошибка создания плана: ' + (err?.message || ''))
    }finally{
      setSaving(false)
    }
  }

  return (
    <section className="card">
      <h2 style={{marginTop:0}}>Электронная спецификация и перечень работ</h2>
      <form className="form" onSubmit={submit}>
        <div className="row">
          <label style={{width:160}}>Объект</label>
          <select className="input" value={objectId} onChange={e=>setObjectId(e.target.value)}>
            <option value="" disabled>Выберите объект…</option>
            {objects.map(o => <option key={o.id} value={o.id}>{o.name} — {o.address}</option>)}
          </select>
        </div>
        <div className="row">
          <label style={{width:160}}>Название плана</label>
          <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Опционально" />
        </div>
        {rows.map((row, i) => (
          <div key={i} className="row">
            <input className="input" style={{flex:2}} placeholder="Работа" value={row.name} onChange={e=>update(i,'name',e.target.value)} />
            <input className="input" style={{width:100}} type="number" placeholder="Кол-во" value={row.quantity} onChange={e=>update(i,'quantity',e.target.valueAsNumber)} />
            <input className="input" style={{width:100}} placeholder="Ед." value={row.unit} onChange={e=>update(i,'unit',e.target.value)} />
            <input className="input" style={{width:170}} type="date" value={row.start_date} onChange={e=>update(i,'start_date',e.target.value)} />
            <input className="input" style={{width:170}} type="date" value={row.end_date} onChange={e=>update(i,'end_date',e.target.value)} />
            <input className="input" style={{flex:2}} placeholder="Ссылка на документ (PDF)" value={row.document_url} onChange={e=>update(i,'document_url',e.target.value)} />
            <button type="button" className="btn ghost" onClick={()=>delRow(i)}>—</button>
          </div>
        ))}
        <div className="row" style={{justifyContent:'space-between'}}>
          <button type="button" className="btn ghost" onClick={addRow}>+ Добавить работу</button>
          <button className="btn" disabled={saving || !isValid}>{saving?'Сохраняем…':'Создать перечень'}</button>
        </div>
      </form>
      {result && <p className="pill" style={{marginTop:12}}>Создан план ID: {result.id} — позиций: {result.versions?.[0]?.items?.length || rows.length}</p>}
    </section>
  )
}
