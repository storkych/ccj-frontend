
import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getSchedules } from '../api/mock.js'

export default function WorkSchedule(){
  const { user } = useAuth()
  const [objectId, setObjectId] = useState('')
  const [items, setItems] = useState([])
  const [onlyMine, setOnlyMine] = useState(false)
  useEffect(()=>{ getSchedules({ object_id: objectId||undefined }).then(r=>setItems(r.items)) }, [objectId])

  const shown = (onlyMine && user?.role==='foreman') ? items.filter(i=>i.assignee===user.id) : items

  return (
    <div className="page">
      <h1>График работ</h1>
      <div className="row">
        <label style={{width:160}}>Объект</label>
        <select className="input" value={objectId} onChange={e=>setObjectId(e.target.value)}>
          <option value="">Все объекты</option>
          <option value="o1">ЖК «Река»</option>
          <option value="o2">Мост М7</option>
          <option value="o3">БЦ «Север»</option>
        </select>
      </div>
      {user?.role==='foreman' && (
        <div className="row" style={{gap:8}}>
          <label className="pill">Показывать:</label>
          <button className={"btn small"+(onlyMine?"":" ghost")} onClick={()=>setOnlyMine(true)}>Только мои</button>
          <button className={"btn small"+(!onlyMine?"":" ghost")} onClick={()=>setOnlyMine(false)}>Все</button>
        </div>
      )}
      <table className="table">
        <thead><tr><th>Этап</th><th>Объект</th><th>Исполнитель</th><th>Сроки</th></tr></thead>
        <tbody>
          {shown.map(i=>(
            <tr key={i.id}>
              <td>{i.title}</td>
              <td>{i.object_id}</td>
              <td>{i.assignee}</td>
              <td>{i.start} → {i.end}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
