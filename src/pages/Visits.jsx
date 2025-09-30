
import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getVisitRequests } from '../api/mock.js'

export default function Visits(){
  const { user } = useAuth()
  const [objectId, setObjectId] = useState('')
  const [items, setItems] = useState([])
  useEffect(()=>{ getVisitRequests({ object_id: objectId||undefined, mine: 'true' }).then(r=>setItems(r.items||[])) }, [user, objectId])

  return (
    <div className="page">
      <h1>Посещения</h1>
      <div className="row">
        <label style={{width:160}}>Объект</label>
        <select className="input" value={objectId} onChange={e=>setObjectId(e.target.value)}>
          <option value="">Все объекты</option>
          <option value="o1">ЖК «Река»</option>
          <option value="o2">Мост М7</option>
          <option value="o3">БЦ «Север»</option>
        </select>
      </div>
      <table className="table">
        <thead><tr><th>План</th><th>Объект</th><th>Статус</th></tr></thead>
        <tbody>
          {items.map(v=>{
            const objectIdDisp = v.object?.id ?? v.object
            return (<tr key={v.id}><td>{v.planned_at || '—'}</td><td>{objectIdDisp}</td><td>{v.status}</td></tr>)
          })}
        </tbody>
      </table>
    </div>
  )
}
