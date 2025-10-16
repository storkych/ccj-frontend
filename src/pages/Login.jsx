import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Login(){
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/objects'

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Валидация полей
    if (!email.trim()) {
      setError('Введите email')
      setLoading(false)
      return
    }
    if (!password.trim()) {
      setError('Введите пароль')
      setLoading(false)
      return
    }
    
    try {
      await login(email, password)
      nav(from, { replace: true })
    } catch (err) {
      let errorMessage = 'Ошибка входа'
      
      if (err?.message) {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Неверный email или пароль'
        } else if (err.message.includes('422')) {
          errorMessage = 'Некорректные данные. Проверьте формат email'
        } else if (err.message.includes('429')) {
          errorMessage = 'Слишком много попыток входа. Попробуйте позже'
        } else if (err.message.includes('500')) {
          errorMessage = 'Ошибка сервера. Попробуйте позже'
        } else if (err.message.includes('Network')) {
          errorMessage = 'Ошибка сети. Проверьте подключение к интернету'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'grid', 
      placeItems: 'center', 
      minHeight: '100vh',
      background: 'radial-gradient(1200px 600px at 20% -10%, rgba(255,138,0,.08), transparent 60%), var(--bg)'
    }}>
      <form className="card" style={{
        width: 380,
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 10px 30px rgba(0,0,0,.35)'
      }} onSubmit={onSubmit}>
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <img src="/src/assets/logo.svg" alt="ITC СтройКонтроль" style={{
            width: 48,
            height: 48,
            marginBottom: '16px'
          }} />
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--text)'
          }}>Вход в систему</h2>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '14px',
            color: 'var(--muted)'
          }}>ITC СтройКонтроль</p>
        </div>
        
        <div className="form">
          <div style={{ marginBottom: '16px' }}>
            <input 
              className="input" 
              placeholder="Email"
              type="email"
              value={email} 
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <input 
              className="input" 
              type="password" 
              placeholder="Пароль" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            />
          </div>
          
          {error && (
            <div style={{
              color: '#ef4444',
              fontSize: '14px',
              marginBottom: '16px',
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          <button 
            className="btn" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: loading ? 'var(--muted)' : 'var(--brand)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Входим…' : 'Войти'}
          </button>
        </div>
      </form>
    </div>
  )
}
