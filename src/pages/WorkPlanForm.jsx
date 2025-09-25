import React, { useState } from 'react'
import { createWorkPlan } from '../api/mock.js'

export default function WorkPlanForm(){
  const [objectId, setObjectId] = useState('o1')
  const [rows, setRows] = useState([
    { title:'Планировка площадки', qty:1, unit:'усл.', deadline:'2025-10-01' }
  ])
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  const addRow = () => setRows(r => [...r, { title:'', qty:0, unit:'шт', deadline:'' }])
  const delRow = (idx) => setRows(r => r.filter((_,i)=>i!==idx))
  const update = (idx, field, val) => setRows(r => r.map((row,i)=> i===idx ? { ...row, [field]:val } : row))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const res = await createWorkPlan({ object_id: objectId, items: rows })
    setResult(res)
    setSaving(false)
  }

  return (
    <section className="card">
      <h2 style={{marginTop:0}}>Электронная спецификация и перечень работ</h2>
      <form className="form" onSubmit={submit}>
        <div className="row">
          <label style={{width:160}}>Объект</label>
          <select className="input" value={objectId} onChange={e=>setObjectId(e.target.value)}>
            <option value="o1">ЖК «Река»</option>
            <option value="o2">Мост М7</option>
            <option value="o3">БЦ «Север»</option>
          </select>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="row">
            <input className="input" style={{flex:2}} placeholder="Работа" value={row.title} onChange={e=>update(i,'title',e.target.value)} />
            <input className="input" style={{width:100}} type="number" placeholder="Кол-во" value={row.qty} onChange={e=>update(i,'qty',e.target.valueAsNumber)} />
            <input className="input" style={{width:100}} placeholder="Ед." value={row.unit} onChange={e=>update(i,'unit',e.target.value)} />
            <input className="input" style={{width:180}} type="date" value={row.deadline} onChange={e=>update(i,'deadline',e.target.value)} />
            <button type="button" className="btn ghost" onClick={()=>delRow(i)}>—</button>
          </div>
        ))}
        <div className="row" style={{justifyContent:'space-between'}}>
          <button type="button" className="btn ghost" onClick={addRow}>+ Добавить работу</button>
          <button className="btn" disabled={saving}>{saving?'Сохраняем…':'Создать перечень'}</button>
        </div>
      </form>
      {result && <p className="pill" style={{marginTop:12}}>Создан документ ID: {result.id}, позиций: {result.items.length}</p>}
    </section>
  )
}
