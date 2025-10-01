
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViolations } from '../api/mock.js'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Violations(){
  const { user } = useAuth()
  const [objectId, setObjectId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [items, setItems] = useState([])
  const [objects, setObjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ 
    const loadData = async () => {
      setLoading(true)
      try {
        const violationsRes = await getViolations({ object_id: objectId||undefined })
        setItems(violationsRes.items || [])
        // Извлекаем уникальные объекты из нарушений для фильтрации
        const uniqueObjects = []
        const seenIds = new Set()
        violationsRes.items?.forEach(violation => {
          if (violation.object && typeof violation.object === 'object' && !seenIds.has(violation.object.id)) {
            uniqueObjects.push(violation.object)
            seenIds.add(violation.object.id)
          }
        })
        setObjects(uniqueObjects)
      } catch (e) {
        console.warn('[ui violations] error', e)
        setItems([])
        setObjects([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [objectId])

  // Фильтрация по статусу на фронте
  const filteredItems = items.filter(item => {
    if (!statusFilter) return true
    return item.status === statusFilter
  })

  const getObjectName = (obj) => {
    if (typeof obj === 'object' && obj.name && obj.address) {
      return `${obj.name} (${obj.address})`
    }
    if (typeof obj === 'number') {
      const foundObj = objects.find(o => o.id === obj)
      return foundObj ? `${foundObj.name} (${foundObj.address})` : `Объект #${obj}`
    }
    return `Объект #${obj}`
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      'open': { label: 'Открыто', color: '#ef4444' },
      'fixed': { label: 'Исправлено', color: '#f59e0b' },
      'awaiting_verification': { label: 'Ожидает проверки', color: '#f59e0b' },
      'verified': { label: 'Проверено', color: '#10b981' },
      'closed': { label: 'Закрыто', color: '#6b7280' }
    }
    return statusMap[status] || { label: status, color: '#6b7280' }
  }

  return (
    <div className="page">
      <h1>Нарушения</h1>
      <div className="row" style={{gap: 32, marginBottom: 16}}>
        <div className="row" style={{gap: 8}}>
          <label>Объект</label>
          <select className="input" value={objectId} onChange={e=>setObjectId(e.target.value)}>
            <option value="">Все объекты</option>
            {objects.map(obj => (
              <option key={obj.id} value={obj.id}>
                {obj.name} - {obj.address}
              </option>
            ))}
          </select>
        </div>
        <div className="row" style={{gap: 8}}>
          <label>Статус</label>
          <select className="input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="">Все статусы</option>
            <option value="open">Открыто</option>
            <option value="awaiting_verification">Ожидает проверки</option>
            <option value="verified">Проверено</option>
            <option value="closed">Закрыто</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="muted">Загрузка нарушений...</div>
      ) : (
        <div className="list">
          {filteredItems.map(v=>{
            const statusInfo = getStatusInfo(v.status)
            return (
              <article key={v.id} className="card" style={{padding: 16}}>
                <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: '18px', fontWeight: '600', marginBottom: 4}}>
                      {v.title}
                    </div>
                    <div style={{color: 'var(--muted)', marginBottom: 8}}>
                      {getObjectName(v.object)}
                    </div>
                    {v.description && (
                      <div style={{color: 'var(--text)', fontSize: '14px', lineHeight: '1.4'}}>
                        {v.description.length > 150 ? `${v.description.substring(0, 150)}...` : v.description}
                      </div>
                    )}
                  </div>
                  <div className="row" style={{gap: 12, alignItems: 'center'}}>
                    <span 
                      className="pill" 
                      style={{
                        backgroundColor: statusInfo.color + '20',
                        color: statusInfo.color,
                        border: `1px solid ${statusInfo.color}40`
                      }}
                    >
                      {statusInfo.label}
                    </span>
                    <Link className="btn ghost" to={`/violations/${v.id}`}>
                      Открыть
                    </Link>
                  </div>
                </div>
                
                <div className="row" style={{gap: 16, fontSize: '12px', color: 'var(--muted)'}}>
                  <span>Создано: {new Date(v.created_at).toLocaleDateString('ru-RU')}</span>
                  {v.requires_stop && <span style={{color: '#ef4444'}}>⚠️ Требует остановки работ</span>}
                  {v.requires_personal_recheck && <span style={{color: '#f59e0b'}}>👁️ Требует личной проверки</span>}
                </div>
              </article>
            )
          })}
          {filteredItems.length===0 && <div className="muted">Нет нарушений.</div>}
        </div>
      )}
    </div>
  )
}
