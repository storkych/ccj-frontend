
import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getNotifications, markNotificationRead } from '../api/api.js'

export default function Notifications(){
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ 
    if(user) {
      setLoading(true)
      getNotifications(user.id).then(r=>{
        console.log('[ui notifications] loaded', r)
        setItems(r.notifications || [])
      }).catch(e=>{
        console.warn('[ui notifications] error', e)
        setItems([])
      }).finally(()=>setLoading(false))
    }
  }, [user])

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id)
        // Обновляем локальное состояние
        setItems(prev => prev.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ))
      } catch (e) {
        console.warn('[ui notifications] mark read error', e)
        alert('Ошибка при отметке уведомления как прочитанного')
      }
    }
  }

  return (
    <div className="page">
      <h1>Уведомления</h1>
      {loading ? (
        <div className="muted">Загрузка уведомлений...</div>
      ) : (
        <div className="list">
          {items.map(n=>(
            <article 
              key={n.id} 
              className={`card row ${n.is_read ? '' : 'unread'}`}
              style={{
                cursor: 'pointer',
                backgroundColor: n.is_read ? 'var(--panel)' : 'var(--bg-light)',
                border: n.is_read ? '1px solid var(--border)' : '1px solid var(--brand)',
                opacity: n.is_read ? 0.7 : 1
              }}
              onClick={() => handleNotificationClick(n)}
            >
              <div style={{flex: 1}}>
                <div style={{fontWeight: n.is_read ? 'normal' : '600', marginBottom: 4}}>
                  {n.subject}
                </div>
                {n.body && (
                  <div style={{fontSize: '14px', color: 'var(--muted)', marginBottom: 8}}>
                    {n.body}
                  </div>
                )}
                <div style={{fontSize: '12px', color: 'var(--muted)'}}>
                  {new Date(n.created_at).toLocaleString('ru-RU')}
                </div>
              </div>
              {!n.is_read && (
                <div style={{
                  width: 8,
                  height: 8,
                  backgroundColor: 'var(--brand)',
                  borderRadius: '50%',
                  marginLeft: 8
                }} />
              )}
            </article>
          ))}
          {items.length===0 && <div className="muted">Нет уведомлений.</div>}
        </div>
      )}
    </div>
  )
}
