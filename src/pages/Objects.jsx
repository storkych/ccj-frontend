import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { getObjects } from '../api/mock.js'

function Progress({ value }){
  return <div className="progress"><span style={{width: value+'%'}}/></div>
}

export default function Objects(){
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [sskFilter, setSskFilter] = useState('all') // all|ready|active|not_ready

  useEffect(()=>{
    getObjects().then(r => { setData(r.items); setLoading(false) })
  }, [])

  const mine = useMemo(()=>{
    if(!user) return []
    return data.filter(o => {
      if(user.role==='ssk') return o.ssk_id === user.id
      if(user.role==='iko') return o.iko_id === user.id
      if(user.role==='foreman') return o.foreman_id === user.id
      return true
    })
  }, [data, user])

  const filtered = useMemo(()=>{
    if(user?.role!=='ssk' || sskFilter==='all') return mine
    return mine.filter(o => o.activation_state === sskFilter)
  }, [mine, user, sskFilter])

  return (
    <div className="page">
      <h1>Объекты</h1>
      {user?.role==='ssk' && (
        <div className="row" style={{gap:8}}>
          <label className="muted" style={{width:160}}>Фильтр активации</label>
          <select className="input" value={sskFilter} onChange={e=>setSskFilter(e.target.value)}>
            <option value="all">Все</option>
            <option value="ready">Готов к активации</option>
            <option value="active">Активирован</option>
            <option value="not_ready">Не готов к активации</option>
          </select>
        </div>
      )}
      {loading ? <div className="muted">Загрузка...</div> : (
        <div className="object-list">
          {filtered.map(o => (
            <article key={o.id} className="card">
              <div className="row" style={{justifyContent:'space-between'}}>
                <h3 style={{margin:0}}>{o.name}</h3>
                <span className={'status ' + (o.status==='active'?'green':'red')}>{o.status}</span>
              </div>
              <div className="row">
                <span>Прогресс</span><span style={{flex:1}}/><span className="muted">{o.progress}%</span>
              </div>
              <Progress value={o.progress} />
              <div className="row" style={{gap:10}}>
                <span className="pill">ССК: {o.ssk}</span>
                <span className="pill">ИКО: {o.iko}</span>
                <span className="pill">Прораб: {o.foreman || '—'}</span>
              </div>
              <div className="row">
                <span className="pill">адрес: {o.address}</span>
                <span className="pill">поставки сегодня: {o.deliveries_today}</span>
                <span className="pill">посещения (ССК/ИКО/прораб): {o.visits.ssk}/{o.visits.iko}/{o.visits.foreman}</span>
              </div>
              <div className="row" style={{marginTop:10, justifyContent:'flex-end'}}>
                <Link className="link" to={`/objects/${o.id}`}>Открыть карточку →</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}