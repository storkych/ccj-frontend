
import React, { useState } from 'react'
import { createTicket } from '../api/api.js'
import { useAuth } from '../auth/AuthContext.jsx'
import NotificationToast from '../components/NotificationToast.jsx'
import { useNotification } from '../hooks/useNotification.js'

export default function Tickets(){
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const { notification, showSuccess, showError, hide } = useNotification()

  async function submit(e){
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      showError('Заполните все поля')
      return
    }
    setSaving(true)
    hide()
    try {
      await createTicket({
        title: title.trim(),
        description: description.trim(),
        from_user: `${user?.full_name || user?.email || 'Пользователь'} (Основной монолит)`,
        access_token: localStorage.getItem('access_token')
      })
      showSuccess('Тикет успешно отправлен! Ответ придёт на вашу почту.')
      setTitle('')
      setDescription('')
    } catch (e) {
      showError('Ошибка отправки тикета: ' + (e?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <NotificationToast 
        notification={notification} 
        onClose={hide} 
      />
      
      <div className="card" style={{
        padding: 0,
        position: 'relative',
        borderLeft: '4px solid var(--brand)',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, var(--brand), var(--brand)80)',
          boxShadow: '0 0 8px var(--brand)40'
        }} />
        
        <div style={{padding: '24px'}}>
          <div style={{marginBottom: '24px'}}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--text)',
              lineHeight: '1.2'
            }}>
              Создать заявку в техподдержку
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '14px',
              color: 'var(--muted)',
              lineHeight: '1.3'
            }}>
              Опишите проблему и мы поможем её решить
            </p>
          </div>

          <form onSubmit={submit}>
            <div style={{marginBottom: '20px'}}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '14px',
                color: 'var(--text)'
              }}>
                Тема обращения *
              </label>
              <input 
                className="input" 
                value={title} 
                onChange={e=>setTitle(e.target.value)} 
                placeholder="Кратко опишите проблему"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  transition: 'all 0.2s ease'
                }}
              />
            </div>

            <div style={{marginBottom: '24px'}}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '14px',
                color: 'var(--text)'
              }}>
                Описание проблемы *
              </label>
              <textarea 
                className="input" 
                rows={6} 
                placeholder="Подробно опишите проблему, укажите шаги для воспроизведения, приложите скриншоты если необходимо..."
                value={description} 
                onChange={e=>setDescription(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: '1.5'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)'
            }}>
              <button 
                type="submit" 
                className="btn" 
                disabled={saving || !title.trim() || !description.trim()}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  background: saving || !title.trim() || !description.trim() 
                    ? 'var(--muted)' 
                    : 'var(--brand)',
                  color: 'white',
                  border: 'none',
                  cursor: saving || !title.trim() || !description.trim() 
                    ? 'not-allowed' 
                    : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {saving ? 'Отправляем...' : 'Отправить заявку'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card" style={{
        padding: '20px',
        background: 'var(--bg-light)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'var(--brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            i
          </div>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text)'
          }}>
            Информация о поддержке
          </h3>
        </div>
        
        <div style={{
          display: 'grid',
          gap: '12px',
          fontSize: '14px',
          lineHeight: '1.5',
          color: 'var(--muted)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--brand)'
            }} />
            <span><strong>Время ответа:</strong> в течение 24 часов в рабочие дни</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--brand)'
            }} />
            <span><strong>Приоритет:</strong> критичные проблемы решаются в первую очередь</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--brand)'
            }} />
            <span><strong>Ответ:</strong> придёт на вашу электронную почту</span>
          </div>
        </div>
      </div>
    </div>
  )
}
