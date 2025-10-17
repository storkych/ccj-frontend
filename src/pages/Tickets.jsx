
import React, { useState } from 'react'
import { createTicket } from '../api/api.js'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Tickets(){
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e){
    e.preventDefault()
    if (!title.trim() || !description.trim()) return alert('Заполните все поля')
    setSaving(true)
    try {
      await createTicket({
        title: title.trim(),
        description: description.trim(),
        from_user: `${user?.full_name || user?.email || 'Пользователь'} (Основной монолит)`,
        access_token: localStorage.getItem('access_token')
      })
      alert('Тикет успешно отправлен! Ответ придёт на вашу почту.')
      setTitle('')
      setDescription('')
    } catch (e) {
      alert('Ошибка отправки тикета: ' + (e?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="card" style={{padding: 20, marginBottom: 20}}>
        <h2 style={{marginTop: 0, marginBottom: 16, fontSize: '20px'}}>Создать заявку</h2>
        <form onSubmit={submit}>
          <div style={{marginBottom: 16}}>
            <label style={{display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '14px'}}>
              Тема обращения *
            </label>
            <input 
              className="input" 
              value={title} 
              onChange={e=>setTitle(e.target.value)} 
              placeholder="Кратко опишите проблему"
              required
              style={{width: '100%', padding: '8px 12px'}}
            />
          </div>

          <div style={{marginBottom: 20}}>
            <label style={{display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '14px'}}>
              Описание проблемы *
            </label>
            <textarea 
              className="input" 
              rows={6} 
              placeholder="Подробно опишите проблему, укажите шаги для воспроизведения, приложите скриншоты если необходимо..."
              value={description} 
              onChange={e=>setDescription(e.target.value)}
              required
              style={{width: '100%', padding: '8px 12px', resize: 'vertical'}}
            />
          </div>

          <div className="row" style={{justifyContent: 'flex-end', gap: 12}}>
            <button 
              type="submit" 
              className="btn" 
              disabled={saving || !title.trim() || !description.trim()}
            >
              {saving ? 'Отправляем...' : '📤 Отправить заявку'}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{padding: 16, backgroundColor: 'var(--bg-light)'}}>
        <h3 style={{marginTop: 0, marginBottom: 12, color: 'var(--brand)'}}>ℹ️ Информация</h3>
        <div style={{fontSize: '14px', lineHeight: '1.5', color: 'var(--muted)'}}>
          <p style={{margin: '0 0 8px 0'}}>
            <strong>Время ответа:</strong> в течение 24 часов в рабочие дни
          </p>
          <p style={{margin: '0 0 8px 0'}}>
            <strong>Приоритет:</strong> критичные проблемы решаются в первую очередь
          </p>
          <p style={{margin: '0'}}>
            <strong>Ответ:</strong> придёт на вашу электронную почту
          </p>
        </div>
      </div>
    </div>
  )
}
