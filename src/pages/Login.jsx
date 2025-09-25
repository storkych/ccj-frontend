import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Login(){
  const { login } = useAuth()
  const [email, setEmail] = useState('ssk@demo.io')
  const [password, setPassword] = useState('demo')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/objects'

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await login(email, password)
    setLoading(false)
    nav(from, { replace: true })
  }

  return (
    <div style={{display:'grid',placeItems:'center', minHeight:'100vh'}}>
      <form className="card" style={{width:380}} onSubmit={onSubmit}>
        <h2 style={{marginTop:0}}>Вход в систему</h2>
        <div className="form">
          <input className="input" placeholder="Email (admin|ssk|iko|foreman)@demo.io"
                 value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Пароль" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="btn" disabled={loading}>{loading?'Входим…':'Войти'}</button>
          <p style={{color:'var(--muted)'}}>Подсказка: роли выбираются по префиксу email: <b>admin@</b>, <b>ssk@</b>, <b>iko@</b>, <b>foreman@</b></p>
        </div>
      </form>
    </div>
  )
}
