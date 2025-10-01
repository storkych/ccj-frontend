
import React, { useState } from 'react'
import { aiChat } from '../api/api.js'

export default function AIChat(){
  const [objectId, setObjectId] = useState('')
  const [input, setInput] = useState('')
  const [log, setLog] = useState([])

  async function send(e){
    e.preventDefault()
    if(!input.trim()) return
    setLog(l => [...l, { who:'me', text: input }])
    const r = await aiChat({ object_id: objectId || null, message: input })
    setLog(l => [...l, { who:'ai', text: r.reply }])
    setInput('')
  }

  return (
    <div className="page">
      <h1>ИИ чат</h1>
      <div className="row">
        <label style={{width:160}}>Объект</label>
        <select className="input" value={objectId} onChange={e=>setObjectId(e.target.value)}>
          <option value="">— любой —</option>
          <option value="o1">ЖК «Река»</option>
          <option value="o2">Мост М7</option>
          <option value="o3">БЦ «Север»</option>
        </select>
      </div>
      <div className="card" style={{minHeight:220, display:'flex', flexDirection:'column', gap:8}}>
        <div style={{flex:1, display:'flex', flexDirection:'column', gap:8}}>
          {log.map((m,i)=>(
            <div key={i} className="row"><b style={{width:80}}>{m.who==='me'?'Вы':'ИИ'}</b><div>{m.text}</div></div>
          ))}
          {log.length===0 && <div className="muted">Начните диалог — вопрос по объекту, срокам, рискам...</div>}
        </div>
        <form onSubmit={send} className="row">
          <input className="input" placeholder="Напишите сообщение..." value={input} onChange={e=>setInput(e.target.value)} />
          <button className="btn">Отправить</button>
        </form>
      </div>
    </div>
  )
}
