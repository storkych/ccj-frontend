
import React, { useEffect, useState } from 'react'
import { getMemos } from '../api/api.js'

export default function Memos(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ 
    setLoading(true)
    getMemos().then(r=>{
      console.log('[ui memos] loaded', r)
      if (r.success && r.memos) {
        setItems(r.memos)
      } else {
        setItems([])
      }
    }).catch(e=>{
      console.warn('[ui memos] error', e)
      setItems([])
    }).finally(()=>setLoading(false))
  }, [])

  return (
    <div className="page">
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 20px',
          color: 'var(--muted)',
          fontSize: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid var(--muted)',
              borderTop: '2px solid var(--brand)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Загрузка методичек...
          </div>
        </div>
      ) : (
        <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px'}}>
          {items.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--muted)',
              fontSize: '16px',
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{fontSize: '48px', marginBottom: '16px', opacity: 0.5}}>📄</div>
              <div>Методички не найдены</div>
            </div>
          ) : (
            items.map(memo => (
              <article key={memo.id} className="card" style={{
                padding: '24px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow)'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  <div style={{flex: 1}}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, var(--brand), #ffb454)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        color: '#111',
                        fontWeight: '700',
                        boxShadow: '0 4px 12px rgba(255,138,0,.3)'
                      }}>
                        📄
                      </div>
                      <div style={{flex: 1}}>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          margin: '0 0 4px 0',
                          color: 'var(--text)',
                          lineHeight: '1.3'
                        }}>
                          {memo.title}
                        </h3>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--muted)',
                          fontWeight: '500'
                        }}>
                          {new Date(memo.created_at).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {memo.description && (
                      <div style={{
                        color: 'var(--muted)',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        marginBottom: '16px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {memo.description}
                      </div>
                    )}
                  </div>
                  
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border)'
                  }}>
                    <a 
                      href={memo.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn"
                      style={{
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        padding: '12px 16px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 12px 25px rgba(255,138,0,.35)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(255,138,0,.25)'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Скачать документ
                    </a>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  )
}
