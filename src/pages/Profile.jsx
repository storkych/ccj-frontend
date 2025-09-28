
import React from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getEnv } from '../api/mock.js'

export default function Profile(){
  const { user, logout } = useAuth()
  const env = getEnv()
  if(!user) return null
  return (
    <div className="page">
      <h1>Профиль</h1>
      <div className="card">
        <div className="row"><b>ФИО:</b> {user.full_name}</div>
        <div className="row"><b>Роль:</b> {user.role}</div>
        <div className="row"><b>API URL:</b> {env.api_url}</div>
        <div className="row"><b>Сборка:</b> {env.build_mode}</div>
        <div className="row"><button className="btn" onClick={logout}>Выйти</button></div>
      </div>
    </div>
  )
}
