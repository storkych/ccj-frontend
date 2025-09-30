
import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { confirmViolation, declineViolation, getViolation, submitViolationReport } from '../api/mock.js'

export default function ViolationDetail(){
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const [v, setV] = useState(null)
  const [text, setText] = useState('')

  async function load(){ setV(await getViolation(id)) }
  useEffect(()=>{ load() }, [id])

  async function sendReport(e){
    e.preventDefault()
    await submitViolationReport({ id, text })
    setText('')
    load()
  }

  async function confirm(){ await confirmViolation({ id }); load() }
  async function decline(){ await declineViolation({ id }); load() }

  if(!v) return null
  const frozen = false

  return (
    <div className="page">
      <div className="row" style={{gap:12, alignItems:'center'}}>
        <Link to="/violations" className="link">← Назад</Link>
        <h1 style={{margin:0}}>Нарушение: {v.title}</h1>
        <span className="pill">{v.status}</span>
      </div>
      <div className="card">
        <div className="row"><b>Объект:</b> {v.object_id}</div>
        <div className="row"><b>Описание:</b> {v.description}</div>
      </div>

      {user?.role==='foreman' && v.status==='open' && (
        <form className="form card" onSubmit={sendReport}>
          <h3>Отчет об устранении</h3>
          <textarea className="input" rows="4" placeholder="Опишите выполненные работы..." value={text} onChange={e=>setText(e.target.value)} />
          <div className="row" style={{justifyContent:'flex-end'}}><button className="btn">Отправить отчет</button></div>
        </form>
      )}

      {(user?.role==='ssk' || user?.role==='iko') && (
        <div className="row" style={{gap:8}}>
          {v.status!=='closed' && <button className="btn" onClick={confirm}>Подтвердить устранение</button>}
          {v.status!=='open' && <button className="btn ghost" onClick={decline}>Отклонить</button>}
          {frozen && <Link className="btn ghost" to="/visits/new">Заявка на посещение</Link>}
        </div>
      )}
    </div>
  )
}
