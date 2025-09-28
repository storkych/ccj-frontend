
import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { acceptDelivery, getDeliveries, sendDeliveryToLab, uploadDeliveryPhoto } from '../api/mock.js'

function Controls({ role, d, onChanged }){
  async function toLab(){ await sendDeliveryToLab({ id:d.id }); onChanged() }
  async function accept(){ await acceptDelivery({ id:d.id }); onChanged() }
  if(role==='ssk'){
    return <div className="row" style={{gap:8}}>
      <button className="btn ghost" onClick={toLab}>В лабораторию</button>
      <button className="btn" onClick={accept}>Принять</button>
    </div>
  }
  if(role==='foreman'){
    return <div className="muted">Ожидает решения ССК</div>
  }
  return null
}

export default function Deliveries(){
  const { user } = useAuth()
  const [objectId, setObjectId] = useState('')
  const [items, setItems] = useState([])
  async function load(){ const r = await getDeliveries({ object_id: objectId||undefined }); setItems(r.items) }
  useEffect(()=>{ load() }, [objectId])

  async function onUpload(d, file){
    await uploadDeliveryPhoto({ delivery_id: d.id, file })
    load()
  }

  return (
    <div className="page">
      <h1>Поставки материалов</h1>
      <div className="row">
        <label style={{width:160}}>Объект</label>
        <select className="input" value={objectId} onChange={e=>setObjectId(e.target.value)}>
          <option value="">Все объекты</option>
          <option value="o1">ЖК «Река»</option>
          <option value="o2">Мост М7</option>
          <option value="o3">БЦ «Север»</option>
        </select>
      </div>
      <div className="list">
        {items.map(d=>(
          <article key={d.id} className="card">
            <div className="row" style={{justifyContent:'space-between'}}>
              <div><b>{d.title}</b> <span className="pill">{d.object_id}</span></div>
              <div className="row"><span className="pill">{d.status}</span>{d.lab && <span className="pill">лаборатория</span>}</div>
            </div>
            <div className="row">
              <input type="file" onChange={e=>onUpload(d, e.target.files?.[0])}/>
              <div className="row" style={{gap:6}}>{d.photos.map(p=><span key={p.id} className="pill">📷 {p.name}</span>)}</div>
            </div>
            <Controls role={user?.role} d={d} onChanged={load}/>
          </article>
        ))}
        {items.length===0 && <div className="muted">Нет поставок.</div>}
      </div>
    </div>
  )
}
