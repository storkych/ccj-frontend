import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Login(){
  const { login } = useAuth()
  const [email, setEmail] = useState('ssk@demo.io')
  const [password, setPassword] = useState('demo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/objects'

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      nav(from, { replace: true })
    } catch (err) {
      setError(err?.message || 'Ошибка входа. Проверьте email и пароль.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{display:'grid',placeItems:'center', minHeight:'100vh'}}>
      <form className="card" style={{width:380}} onSubmit={onSubmit}>
        <h2 style={{marginTop:0}}>Вход в систему</h2>
        <div className="form">
          <input className="input" placeholder="Email"
                 value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Пароль" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <div style={{color:'var(--red)', fontSize:'14px', marginBottom:'8px'}}>{error}</div>}
          <button className="btn" disabled={loading}>{loading?'Входим…':'Войти'}</button>
        </div>
      </form>
    </div>
  )
}
