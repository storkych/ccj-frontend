
import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getNotifications } from '../api/mock.js'

export default function Notifications(){
  const { user } = useAuth()
  const [items, setItems] = useState([])
  useEffect(()=>{ if(user) getNotifications(user.role).then(r=>setItems(r.items)) }, [user])
  return (
    <div className="page">
      <h1>Уведомления</h1>
      <div className="list">
        {items.map(n=>(
          <article key={n.id} className="card row">
            <div>{n.text}</div>
            <span className="muted">{new Date(n.created_at).toLocaleString()}</span>
          </article>
        ))}
        {items.length===0 && <div className="muted">Нет уведомлений.</div>}
      </div>
    </div>
  )
}
