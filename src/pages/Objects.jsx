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
    const mineParam = user?.role === 'ssk' ? undefined : true
    getObjects({ mine: mineParam })
      .then(r => { console.log('[ui objects] response', r); setData(r.items||[]); })
      .catch(e => { console.warn('[ui objects] error', e); setData([]) })
      .finally(()=> setLoading(false))
  }, [user])

  const mine = useMemo(()=>{
    if(!user) return []
    // сервер уже вернул mine=true; оставим безопасную фильтрацию по вложенным объектам
    return data.filter(o => {
      if(user.role==='ssk') return (o.ssk && (o.ssk.id === user.id)) || true
      if(user.role==='iko') return (o.iko && (o.iko.id === user.id)) || true
      if(user.role==='foreman') return (o.foreman && (o.foreman.id === user.id)) || true
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
                <span className={'status ' + (o.status==='active'?'green':'red')}>{o.status || '—'}</span>
              </div>
              <div className="row">
                <span>Прогресс</span><span style={{flex:1}}/><span className="muted">{(o.progress ?? 0)}%</span>
              </div>
              <Progress value={o.progress ?? 0} />
              <div className="row" style={{gap:10}}>
                <span className="pill">ССК: {o.ssk?.full_name || o.ssk?.email || '—'}</span>
                <span className="pill">ИКО: {o.iko?.full_name || o.iko?.email || '—'}</span>
                <span className="pill">Прораб: {o.foreman?.full_name || o.foreman?.email || '—'}</span>
              </div>
              <div className="row">
                <span className="pill">адрес: {o.address}</span>
                {o.deliveries_today!=null && <span className="pill">поставки сегодня: {o.deliveries_today}</span>}
                {o.visits && <span className="pill">посещения (ССК/ИКО/прораб): {o.visits?.ssk ?? 0}/{o.visits?.iko ?? 0}/{o.visits?.foreman ?? 0}</span>}
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