import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }){
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem('ccj_user')
        return raw ? JSON.parse(raw) : null
    })

    const login = async (email, password) => {
        // роль из почты (мок)
        const role = email.startsWith('admin') ? 'admin'
            : email.startsWith('ssk') ? 'ssk'
                : email.startsWith('iko') ? 'iko'
                    : 'foreman'

        // стабильные id и имена для фильтрации «своих» объектов
        const uidMap = { ssk: 'ssk1', iko: 'iko1', foreman: 'f1', admin: 'admin1' }
        const nameMap = {
            ssk: 'Анна Соколова',
            iko: 'Илья Орлов',
            foreman: 'Иван Петров',
            admin: 'Администратор'
        }

        const data = {
            id: uidMap[role],
            role,
            email,
            full_name: nameMap[role]
        }

        localStorage.setItem('ccj_user', JSON.stringify(data))
        setUser(data)
        return data
    }

    const logout = () => {
        localStorage.removeItem('ccj_user')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(){ return useContext(AuthContext) }
