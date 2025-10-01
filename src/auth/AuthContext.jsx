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

    // Логин через реальный бэк: /auth/login (+ /users/me)
    const login = async (email, password) => {
        const api = await import('../api/api.js') // у нас тут теперь реальный API-клиент
        const loginRes = await api.apiLogin({ email, password })
        let profile = loginRes && loginRes.user
        if (!profile) {
            try { profile = await api.apiMe() } catch (e) {}
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
    }

    // Выход: /auth/logout + чистка локального состояния
    const logout = () => {
        import('../api/api.js').then(m => m.apiLogout()).catch(() => {})
        localStorage.removeItem('ccj_user')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
