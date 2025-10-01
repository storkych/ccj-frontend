
import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getVisits, createVisit, getObjects } from '../api/mock.js'

export default function Visits(){
  const { user } = useAuth()
  const [objectId, setObjectId] = useState('')
  const [items, setItems] = useState([])
  const [objects, setObjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [visitData, setVisitData] = useState({
    object_id: '',
    visit_date: new Date().toISOString().split('T')[0]
  })
  const [saving, setSaving] = useState(false)

  useEffect(()=>{ 
    const loadData = async () => {
      setLoading(true)
      try {
        const [visitsRes, objectsRes] = await Promise.all([
          getVisits({ user_id: user?.id, object_id: objectId||undefined }),
          getObjects()
        ])
        setItems(visitsRes.sessions || [])
        setObjects(objectsRes.items || [])
      } catch (e) {
        console.warn('[ui visits] error', e)
        setItems([])
        setObjects([])
      } finally {
        setLoading(false)
      }
    }
    if (user) loadData()
  }, [user, objectId])

  const handleCreateVisit = async (e) => {
    e.preventDefault()
    if (!visitData.object_id || !visitData.visit_date) return alert('Заполните все поля')
    setSaving(true)
    try {
      await createVisit({
        user_id: user.id,
        user_role: user.role,
        object_id: Number(visitData.object_id),
        visit_date: visitData.visit_date
      })
      alert('Посещение создано')
      setCreateModalOpen(false)
      setVisitData({ object_id: '', visit_date: new Date().toISOString().split('T')[0] })
      // Перезагружаем данные
      const visitsRes = await getVisits({ user_id: user.id, object_id: objectId||undefined })
      setItems(visitsRes.sessions || [])
    } catch (e) {
      alert('Ошибка создания посещения: ' + (e?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  const getObjectName = (objId) => {
    const obj = objects.find(o => o.id === objId)
    return obj ? `${obj.name} (${obj.address})` : `Объект #${objId}`
  }

  const getRoleLabel = (role) => {
    const roleMap = {
      'ssk': 'ССК',
      'iko': 'ИКО', 
      'foreman': 'Прораб'
    }
    return roleMap[role] || role
  }

  return (
    <div className="page">
      <div className="row" style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
        <h1 style={{margin: 0}}>Посещения</h1>
        {(user?.role === 'ssk' || user?.role === 'iko') && (
          <button className="btn" onClick={() => setCreateModalOpen(true)}>
            Создать посещение
          </button>
        )}
      </div>

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
      </div>
      
      {loading ? (
        <div className="muted">Загрузка посещений...</div>
      ) : (
        <div className="list">
          {items.map(v => (
            <article key={v.id} className="card" style={{padding: 16}}>
              <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                <div style={{flex: 1}}>
                  <div style={{fontSize: '18px', fontWeight: '600', marginBottom: 4}}>
                    {getObjectName(v.object_id)}
                  </div>
                  <div style={{color: 'var(--muted)', marginBottom: 8}}>
                    Дата: {new Date(v.visit_date).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div className="row" style={{gap: 12, alignItems: 'center'}}>
                  <span className="pill" style={{
                    backgroundColor: 'var(--brand)20',
                    color: 'var(--brand)',
                    border: '1px solid var(--brand)40'
                  }}>
                    {getRoleLabel(v.user_role)}
                  </span>
                </div>
              </div>
            </article>
          ))}
          {items.length === 0 && <div className="muted">Нет посещений.</div>}
        </div>
      )}

      {/* Модальное окно создания посещения */}
      {createModalOpen && (
        <div className="modal-backdrop" onClick={() => setCreateModalOpen(false)} style={{zIndex: 9998}}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{width: '90vw', maxWidth: '90vw', zIndex: 9999}}>
            <div style={{padding: 20}}>
              <div className="row" style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                <h2>Создать посещение</h2>
                <button onClick={() => setCreateModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer'}}>✕</button>
              </div>
              
              <form onSubmit={handleCreateVisit}>
                <div style={{marginBottom: 16}}>
                  <label style={{display: 'block', marginBottom: 8, fontWeight: 600}}>Объект *</label>
                  <select 
                    className="input" 
                    value={visitData.object_id} 
                    onChange={e => setVisitData(prev => ({...prev, object_id: e.target.value}))}
                    required
                  >
                    <option value="">Выберите объект</option>
                    {objects.map(obj => (
                      <option key={obj.id} value={obj.id}>
                        {obj.name} - {obj.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{marginBottom: 20}}>
                  <label style={{display: 'block', marginBottom: 8, fontWeight: 600}}>Дата посещения *</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={visitData.visit_date} 
                    onChange={e => setVisitData(prev => ({...prev, visit_date: e.target.value}))}
                    required
                  />
                </div>

                <div className="row" style={{gap: 12, justifyContent: 'flex-end'}}>
                  <button type="button" onClick={() => setCreateModalOpen(false)} className="btn ghost">
                    Отмена
                  </button>
                  <button type="submit" className="btn" disabled={saving || !visitData.object_id || !visitData.visit_date}>
                    {saving ? 'Создаём...' : 'Создать посещение'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
