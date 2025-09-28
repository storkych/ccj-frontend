
import React, { useEffect, useState } from 'react'
import { getMemos } from '../api/mock.js'

export default function Memos(){
  const [items, setItems] = useState([])
  useEffect(()=>{ getMemos().then(r=>setItems(r.items)) }, [])
  return (
    <div className="page">
      <h1>Памятки</h1>
      <div className="list">
        {items.map(doc=>(
          <article key={doc.id} className="card row">
            <div>📄 {doc.name}</div>
            <span className="muted">{doc.size||''}</span>
          </article>
        ))}
        {items.length===0 && <div className="muted">Нет файлов.</div>}
      </div>
    </div>
  )
}
