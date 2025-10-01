import React, { useState } from 'react'
import { createDailyChecklist } from '../api/api.js'

const QUESTIONS = [
  { id:'q1', text:'Периметр ограждён и подсвечен' },
  { id:'q2', text:'СИЗ выданы и используются' },
  { id:'q3', text:'Техника исправна, допуски проверены' },
  { id:'q4', text:'Мусор вывезен, опасные зоны размечены' },
  { id:'q5', text:'Погодные условия не мешают' },
]

export default function DailyChecklist(){
  const [objectId, setObjectId] = useState('o1')
  const [answers, setAnswers] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null)

  const setAnswer = (id, val) => setAnswers(a => ({ ...a, [id]: val }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = QUESTIONS.map(q => ({ id:q.id, answer:answers[q.id] || 'n/a' }))
    const res = await createDailyChecklist({ object_id: objectId, answers: payload })
    setSaved(res)
    setSaving(false)
  }

  return (
    <section className="card">
      <h2 style={{marginTop:0}}>Ежедневный чек-лист</h2>
      <form className="form" onSubmit={submit}>
        <div className="row">
          <label style={{width:160}}>Объект</label>
          <select className="input" value={objectId} onChange={e=>setObjectId(e.target.value)}>
            <option value="o1">ЖК «Река»</option>
            <option value="o2">Мост М7</option>
            <option value="o3">БЦ «Север»</option>
          </select>
        </div>
        <div className="card">
          {QUESTIONS.map(q => (
            <div key={q.id} className="row" style={{justifyContent:'space-between', marginBottom:8}}>
              <div>{q.text}</div>
              <div className="row">
                <label><input type="radio" name={q.id} onChange={()=>setAnswer(q.id,'yes')} /> да</label>
                <label style={{marginLeft:10}}><input type="radio" name={q.id} onChange={()=>setAnswer(q.id,'no')} /> нет</label>
                <label style={{marginLeft:10}}><input type="radio" name={q.id} onChange={()=>setAnswer(q.id,'na')} /> не требуется</label>
              </div>
            </div>
          ))}
        </div>
        <div className="row" style={{justifyContent:'flex-end'}}>
          <button className="btn" disabled={saving}>{saving?'Отправляем…':'Отправить чек-лист'}</button>
        </div>
      </form>
      {saved && <p className="pill" style={{marginTop:12}}>Отчёт отправлен: #{saved.id} — статус: {saved.status}</p>}
    </section>
  )
}
