import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { getObjects } from '../api/api.js'

function Progress({ value }){
  return <div className="progress"><span style={{width: value+'%'}}/></div>
}

function getStatusInfo(status, obj = null) {
  const statusMap = {
    'draft': { label: 'Новый', color: '#ea580c', bgColor: '#fff7ed' },
    'activation_pending': { 
      label: obj?.iko ? 'Ожидает подтверждения активации' : 'Ожидает активации', 
      color: '#ca8a04', 
      bgColor: '#fefce8' 
    },
    'active': { label: 'Активен', color: '#15803d', bgColor: '#f0fdf4' },
    'suspended': { label: 'Приостановлен', color: '#ca8a04', bgColor: '#fefce8' },
    'completed': { label: 'Завершён', color: '#6b7280', bgColor: '#f9fafb' }
  }
  return statusMap[status] || { label: status || '—', color: '#6b7280', bgColor: '#f9fafb' }
}

function ObjectCard({ obj }){
  const statusInfo = getStatusInfo(obj.status, obj)
  
  return (
    <Link 
      to={`/objects/${obj.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <article className="card object-card" style={{
        padding: 0,
        position: 'relative',
        borderLeft: `4px solid ${statusInfo.color}`,
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
      {/* Цветная полоса сверху */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${statusInfo.color}, ${statusInfo.color}80)`,
        boxShadow: `0 0 8px ${statusInfo.color}40`
      }} />
      
      <div style={{padding: '20px', flex: 1, display: 'flex', flexDirection: 'column'}}>
        {/* Заголовок и статус */}
        <div className="row" style={{justifyContent:'space-between', marginBottom:16, alignItems:'flex-start'}}>
          <div style={{flex: 1}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 8}}>
              <h3 style={{margin:0, fontSize:'18px', fontWeight:'600', color:'var(--text)'}}>{obj.name}</h3>
              <div style={{color: 'var(--muted)', fontSize: '14px'}}>
                {obj.address}
              </div>
            </div>
          </div>
          <div style={{
            padding:'4px 12px',
            borderRadius:'20px',
            background: `${statusInfo.color}15`,
            color: statusInfo.color,
            fontSize:'12px',
            fontWeight:'600',
            border: `1px solid ${statusInfo.color}30`
          }}>
            {statusInfo.label}
          </div>
        </div>

        {/* Прогресс */}
        <div style={{marginBottom: 20}}>
          <div className="row" style={{marginBottom:8, alignItems:'center'}}>
            <span style={{fontSize:'14px', fontWeight:'500', color:'var(--text)'}}>Прогресс работ</span>
            <span style={{flex:1}}/>
            <span style={{fontSize:'14px', fontWeight:'600', color: statusInfo.color}}>{(obj.work_progress ?? 0)}%</span>
          </div>
          <div style={{
            height: '8px',
            background: 'var(--bg-secondary)',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              height: '100%',
              width: `${obj.work_progress ?? 0}%`,
              background: `linear-gradient(90deg, ${statusInfo.color}, ${statusInfo.color}80)`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Роли */}
        <div style={{marginBottom: 16, marginTop: 'auto'}}>
          <div className="row" style={{gap:12, justifyContent:'space-between'}}>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:'11px', color:'var(--muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px'}}>ССК</div>
              <div style={{
                fontSize:'13px',
                fontWeight: obj.ssk ? '500' : '400',
                color: obj.ssk ? 'var(--text)' : 'var(--muted)'
              }}>
                {obj.ssk?.full_name || obj.ssk?.email || 'Не назначен'}
              </div>
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:'11px', color:'var(--muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px'}}>ИКО</div>
              <div style={{
                fontSize:'13px',
                fontWeight: obj.iko ? '500' : '400',
                color: obj.iko ? 'var(--text)' : 'var(--muted)'
              }}>
                {obj.iko?.full_name || obj.iko?.email || 'Не назначен'}
              </div>
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:'11px', color:'var(--muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px'}}>Прораб</div>
              <div style={{
                fontSize:'13px',
                fontWeight: obj.foreman ? '500' : '400',
                color: obj.foreman ? 'var(--text)' : 'var(--muted)'
              }}>
                {obj.foreman?.full_name || obj.foreman?.email || 'Не назначен'}
              </div>
            </div>
          </div>
        </div>

        {/* Дополнительная информация */}
        {(obj.deliveries_today!=null || obj.visits) && (
          <div style={{marginTop: 'auto', marginBottom: 16, paddingTop: 12, borderTop: '1px solid var(--border)'}}>
            <div className="row" style={{gap:8, flexWrap:'wrap'}}>
              {obj.deliveries_today!=null && (
                <span style={{
                  padding:'4px 8px',
                  background:'var(--bg-secondary)',
                  color:'var(--text)',
                  borderRadius:'6px',
                  fontSize:'11px',
                  fontWeight:'500',
                  border:'1px solid var(--border)'
                }}>
                  Поставки сегодня: {obj.deliveries_today}
                </span>
              )}
              {obj.visits && (
                <span style={{
                  padding:'4px 8px',
                  background:'var(--bg-secondary)',
                  color:'var(--text)',
                  borderRadius:'6px',
                  fontSize:'11px',
                  fontWeight:'500',
                  border:'1px solid var(--border)'
                }}>
                  👥 Посещения: {obj.visits?.ssk ?? 0}/{obj.visits?.iko ?? 0}/{obj.visits?.foreman ?? 0}
                </span>
              )}
            </div>
          </div>
        )}

      </div>
      </article>
    </Link>
  )
}

export default function Objects(){
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [sskFilter, setSskFilter] = useState('all') // all|ready|active|not_ready
  const [activeTab, setActiveTab] = useState('assigned') // assigned|available
  const [searchQuery, setSearchQuery] = useState('')

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
    let result = mine
    
    // Фильтр по статусу
    if(sskFilter !== 'all') {
      result = result.filter(o => o.status === sskFilter)
    }
    
    // Поиск по названию
    if(searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(o => 
        o.name?.toLowerCase().includes(query) || 
        o.address?.toLowerCase().includes(query)
      )
    }
    
    return result
  }, [mine, sskFilter, searchQuery])

  const filteredSskObjects = useMemo(()=>{
    if(user?.role !== 'ssk') return { assigned: [], available: [] }
    
    const applyFilters = (objects) => {
      let result = objects
      
      // Фильтр по статусу
      if(sskFilter !== 'all') {
        result = result.filter(o => o.status === sskFilter)
      }
      
      // Поиск по названию
      if(searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        result = result.filter(o => 
          o.name?.toLowerCase().includes(query) || 
          o.address?.toLowerCase().includes(query)
        )
      }
      
      return result
    }
    
    return {
      assigned: applyFilters(sskObjects.assigned),
      available: applyFilters(sskObjects.available)
    }
  }, [sskObjects, sskFilter, searchQuery, user])

  return (
    <div className="page">
      
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          {/* Вкладки только для ССК */}
          {user?.role === 'ssk' && (
            <div style={{
              display: 'flex',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              padding: '2px',
              border: '1px solid var(--border)',
              width: 'fit-content'
            }}>
              <button 
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'assigned' ? 'var(--brand)' : 'transparent',
                  color: activeTab === 'assigned' ? 'white' : 'var(--text)',
                  fontWeight: '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: '120px',
                  justifyContent: 'center'
                }}
                onClick={()=>setActiveTab('assigned')}
                onMouseEnter={(e) => {
                  if (activeTab !== 'assigned') {
                    e.target.style.background = 'var(--bg)';
                    e.target.style.color = 'var(--brand)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'assigned') {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'var(--text)';
                  }
                }}
              >
                Мои объекты
                <span style={{
                  background: activeTab === 'assigned' ? 'rgba(255,255,255,0.2)' : 'var(--brand)20',
                  color: activeTab === 'assigned' ? 'white' : 'var(--brand)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {filteredSskObjects.assigned.length}
                </span>
              </button>
              <button 
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'available' ? 'var(--brand)' : 'transparent',
                  color: activeTab === 'available' ? 'white' : 'var(--text)',
                  fontWeight: '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: '120px',
                  justifyContent: 'center'
                }}
                onClick={()=>setActiveTab('available')}
                onMouseEnter={(e) => {
                  if (activeTab !== 'available') {
                    e.target.style.background = 'var(--bg)';
                    e.target.style.color = 'var(--brand)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'available') {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'var(--text)';
                  }
                }}
              >
                Доступные
                <span style={{
                  background: activeTab === 'available' ? 'rgba(255,255,255,0.2)' : 'var(--brand)20',
                  color: activeTab === 'available' ? 'white' : 'var(--brand)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {filteredSskObjects.available.length}
                </span>
              </button>
            </div>
          )}

          {/* Фильтры для всех ролей */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flex: 1,
            minWidth: '400px',
            flexWrap: 'wrap'
          }}>
            {/* Поиск по названию */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flex: 1,
              minWidth: '200px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text)',
                fontWeight: '500',
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                Поиск:
              </div>
              <input 
                type="text"
                className="input" 
                value={searchQuery} 
                onChange={e=>setSearchQuery(e.target.value)}
                placeholder="Название или адрес объекта..."
                style={{
                  flex: 1,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontWeight: '400'
                }}
              />
            </div>

            {/* Фильтр по статусу */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text)',
                fontWeight: '500',
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
                </svg>
                Статус:
              </div>
              <select 
                className="input" 
                value={sskFilter} 
                onChange={e=>setSskFilter(e.target.value)}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontWeight: '400',
                  minWidth: '140px'
                }}
              >
                <option value="all">Все</option>
                <option value="draft">Новый</option>
                <option value="activation_pending">Ожидает активации</option>
                <option value="active">Активен</option>
                <option value="suspended">Приостановлен</option>
                <option value="completed">Завершён</option>
              </select>
            </div>

            {/* Счетчик */}
            <div style={{
              fontSize: '11px',
              color: 'var(--muted)',
              background: 'var(--bg-secondary)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              whiteSpace: 'nowrap'
            }}>
              {user?.role === 'ssk' 
                ? (activeTab === 'assigned' ? filteredSskObjects.assigned.length : filteredSskObjects.available.length)
                : filtered.length
              } шт.
            </div>
          </div>
        </div>
      </div>
      {loading ? <div className="muted">Загрузка...</div> : (
        <>
          {user?.role === 'ssk' ? (
            <div className="object-list" style={{marginTop:20}}>
              {activeTab === 'assigned' && filteredSskObjects.assigned.map(o => <ObjectCard key={o.id} obj={o} />)}
              {activeTab === 'available' && filteredSskObjects.available.map(o => <ObjectCard key={o.id} obj={o} />)}
              {activeTab === 'assigned' && filteredSskObjects.assigned.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'var(--panel)',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  margin: '20px 0'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    border: '1px solid var(--border)'
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                  </div>
                  <h3 style={{margin: '0 0 8px 0', color: 'var(--text)', fontSize: '18px', fontWeight: '600'}}>
                    {sskFilter === 'all' ? 'Нет назначенных объектов' : 'Нет объектов с выбранным статусом'}
                  </h3>
                  <p style={{margin: 0, color: 'var(--muted)', fontSize: '14px'}}>
                    {sskFilter === 'all' 
                      ? 'Когда вам назначат объекты, они появятся здесь' 
                      : 'Попробуйте изменить фильтр или выбрать другую вкладку'
                    }
                  </p>
                </div>
              )}
              {activeTab === 'available' && filteredSskObjects.available.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'var(--panel)',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  margin: '20px 0'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    border: '1px solid var(--border)'
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                  </div>
                  <h3 style={{margin: '0 0 8px 0', color: 'var(--text)', fontSize: '18px', fontWeight: '600'}}>
                    {sskFilter === 'all' ? 'Нет доступных объектов' : 'Нет доступных объектов с выбранным статусом'}
                  </h3>
                  <p style={{margin: 0, color: 'var(--muted)', fontSize: '14px'}}>
                    {sskFilter === 'all' 
                      ? 'Все объекты уже назначены или находятся в работе' 
                      : 'Попробуйте изменить фильтр или выбрать другую вкладку'
                    }
                  </p>
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