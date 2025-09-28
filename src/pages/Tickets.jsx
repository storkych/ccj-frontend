
import React, { useEffect, useState } from 'react'
import { createTicket, getTickets } from '../api/mock.js'

export default function Tickets(){
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [objectId, setObjectId] = useState('')

  async function load(){ const r = await getTickets(); setItems(r.items) }
  useEffect(()=>{ load() }, [])

  async function submit(e){
    e.preventDefault()
    await createTicket({ title, body, object_id: objectId||null })
    setTitle(''); setBody(''); setObjectId('')
    load()
  }

  return (
    <div className="page">
      <h1>Тикеты</h1>
      <form className="form card" onSubmit={submit}>
        <div className="row"><label style={{width:160}}>Заголовок</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)} required/></div>
        <div className="row"><label style={{width:160}}>Объект</label>
          <select className="input" value={objectId} onChange={e=>setObjectId(e.target.value)}>
            <option value="">— не указан —</option>
            <option value="o1">ЖК «Река»</option>
            <option value="o2">Мост М7</option>
            <option value="o3">БЦ «Север»</option>
          </select>
        </div>
        <textarea className="input" rows="4" placeholder="Опишите проблему..." value={body} onChange={e=>setBody(e.target.value)} />
        <div className="row" style={{justifyContent:'flex-end'}}><button className="btn">Отправить тикет</button></div>
      </form>

      <h2>Мои заявки</h2>
      <div className="list">
        {items.map(t=>(
          <article key={t.id} className="card row">
            <div><b>{t.title}</b><div className="muted">{t.body}</div></div>
            <div className="pill">{t.status}</div>
          </article>
        ))}
      </div>
    </div>
  )
}
