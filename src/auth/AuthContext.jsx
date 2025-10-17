import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem('ccj_user')
            return raw ? JSON.parse(raw) : null
        } catch (e) {
            return null
        }
    })

    const login = async (email, password) => {
        try {
            const api = await import('../api/api.js')
            const loginRes = await api.apiLogin({ email, password })
            
            if (!loginRes || !loginRes.access) {
                throw new Error('Неверный email или пароль')
            }
            
            let profile = loginRes && loginRes.user
            if (!profile) {
                try { 
                    profile = await api.apiMe() 
                } catch (e) {
                    console.warn('Не удалось получить профиль пользователя:', e)
                }
            }
            
            const data = {
                id: profile?.id || 'me',
                role: profile?.role || 'foreman',
                email: profile?.email || email,
                full_name: profile?.full_name || profile?.name || email,
            }
            localStorage.setItem('ccj_user', JSON.stringify(data))
            setUser(data)
            return data
        } catch (error) {
            throw error
        }
    }

    const logout = () => {
        import('../api/api.js').then(m => m.apiLogout()).catch(() => {})
        localStorage.removeItem('ccj_user')
        localStorage.removeItem('ccj_tokens')
        setUser(null)
    }

    const forceLogout = () => {
        localStorage.removeItem('ccj_user')
        localStorage.removeItem('ccj_tokens')
        setUser(null)
        window.location.href = '/login'
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, forceLogout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
