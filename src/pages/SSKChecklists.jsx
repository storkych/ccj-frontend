
import React, { useEffect, useState } from 'react'
import { getDailyChecklists, markDailyChecklistReviewed } from '../api/api.js'

export default function SSKChecklists(){
  const [items, setItems] = useState([])
  async function load(){ const r = await getDailyChecklists(); setItems(r.items) }
  useEffect(()=>{ load() }, [])
  async function mark(id){ await markDailyChecklistReviewed({ id }); load() }
  return (
    <div className="page">
      <h1>Чек-листы прорабов</h1>
      <table className="table">
        <thead><tr><th>Дата</th><th>Объект</th><th>Прораб</th><th>Статус</th><th></th></tr></thead>
        <tbody>
          {items.map(c=>(
            <tr key={c.id}>
              <td>{c.date}</td>
              <td>{c.object_id}</td>
              <td>{c.foreman}</td>
              <td>{c.status}</td>
              <td>{c.status!=='reviewed' && <button className="btn small" onClick={()=>mark(c.id)}>Отметить "просмотрено"</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
