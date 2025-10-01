
import React, { useEffect, useState } from 'react'
import { getMemos } from '../api/api.js'

export default function Memos(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ 
    setLoading(true)
    getMemos().then(r=>{
      console.log('[ui memos] loaded', r)
      setItems(r.memos || [])
    }).catch(e=>{
      console.warn('[ui memos] error', e)
      setItems([])
    }).finally(()=>setLoading(false))
  }, [])

  return (
    <div className="page">
      <h1>Методички</h1>
      {loading ? (
        <div className="muted">Загрузка методичек...</div>
      ) : (
        <div className="list">
          {items.map(memo => (
            <article key={memo.id} className="card" style={{padding: 16}}>
              <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                <div style={{flex: 1}}>
                  <div style={{fontSize: '18px', fontWeight: '600', marginBottom: 4}}>
                    📋 {memo.title}
                  </div>
                  {memo.description && (
                    <div style={{color: 'var(--muted)', marginBottom: 8, fontSize: '14px'}}>
                      {memo.description}
                    </div>
                  )}
                  <div style={{fontSize: '12px', color: 'var(--muted)'}}>
                    Создано: {new Date(memo.created_at).toLocaleDateString('ru-RU')} • Автор: {memo.created_by}
                  </div>
                </div>
                <div className="row" style={{gap: 12, alignItems: 'center'}}>
                  <a 
                    href={memo.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn"
                    style={{textDecoration: 'none'}}
                  >
                    📥 Скачать
                  </a>
                </div>
              </div>
            </article>
          ))}
          {items.length === 0 && <div className="muted">Нет методичек.</div>}
        </div>
      )}
    </div>
  )
}
