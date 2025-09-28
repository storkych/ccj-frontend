
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViolations } from '../api/mock.js'

export default function Violations(){
  const [objectId, setObjectId] = useState('')
  const [items, setItems] = useState([])
  useEffect(()=>{ getViolations({ object_id: objectId||undefined }).then(r=>setItems(r.items)) }, [objectId])

  return (
    <div className="page">
      <h1>Нарушения</h1>
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
        {items.map(v=>(
          <article key={v.id} className="card row">
            <div>
              <div className="row" style={{gap:8}}><b>{v.title}</b><span className="pill">{v.object_id}</span></div>
              <div className="muted">{v.description}</div>
            </div>
            <div className="row" style={{gap:8, alignItems:'center'}}>
              <span className="pill">{v.status}</span>
              <Link className="btn ghost" to={`/violations/${v.id}`}>Открыть</Link>
            </div>
          </article>
        ))}
        {items.length===0 && <div className="muted">Нет нарушений.</div>}
      </div>
    </div>
  )
}
