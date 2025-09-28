
import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getVisits } from '../api/mock.js'

export default function Visits(){
  const { user } = useAuth()
  const [objectId, setObjectId] = useState('')
  const [items, setItems] = useState([])
  useEffect(()=>{ getVisits({ role: user?.role, object_id: objectId||undefined }).then(r=>setItems(r.items)) }, [user, objectId])

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
        <thead><tr><th>Дата</th><th>Роль</th><th>Объект</th><th>Статус</th></tr></thead>
        <tbody>
          {items.map(v=>(
            <tr key={v.id}><td>{v.date}</td><td>{v.role}</td><td>{v.object_id}</td><td>{v.status}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
