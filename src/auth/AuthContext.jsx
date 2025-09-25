import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }){
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ccj_user')
    return raw ? JSON.parse(raw) : null
  })

  const login = async (email, password) => {
    // mock auth: role by email prefix
    const role = email.startsWith('admin') ? 'admin'
      : email.startsWith('ssk') ? 'ssk'
      : email.startsWith('iko') ? 'iko'
      : 'foreman'
    const data = { id:'u1', email, role, full_name:'Demo User' }
    localStorage.setItem('ccj_user', JSON.stringify(data))
    setUser(data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('ccj_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(){ return useContext(AuthContext) }
