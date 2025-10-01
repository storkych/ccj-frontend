import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { getObjects } from '../api/api.js'

function Progress({ value }){
  return <div className="progress"><span style={{width: value+'%'}}/></div>
}

function getStatusInfo(status) {
  const statusMap = {
    'draft': { label: 'Черновик', color: '#ea580c', bgColor: '#fff7ed' },
    'activation_pending': { label: 'Ожидает активации', color: '#ca8a04', bgColor: '#fefce8' },
    'active': { label: 'Активен', color: '#15803d', bgColor: '#f0fdf4' },
    'suspended': { label: 'Приостановлен', color: '#ca8a04', bgColor: '#fefce8' },
    'completed': { label: 'Завершён', color: '#1d4ed8', bgColor: '#eff6ff' }
  }
  return statusMap[status] || { label: status || '—', color: '#6b7280', bgColor: '#f9fafb' }
}

function ObjectCard({ obj }){
  const statusInfo = getStatusInfo(obj.status)
  
  return (
    <article className="card">
      <div className="row" style={{justifyContent:'space-between', marginBottom:12, alignItems:'center'}}>
        <div className="row" style={{gap:8, alignItems:'center'}}>
          <h3 style={{margin:0}}>{obj.name}</h3>
          <div style={{padding:'4px 8px', backgroundColor:'var(--bg-light)', border:'1px solid var(--border)', borderRadius:'6px', fontSize:'13px', color:'var(--text)', fontWeight:'500'}}>
            📍 {obj.address}
          </div>
        </div>
        <div style={{
          padding:'4px 8px', 
          backgroundColor: statusInfo.bgColor, 
          color: statusInfo.color, 
          borderRadius:'6px', 
          fontSize:'12px', 
          fontWeight:'600',
          border: `1px solid ${statusInfo.color}30`
        }}>
          {statusInfo.label}
        </div>
      </div>
      <div className="row" style={{marginBottom:8}}>
        <span>Прогресс</span><span style={{flex:1}}/><span className="muted">{(obj.work_progress ?? 0)}%</span>
      </div>
      <Progress value={obj.work_progress ?? 0} />
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
    return mine.filter(o => o.status === sskFilter)
  }, [mine, user, sskFilter])

  const filteredSskObjects = useMemo(()=>{
    if(user?.role !== 'ssk') return { assigned: [], available: [] }
    if(sskFilter === 'all') return sskObjects
    
    const filterByActivation = (objects) => objects.filter(o => o.status === sskFilter)
    
    return {
      assigned: filterByActivation(sskObjects.assigned),
      available: filterByActivation(sskObjects.available)
    }
  }, [sskObjects, sskFilter, user])

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
              Мои объекты ({filteredSskObjects.assigned.length})
            </button>
            <button 
              className={activeTab === 'available' ? 'btn' : 'btn ghost'} 
              onClick={()=>setActiveTab('available')}
            >
              Доступные ({filteredSskObjects.available.length})
            </button>
          </div>
          <div className="row" style={{gap:8}}>
            <label className="muted" style={{width:160}}>Фильтр активации</label>
            <select className="input" value={sskFilter} onChange={e=>setSskFilter(e.target.value)}>
              <option value="all">Все</option>
              <option value="draft">Черновик</option>
              <option value="activation_pending">Ожидает активации</option>
              <option value="active">Активен</option>
              <option value="suspended">Приостановлен</option>
              <option value="completed">Завершён</option>
            </select>
          </div>
        </div>
      )}
      {loading ? <div className="muted">Загрузка...</div> : (
        <>
          {user?.role === 'ssk' ? (
            <div className="object-list" style={{marginTop:20}}>
              {activeTab === 'assigned' && filteredSskObjects.assigned.map(o => <ObjectCard key={o.id} obj={o} />)}
              {activeTab === 'available' && filteredSskObjects.available.map(o => <ObjectCard key={o.id} obj={o} />)}
              {activeTab === 'assigned' && filteredSskObjects.assigned.length === 0 && (
                <div className="muted" style={{textAlign:'center', padding:'40px'}}>
                  {sskFilter === 'all' ? 'У вас пока нет назначенных объектов' : 'Нет объектов с выбранным статусом активации'}
                </div>
              )}
              {activeTab === 'available' && filteredSskObjects.available.length === 0 && (
                <div className="muted" style={{textAlign:'center', padding:'40px'}}>
                  {sskFilter === 'all' ? 'Нет доступных объектов для назначения' : 'Нет доступных объектов с выбранным статусом активации'}
                </div>
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