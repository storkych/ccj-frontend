import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { getObjects } from '../api/mock.js'

function Progress({ value }){
  return <div className="progress"><span style={{width: value+'%'}}/></div>
}

function ObjectCard({ obj }){
  return (
    <article className="card">
      <div className="row" style={{justifyContent:'space-between', marginBottom:12, alignItems:'center'}}>
        <div className="row" style={{gap:8, alignItems:'center'}}>
          <h3 style={{margin:0}}>{obj.name}</h3>
          <div style={{padding:'4px 8px', backgroundColor:'var(--bg-light)', border:'1px solid var(--border)', borderRadius:'6px', fontSize:'13px', color:'var(--text)', fontWeight:'500'}}>
            📍 {obj.address}
          </div>
        </div>
        <span className={'status ' + (obj.status==='active'?'green':'red')}>{obj.status || '—'}</span>
      </div>
      <div className="row" style={{marginBottom:8}}>
        <span>Прогресс</span><span style={{flex:1}}/><span className="muted">{(obj.progress ?? 0)}%</span>
      </div>
      <Progress value={obj.progress ?? 0} />
      <div style={{marginTop:16, marginBottom:12}}>
        <div className="row" style={{gap:8, justifyContent:'space-between'}}>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:'12px', color:'var(--muted)', marginBottom:2}}>ССК</div>
            <div style={{fontSize:'13px'}}>{obj.ssk?.full_name || obj.ssk?.email || '—'}</div>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:'12px', color:'var(--muted)', marginBottom:2}}>ИКО</div>
            <div style={{fontSize:'13px'}}>{obj.iko?.full_name || obj.iko?.email || '—'}</div>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:'12px', color:'var(--muted)', marginBottom:2}}>Прораб</div>
            <div style={{fontSize:'13px'}}>{obj.foreman?.full_name || obj.foreman?.email || '—'}</div>
          </div>
        </div>
        {(obj.deliveries_today!=null || obj.visits) && (
          <div className="row" style={{gap:8, marginTop:8, flexWrap:'wrap'}}>
            {obj.deliveries_today!=null && <span className="pill">Поставки сегодня: {obj.deliveries_today}</span>}
            {obj.visits && <span className="pill">Посещения: {obj.visits?.ssk ?? 0}/{obj.visits?.iko ?? 0}/{obj.visits?.foreman ?? 0}</span>}
          </div>
        )}
      </div>
      <div className="row" style={{marginTop:10, justifyContent:'flex-end'}}>
        <Link className="link" to={`/objects/${obj.id}`}>Открыть карточку →</Link>
      </div>
    </article>
  )
}

export default function Objects(){
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [sskFilter, setSskFilter] = useState('all') // all|ready|active|not_ready
  const [activeTab, setActiveTab] = useState('assigned') // assigned|available

  useEffect(()=>{
    const mineParam = user?.role === 'ssk' ? undefined : true
    getObjects({ mine: mineParam })
      .then(r => { console.log('[ui objects] response', r); setData(r.items||[]); })
      .catch(e => { console.warn('[ui objects] error', e); setData([]) })
      .finally(()=> setLoading(false))
  }, [user])

  const mine = useMemo(()=>{
    if(!user) return []
    // для ССК показываем все объекты, для остальных - только свои
    if(user.role==='ssk') return data
    return data.filter(o => {
      if(user.role==='iko') return (o.iko && (o.iko.id === user.id)) || true
      if(user.role==='foreman') return (o.foreman && (o.foreman.id === user.id)) || true
      return true
    })
  }, [data, user])

  const sskObjects = useMemo(()=>{
    if(user?.role !== 'ssk') return { assigned: [], available: [] }
    return {
      assigned: mine.filter(o => o.ssk && o.ssk.id === user.id),
      available: mine.filter(o => !o.ssk)
    }
  }, [mine, user])

  const filtered = useMemo(()=>{
    if(user?.role!=='ssk') return mine
    if(sskFilter==='all') return mine
    return mine.filter(o => o.activation_state === sskFilter)
  }, [mine, user, sskFilter])

  return (
    <div className="page">
      <h1>Объекты</h1>
      {user?.role==='ssk' && (
        <div className="row" style={{gap:16, alignItems:'center'}}>
          <div className="row" style={{gap:8}}>
            <button 
              className={activeTab === 'assigned' ? 'btn' : 'btn ghost'} 
              onClick={()=>setActiveTab('assigned')}
            >
              Мои объекты ({sskObjects.assigned.length})
            </button>
            <button 
              className={activeTab === 'available' ? 'btn' : 'btn ghost'} 
              onClick={()=>setActiveTab('available')}
            >
              Доступные ({sskObjects.available.length})
            </button>
          </div>
          <div className="row" style={{gap:8}}>
            <label className="muted" style={{width:160}}>Фильтр активации</label>
            <select className="input" value={sskFilter} onChange={e=>setSskFilter(e.target.value)}>
              <option value="all">Все</option>
              <option value="ready">Готов к активации</option>
              <option value="active">Активирован</option>
              <option value="not_ready">Не готов к активации</option>
            </select>
          </div>
        </div>
      )}
      {loading ? <div className="muted">Загрузка...</div> : (
        <>
          {user?.role === 'ssk' ? (
            <div className="object-list" style={{marginTop:20}}>
              {activeTab === 'assigned' && sskObjects.assigned.map(o => <ObjectCard key={o.id} obj={o} />)}
              {activeTab === 'available' && sskObjects.available.map(o => <ObjectCard key={o.id} obj={o} />)}
              {activeTab === 'assigned' && sskObjects.assigned.length === 0 && (
                <div className="muted" style={{textAlign:'center', padding:'40px'}}>У вас пока нет назначенных объектов</div>
              )}
              {activeTab === 'available' && sskObjects.available.length === 0 && (
                <div className="muted" style={{textAlign:'center', padding:'40px'}}>Нет доступных объектов для назначения</div>
              )}
            </div>
          ) : (
            <div className="object-list" style={{marginTop:20}}>
              {filtered.map(o => <ObjectCard key={o.id} obj={o} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}